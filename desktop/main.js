const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;
const userData = app.getPath('userData');
const statePath = path.join(userData, 'state.json');
const syncPath = path.join(userData, 'sync.json');
const floatPath = path.join(userData, 'float.json');

let mainWindow = null;
let floatWindow = null;
let tray = null;

/* ---------- file store ---------- */
function readJSON(p, def = {}) {
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) { console.error('readJSON', p, e.message); }
  return def;
}
function writeJSON(p, data) {
  try {
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
    return true;
  } catch (e) { console.error('writeJSON', p, e.message); return false; }
}

const store = {
  state: readJSON(statePath, { notes: [], todos: [], events: [], meta: {} }),
  sync: readJSON(syncPath, { enabled: false, key: '', binId: '', lastSync: 0 }),
  float: readJSON(floatPath, { x: null, y: null, minimized: false })
};

function saveState() { writeJSON(statePath, store.state); }
function saveSync() { writeJSON(syncPath, store.sync); }
function saveFloat() { writeJSON(floatPath, store.float); }

/* ---------- migration ---------- */
function tryAutoImport() {
  const candidates = [
    path.join(process.cwd(), 'cloudworkbench_backup.json'),
    path.join(process.resourcesPath, 'cloudworkbench_backup.json'),
    path.join(userData, 'cloudworkbench_backup.json')
  ];
  for (const backupPath of candidates) {
    if (!fs.existsSync(backupPath)) continue;
    try {
      const payload = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      if (payload.data) {
        store.state = Object.assign({ notes: [], todos: [], events: [], meta: {} }, payload.data);
        saveState();
      }
      if (payload.sync) {
        store.sync = Object.assign({ enabled: false, key: '', binId: '', lastSync: 0 }, payload.sync);
        saveSync();
      }
      // rename to avoid re-import
      const donePath = backupPath.replace(/\.json$/, '_imported_' + Date.now() + '.json');
      fs.renameSync(backupPath, donePath);
      console.log('migration imported from', backupPath);
      return { ok: true, path: backupPath, renamed: donePath };
    } catch (e) { console.error('migration failed', backupPath, e.message); }
  }
  return { ok: false };
}

function importFromPath(p) {
  const payload = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (payload.data) {
    store.state = Object.assign({ notes: [], todos: [], events: [], meta: {} }, payload.data);
    saveState();
  }
  if (payload.sync) {
    store.sync = Object.assign({ enabled: false, key: '', binId: '', lastSync: 0 }, payload.sync);
    saveSync();
  }
  broadcast('state-changed');
  return true;
}

function broadcast(channel, data) {
  [mainWindow, floatWindow].forEach(w => {
    if (w && !w.isDestroyed()) w.webContents.send(channel, data);
  });
}

/* ---------- windows ---------- */
function resolveAppFile(name) {
  // development: use workspace root
  if (isDev) return path.join(__dirname, '..', name);
  // packaged: extraResources copied files
  const packaged = path.join(process.resourcesPath, 'app', name);
  if (fs.existsSync(packaged)) return packaged;
  return path.join(__dirname, name);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 800,
    minHeight: 500,
    title: '云记事板',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    },
    show: false
  });

  const indexFile = resolveAppFile('index.html');
  mainWindow.loadFile(indexFile);

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('close', (e) => {
    if (process.platform === 'darwin') {
      mainWindow.hide();
    } else {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function createFloatWindow() {
  if (floatWindow && !floatWindow.isDestroyed()) return;
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const w = 320;
  const h = 420;
  const x = store.float.x != null ? store.float.x : (sw - w - 20);
  const y = store.float.y != null ? store.float.y : (sh - h - 80);

  floatWindow = new BrowserWindow({
    width: w,
    height: h,
    x, y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    minimizable: true,
    maximizable: false,
    show: false,
    opacity: 0.92,
    webPreferences: {
      preload: path.join(__dirname, 'preload-float.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  floatWindow.loadFile(path.join(__dirname, 'float.html'));

  floatWindow.once('ready-to-show', () => {
    if (!store.float.minimized) floatWindow.show();
  });

  floatWindow.on('moved', () => {
    const [x, y] = floatWindow.getPosition();
    store.float.x = x; store.float.y = y; saveFloat();
  });

  floatWindow.on('closed', () => { floatWindow = null; });
}

function toggleFloatWindow() {
  if (!floatWindow || floatWindow.isDestroyed()) {
    createFloatWindow();
    return;
  }
  if (floatWindow.isVisible()) {
    floatWindow.hide();
    store.float.minimized = true;
  } else {
    floatWindow.show();
    store.float.minimized = false;
  }
  saveFloat();
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray.png');
  tray = new Tray(fs.existsSync(iconPath) ? iconPath : path.join(__dirname, 'assets', 'icon.png'));
  tray.setToolTip('云记事板');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '打开主窗口', click: () => { if (mainWindow) mainWindow.show(); else createMainWindow(); } },
    { label: '显示/隐藏悬浮窗', click: toggleFloatWindow },
    { label: '导入迁移文件', click: async () => {
      const r = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] });
      if (!r.canceled && r.filePaths[0]) {
        importFromPath(r.filePaths[0]);
        dialog.showMessageBox({ type: 'info', message: '迁移文件已导入' });
      }
    } },
    { type: 'separator' },
    { label: '退出', click: () => { app.quit(); } }
  ]));
  tray.on('double-click', () => { if (mainWindow) mainWindow.show(); else createMainWindow(); });
}

/* ---------- ipc (sync localStorage bridge) ---------- */
ipcMain.on('store-get', (event, key) => {
  if (key === 'cloudworkbench_v1') event.returnValue = JSON.stringify(store.state);
  else if (key === 'cloudworkbench_sync_v1') event.returnValue = JSON.stringify(store.sync);
  else if (key === 'cw_float_pos') event.returnValue = JSON.stringify({ x: store.float.x, y: store.float.y, minimized: store.float.minimized });
  else if (key === 'cw_float_auto_open') event.returnValue = store.float.minimized ? '0' : '1';
  else if (key === 'cw_did') event.returnValue = store.sync.deviceId || 'desktop_' + Math.random().toString(36).slice(2, 10);
  else event.returnValue = null;
});

ipcMain.on('store-set', (event, key, value) => {
  try {
    if (key === 'cloudworkbench_v1') { store.state = JSON.parse(value); saveState(); broadcast('state-changed'); }
    else if (key === 'cloudworkbench_sync_v1') { store.sync = JSON.parse(value); saveSync(); }
    else if (key === 'cw_float_pos') { const p = JSON.parse(value); store.float.x = p.x; store.float.y = p.y; store.float.minimized = !!p.minimized; saveFloat(); }
    else if (key === 'cw_float_auto_open') { store.float.minimized = value !== '1'; saveFloat(); }
    else if (key === 'cw_did') { store.sync.deviceId = value; saveSync(); }
    event.returnValue = true;
  } catch (e) { console.error('store-set', e); event.returnValue = false; }
});

ipcMain.on('store-remove', (event, key) => {
  if (key === 'cloudworkbench_v1') { store.state = { notes: [], todos: [], events: [], meta: {} }; saveState(); }
  if (key === 'cloudworkbench_sync_v1') { store.sync = { enabled: false, key: '', binId: '', lastSync: 0 }; saveSync(); }
  event.returnValue = true;
});

ipcMain.handle('get-state', () => store.state);
ipcMain.handle('get-sync', () => store.sync);
ipcMain.handle('toggle-float', () => toggleFloatWindow());
ipcMain.handle('float-minimize', () => { if (floatWindow) { floatWindow.hide(); store.float.minimized = true; saveFloat(); } });
ipcMain.handle('float-show', () => { if (floatWindow) { floatWindow.show(); store.float.minimized = false; saveFloat(); } });

ipcMain.on('float-move', (_e, { x, y }) => {
  if (floatWindow && !floatWindow.isDestroyed()) floatWindow.setPosition(x, y);
});

ipcMain.on('float-resize', (_e, { width, height }) => {
  if (floatWindow && !floatWindow.isDestroyed()) floatWindow.setSize(width, height);
});

ipcMain.on('float-set-ignore-mouse', (_e, ignore) => {
  if (floatWindow && !floatWindow.isDestroyed()) floatWindow.setIgnoreMouseEvents(ignore, { forward: true });
});

/* ---------- app lifecycle ---------- */
app.whenReady().then(() => {
  const mig = tryAutoImport();
  createMainWindow();
  createFloatWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    else if (mainWindow) mainWindow.show();
  });

  if (mig.ok) {
    setTimeout(() => {
      dialog.showMessageBox(mainWindow, { type: 'info', title: '迁移完成', message: '已自动导入迁移文件，你的数据已恢复到桌面版。', detail: mig.path });
    }, 1200);
  }
});

app.on('window-all-closed', () => {
  // keep tray alive on windows/linux
});

app.on('before-quit', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
  if (floatWindow && !floatWindow.isDestroyed()) floatWindow.destroy();
});

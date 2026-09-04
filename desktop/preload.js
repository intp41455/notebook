const { contextBridge, ipcRenderer } = require('electron');

const desktopStorage = {
  getItem(key) {
    try {
      return ipcRenderer.sendSync('store-get', key);
    } catch (e) { return null; }
  },
  setItem(key, value) {
    try {
      ipcRenderer.sendSync('store-set', key, value);
    } catch (e) {}
  },
  removeItem(key) {
    try {
      ipcRenderer.sendSync('store-remove', key);
    } catch (e) {}
  },
  clear() {
    ipcRenderer.sendSync('store-remove', 'cloudworkbench_v1');
    ipcRenderer.sendSync('store-remove', 'cloudworkbench_sync_v1');
  },
  key(index) { return null; },
  get length() { return 4; }
};

contextBridge.exposeInMainWorld('__desktop', {
  storage: desktopStorage,
  isDesktop: true,
  toggleFloat: () => ipcRenderer.invoke('toggle-float'),
  onStateChanged: (cb) => ipcRenderer.on('state-changed', cb)
});

// Override localStorage as early as possible so index.html uses the file store.
window.addEventListener('DOMContentLoaded', () => {
  try {
    Object.defineProperty(window, 'localStorage', {
      value: window.__desktop.storage,
      configurable: true,
      writable: true
    });
  } catch (e) { console.error('override localStorage failed', e); }
});

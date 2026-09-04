const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('__desktopFloat', {
  getState: () => ipcRenderer.invoke('get-state'),
  getSync: () => ipcRenderer.invoke('get-sync'),
  onStateChanged: (cb) => ipcRenderer.on('state-changed', cb),
  moveTo: (x, y) => ipcRenderer.send('float-move', { x, y }),
  resizeTo: (width, height) => ipcRenderer.send('float-resize', { width, height }),
  setIgnoreMouse: (ignore) => ipcRenderer.send('float-set-ignore-mouse', ignore),
  minimize: () => ipcRenderer.invoke('float-minimize'),
  toggleMain: () => ipcRenderer.invoke('toggle-float')
});

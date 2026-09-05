const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('__desktopWelcome', {
  openBrowser: (url) => ipcRenderer.send('welcome-open-browser', url),
  importFile: () => ipcRenderer.invoke('welcome-import-file'),
  finish: () => ipcRenderer.send('welcome-finish')
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cbtAPI', {
  syncQuestions: () => ipcRenderer.invoke('sync-questions'),
  retrySync: () => ipcRenderer.invoke('retry-sync'),
  onSyncProgress: (callback) => ipcRenderer.on('sync-progress', (event, data) => callback(data)),
});

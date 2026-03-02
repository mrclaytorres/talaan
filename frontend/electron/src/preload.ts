require('./rt/electron-rt');
//////////////////////////////
// User Defined Preload scripts below

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronFS', {
  writeFile: (filePath: string, base64Data: string): Promise<string> =>
    ipcRenderer.invoke('fs:writeFile', filePath, base64Data),
  deleteFile: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('fs:deleteFile', filePath),
  mkdir: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke('fs:mkdir', dirPath),
  getAppDataPath: (): Promise<string> =>
    ipcRenderer.invoke('fs:getAppDataPath'),
});

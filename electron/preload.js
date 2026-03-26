const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  readImageFile: (filePath) => ipcRenderer.invoke('read-image-file', filePath),
  saveImageFile: (dirPath, fileName, base64Data, mimeType) => ipcRenderer.invoke('save-image-file', dirPath, fileName, base64Data, mimeType),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

  // 导出 PDF
  exportPDF: (htmlContent, title) => ipcRenderer.invoke('export-pdf', htmlContent, title),

  // 窗口控制
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
});
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: false,
    backgroundColor: '#1e1e1e',
    titleBarStyle: 'hidden',
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 保存窗口引用供 IPC 使用
  global.mainWindow = win;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for file operations
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const { dialog } = require('electron');
  const result = await dialog.showSaveDialog(options);
  return result;
});

// IPC handlers for window controls
ipcMain.handle('window-minimize', () => {
  if (global.mainWindow) {
    global.mainWindow.minimize();
  }
});

ipcMain.handle('window-maximize', () => {
  if (global.mainWindow) {
    if (global.mainWindow.isMaximized()) {
      global.mainWindow.unmaximize();
      return false;
    } else {
      global.mainWindow.maximize();
      return true;
    }
  }
  return false;
});

ipcMain.handle('window-close', () => {
  if (global.mainWindow) {
    global.mainWindow.close();
  }
});

ipcMain.handle('window-is-maximized', () => {
  if (global.mainWindow) {
    return global.mainWindow.isMaximized();
  }
  return false;
});

// IPC handler for PDF export
ipcMain.handle('export-pdf', async (event, htmlContent, title) => {
  const { dialog } = require('electron');
  
  try {
    // 显示保存对话框
    const result = await dialog.showSaveDialog({
      title: 'Export as PDF',
      defaultPath: `${title || 'document'}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    // 创建隐藏窗口渲染 HTML
    const pdfWindow = new BrowserWindow({
      width: 800,
      height: 1100,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // 加载 HTML 内容
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #24292f;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
          }
          h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
          h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
          h3 { font-size: 1.25em; }
          code {
            background: #f6f8fa;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'SF Mono', Consolas, monospace;
            font-size: 85%;
          }
          pre {
            background: #f6f8fa;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
          }
          pre code {
            background: none;
            padding: 0;
          }
          blockquote {
            border-left: 4px solid #dfe2e5;
            margin: 0;
            padding: 0 16px;
            color: #6a737d;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #dfe2e5;
            padding: 8px 12px;
          }
          th { background: #f6f8fa; }
          img { max-width: 100%; }
          a { color: #0366d6; text-decoration: none; }
        </style>
      </head>
      <body>${htmlContent}</body>
      </html>
    `;

    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);

    // 生成 PDF
    const pdfData = await pdfWindow.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: {
        top: 0.5,
        bottom: 0.5,
        left: 0.5,
        right: 0.5,
      },
    });

    // 关闭隐藏窗口
    pdfWindow.close();

    // 保存 PDF 文件
    await fs.promises.writeFile(result.filePath, pdfData);

    return { success: true, filePath: result.filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
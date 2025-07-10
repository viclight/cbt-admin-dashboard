const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const AutoLaunch = require('auto-launch');
const { syncQuestions } = require('./backend/syncQuestions');

let tray = null;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html'); // Or your React build output

  // Minimize to tray
  mainWindow.on('minimize', function (event) {
    event.preventDefault();
    mainWindow.hide();
  });

  // Restore from tray
  mainWindow.on('close', function (event) {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  // Setup tray icon
  tray = new Tray(path.join(__dirname, 'public', 'favicon.ico'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => { mainWindow.show(); } },
    { label: 'Quit', click: () => { app.isQuiting = true; app.quit(); } },
  ]);
  tray.setToolTip('CBT Student App');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow.show());

  // Sync on startup and send progress
  syncQuestionsWithProgress(mainWindow);

  // Manual sync from renderer
  ipcMain.handle('sync-questions', async () => {
    return await syncQuestionsWithProgress(mainWindow);
  });

  // Retry sync from renderer
  ipcMain.handle('retry-sync', async () => {
    return await syncQuestionsWithProgress(mainWindow);
  });
}

async function syncQuestionsWithProgress(win) {
  let lastError = null;
  try {
    win.webContents.send('sync-progress', { status: 'syncing', message: 'Syncing questions...' });
    const result = await syncQuestions((progress) => {
      win.webContents.send('sync-progress', progress);
    });
    win.webContents.send('sync-progress', { status: 'done', message: result });
    return result;
  } catch (err) {
    lastError = err;
    win.webContents.send('sync-progress', { status: 'error', message: err.message, canRetry: true });
    return err.message;
  }
}

// Auto-launch on startup
const autoLauncher = new AutoLaunch({
  name: 'CBT Student App',
});
autoLauncher.isEnabled().then((isEnabled) => {
  if (!isEnabled) autoLauncher.enable();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');

const developmentUrl = 'http://127.0.0.1:3000';

app.setName('AutoGestion Pro');

let mainWindow;
let updateStatus = { state: 'idle' };

const publishUpdateStatus = status => {
  updateStatus = status;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', status);
  }
};

const hasGitHubUpdateFeed = () => {
  let configuration;
  try {
    configuration = fs.readFileSync(path.join(process.resourcesPath, 'app-update.yml'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  const values = new Map(configuration.split(/\r?\n/).flatMap(line => {
    const match = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*?)\s*$/);
    return match ? [[match[1], match[2]]] : [];
  }));
  return values.get('provider') === 'github' && Boolean(values.get('owner')) && Boolean(values.get('repo'));
};

const checkForUpdates = () => {
  if (!app.isPackaged || process.platform !== 'win32') return;
  try {
    if (!hasGitHubUpdateFeed()) return;
  } catch (error) {
    console.error('Unable to read AutoGestion Pro update configuration:', error);
    publishUpdateStatus({ state: 'error', message: error.message });
    return;
  }
  void autoUpdater.checkForUpdates().catch(error => {
    console.error('Unable to check for AutoGestion Pro updates:', error);
    publishUpdateStatus({ state: 'error', message: error.message });
  });
};

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.on('checking-for-update', () => publishUpdateStatus({ state: 'checking' }));
autoUpdater.on('update-available', info => publishUpdateStatus({ state: 'available', version: info.version }));
autoUpdater.on('update-not-available', () => publishUpdateStatus({ state: 'not-available' }));
autoUpdater.on('download-progress', progress => publishUpdateStatus({
  state: 'downloading',
  percent: Math.round(progress.percent)
}));
autoUpdater.on('update-downloaded', info => publishUpdateStatus({ state: 'downloaded', version: info.version }));
autoUpdater.on('error', error => {
  console.error('Unable to update AutoGestion Pro:', error);
  publishUpdateStatus({ state: 'error', message: error.message });
});

ipcMain.handle('updater:get-status', () => updateStatus);
ipcMain.on('updater:check', checkForUpdates);
ipcMain.on('updater:install', () => {
  if (updateStatus.state === 'downloaded') autoUpdater.quitAndInstall();
});

const openExternalUrl = url => {
  try {
    const parsedUrl = new URL(url);
    if (['https:', 'tel:', 'mailto:'].includes(parsedUrl.protocol)) {
      void shell.openExternal(url).catch(error => {
        console.error('Unable to open external link:', error);
      });
    }
  } catch {
    // Ignore malformed navigation requests.
  }
};

const createWindow = async () => {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#f4f7fc',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow = window;
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null;
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternalUrl(url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (app.isPackaged) {
      try {
        if (fileURLToPath(url) === path.join(app.getAppPath(), 'dist', 'index.html')) return;
      } catch {
        // External URLs are opened below instead of inside the desktop window.
      }
    } else {
      try {
        if (new URL(url).origin === developmentUrl) return;
      } catch {
        // Invalid URLs are denied below.
      }
    }

    event.preventDefault();
    openExternalUrl(url);
  });

  if (app.isPackaged) {
    await window.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  } else {
    await window.loadURL(developmentUrl);
  }
};

app.whenReady().then(() => {
  void createWindow().catch(error => {
    console.error('Unable to open AutoGestion Pro:', error);
    app.quit();
  });

  if (app.isPackaged && process.platform === 'win32') {
    setTimeout(checkForUpdates, 5000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow().catch(error => {
        console.error('Unable to reopen AutoGestion Pro:', error);
      });
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

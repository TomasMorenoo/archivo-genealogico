import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import path from 'path';

interface StoreSchema {
  archivoRoot?: string;
}

const store = new Store<StoreSchema>();

let mainWindow: BrowserWindow | null = null;

async function startBackend(archivoRoot: string): Promise<void> {
  process.env.ARCHIVO_ROOT = archivoRoot;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serverPath = path.join(app.getAppPath(), 'backend', 'dist', 'server');
    await require(serverPath).startServer(3001);
  } catch (err) {
    dialog.showErrorBox(
      'Error al iniciar el servidor',
      `No se pudo iniciar el backend.\n\n${String(err)}`
    );
    app.quit();
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Archivo Genealógico Familiar',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = process.env.ELECTRON_DEV === 'true';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(app.getAppPath(), 'frontend', 'dist', 'index.html')
    );
  }
}

ipcMain.handle('get-archivo-root', () => {
  return store.get('archivoRoot') ?? null;
});

ipcMain.handle('select-archivo-root', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Elegí la carpeta del Archivo Genealógico',
    buttonLabel: 'Seleccionar carpeta',
  });
  if (result.canceled || !result.filePaths.length) return null;
  const chosen = result.filePaths[0];
  store.set('archivoRoot', chosen);
  app.relaunch();
  app.exit(0);
  return null; // never reached, satisfies return type
});

app.whenReady().then(async () => {
  const archivoRoot = store.get('archivoRoot') ?? null;
  if (archivoRoot) {
    await startBackend(archivoRoot);
  }
  createWindow();

  const isDev = process.env.ELECTRON_DEV === 'true';
  if (!isDev) {
    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Actualización disponible',
        message: 'Hay una nueva versión disponible. ¿Instalar ahora?',
        buttons: ['Instalar y reiniciar', 'Después'],
      }).then(result => {
        if (result.response === 0) autoUpdater.quitAndInstall();
      });
    });
    autoUpdater.checkForUpdates();
    setInterval(() => autoUpdater.checkForUpdates(), 60 * 60 * 1000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

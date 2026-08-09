import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import path from 'path';

// Increment when new beta changelog entries are added (id of the latest beta entry)
const CHANGELOG_VERSION = 3;
const CHANNEL = 'beta' as const;

interface StoreSchema {
  archivoRoot?: string;
  lastSeenChangelogId?: number;
}

const store = new Store<StoreSchema>({ name: 'config-beta' });

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
    minWidth: 400,
    minHeight: 500,
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

ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('open-file', (_event, filePath: string) => shell.openPath(filePath));
ipcMain.handle('check-whats-new', () => {
  const lastSeenId = store.get('lastSeenChangelogId', 0);
  const isNew = lastSeenId < CHANGELOG_VERSION;
  if (isNew) store.set('lastSeenChangelogId', CHANGELOG_VERSION);
  return { isNew, lastSeenId, channel: CHANNEL };
});

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

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Novedades',
          click: () => mainWindow?.webContents.send('open-whats-new'),
        },
        {
          label: 'Normalizar lugares existentes',
          click: () => mainWindow?.webContents.send('navigate', '/migracion-lugares'),
        },
        { type: 'separator' },
        {
          label: 'Buscar actualizaciones',
          click: () => {
            autoUpdater.checkForUpdates();
            dialog.showMessageBox({ type: 'info', title: 'Actualizaciones', message: 'Buscando actualizaciones...', buttons: ['OK'] });
          },
        },
        {
          label: `Versión ${app.getVersion()}`,
          enabled: false,
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  const archivoRoot = store.get('archivoRoot') ?? null;
  if (archivoRoot) {
    await startBackend(archivoRoot);
  }
  buildMenu();
  createWindow();

  const isDev = process.env.ELECTRON_DEV === 'true';
  if (!isDev) {
    autoUpdater.allowPrerelease = app.getVersion().includes('beta');
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

app.on('will-quit', (event) => {
  event.preventDefault();
  const serverPath = path.join(app.getAppPath(), 'backend', 'dist', 'server');
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require(serverPath).stopServer().finally(() => app.exit(0));
  } catch {
    app.exit(0);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

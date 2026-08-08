"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_store_1 = __importDefault(require("electron-store"));
const path_1 = __importDefault(require("path"));
const store = new electron_store_1.default();
let mainWindow = null;
async function startBackend(archivoRoot) {
    process.env.ARCHIVO_ROOT = archivoRoot;
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const serverPath = path_1.default.join(electron_1.app.getAppPath(), 'backend', 'dist', 'server');
        await require(serverPath).startServer(3001);
    }
    catch (err) {
        electron_1.dialog.showErrorBox('Error al iniciar el servidor', `No se pudo iniciar el backend.\n\n${String(err)}`);
        electron_1.app.quit();
    }
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: 'Archivo Genealógico Familiar',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    const isDev = process.env.ELECTRON_DEV === 'true';
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(electron_1.app.getAppPath(), 'frontend', 'dist', 'index.html'));
    }
}
electron_1.ipcMain.handle('get-archivo-root', () => {
    return store.get('archivoRoot') ?? null;
});
electron_1.ipcMain.handle('select-archivo-root', async () => {
    if (!mainWindow)
        return null;
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Elegí la carpeta del Archivo Genealógico',
        buttonLabel: 'Seleccionar carpeta',
    });
    if (result.canceled || !result.filePaths.length)
        return null;
    const chosen = result.filePaths[0];
    store.set('archivoRoot', chosen);
    electron_1.app.relaunch();
    electron_1.app.exit(0);
    return null; // never reached, satisfies return type
});
electron_1.app.whenReady().then(async () => {
    const archivoRoot = store.get('archivoRoot') ?? null;
    if (archivoRoot) {
        await startBackend(archivoRoot);
    }
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});

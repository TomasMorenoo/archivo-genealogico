"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    getArchivoRoot: () => electron_1.ipcRenderer.invoke('get-archivo-root'),
    selectArchivoRoot: () => electron_1.ipcRenderer.invoke('select-archivo-root'),
});

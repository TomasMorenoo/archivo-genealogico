import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getArchivoRoot: (): Promise<string | null> =>
    ipcRenderer.invoke('get-archivo-root'),
  selectArchivoRoot: (): Promise<string | null> =>
    ipcRenderer.invoke('select-archivo-root'),
  getVersion: (): Promise<string> =>
    ipcRenderer.invoke('get-version'),
  openFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('open-file', filePath),
});

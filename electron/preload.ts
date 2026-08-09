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
  checkWhatsNew: (): Promise<{ isNew: boolean; version: string }> =>
    ipcRenderer.invoke('check-whats-new'),
  onOpenWhatsNew: (cb: () => void) => {
    ipcRenderer.on('open-whats-new', cb);
    return () => ipcRenderer.removeListener('open-whats-new', cb);
  },
});

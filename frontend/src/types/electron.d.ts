interface ElectronAPI {
  getArchivoRoot: () => Promise<string | null>;
  selectArchivoRoot: () => Promise<string | null>;
  getVersion: () => Promise<string>;
  openFile: (filePath: string) => Promise<string>;
  checkWhatsNew: () => Promise<{ isNew: boolean; version: string }>;
  onOpenWhatsNew: (cb: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

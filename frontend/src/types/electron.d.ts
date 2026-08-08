interface ElectronAPI {
  getArchivoRoot: () => Promise<string | null>;
  selectArchivoRoot: () => Promise<string | null>;
  getVersion: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

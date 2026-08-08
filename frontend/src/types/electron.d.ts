interface ElectronAPI {
  getArchivoRoot: () => Promise<string | null>;
  selectArchivoRoot: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

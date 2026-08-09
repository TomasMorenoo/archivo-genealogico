interface ElectronAPI {
  getArchivoRoot: () => Promise<string | null>;
  selectArchivoRoot: () => Promise<string | null>;
  getVersion: () => Promise<string>;
  openFile: (filePath: string) => Promise<string>;
  checkWhatsNew: () => Promise<{ isNew: boolean; lastSeenId: number; channel: 'stable' | 'beta' }>;
  onOpenWhatsNew: (cb: () => void) => () => void;
  onNavigate: (cb: (path: string) => void) => () => void;
  saveTreePdf: (opts: { treeHtml: string; treeW: number; treeH: number; pageSize: string; landscape: boolean; marginsMm: number }) => Promise<{ ok: boolean; canceled?: boolean; filePath?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

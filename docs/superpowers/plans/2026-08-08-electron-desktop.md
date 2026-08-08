# Electron Desktop App Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the existing Express + React genealogy app in Electron so it ships as a local Windows desktop application with a user-chosen `Archivo_Genealogico/` folder.

**Architecture:** Electron main process embeds the Express backend in-process (imports compiled `backend/dist/server.js`). The frontend is built by Vite and loaded via `loadFile()` in production, or from the Vite dev server (`http://localhost:5173`) in development. `ARCHIVO_ROOT` env var (set by main process before starting Express) drives all file and DB paths. On first run, a native folder-picker dialog lets the user choose their archive root; the path is persisted via `electron-store`. App relaunches after folder selection so the backend starts with the correct path.

**Tech Stack:** Electron 28, electron-store 8, electron-builder 24, concurrently, wait-on, cross-env; existing Express + better-sqlite3 + React + Vite stack unchanged.

---

## Context for implementers

### Folder structure after this migration

```
gestor/                          ← project root
├── package.json                 ← NEW: Electron app manifest + all scripts
├── electron-builder.yml         ← NEW: packaging config
├── electron/
│   ├── tsconfig.json            ← NEW
│   ├── main.ts                  ← NEW: BrowserWindow + IPC + starts Express
│   └── preload.ts               ← NEW: contextBridge for folder picker
├── backend/                     ← unchanged except 3 files
│   └── src/
│       ├── db/database.ts       ← MODIFY: DB path from ARCHIVO_ROOT
│       ├── services/
│       │   └── fileSystemService.ts  ← MODIFY: DATA_ROOT from ARCHIVO_ROOT
│       └── server.ts            ← MODIFY: export startServer(port)
└── frontend/                    ← unchanged except 4 files
    ├── vite.config.ts           ← MODIFY: base './'
    └── src/
        ├── api/client.ts        ← MODIFY: absolute baseURL
        ├── App.tsx              ← MODIFY: SetupPage check
        ├── types/
        │   └── electron.d.ts    ← NEW: window.electronAPI types
        └── pages/
            └── SetupPage.tsx    ← NEW: first-run folder picker
```

### User's Archivo_Genealogico/ folder structure (on Windows)

```
C:\Archivo_Genealogico\          ← user-chosen root (ARCHIVO_ROOT)
├── Personas\
│   └── P00001_Tomas_Moreno_Bauer\
│       ├── persona.md
│       ├── Documentos\
│       └── Fotos\
└── BaseDeDatos\
    └── genealogico.db
```

### Why ARCHIVO_ROOT env var?

The Electron main process sets `process.env.ARCHIVO_ROOT = archivoRoot` **before** importing `backend/dist/server.js`. Because Node.js `require()` caches modules, this must happen before the first import. The backend services read `process.env.ARCHIVO_ROOT` at call time (not at module load time), so they always see the correct value.

### Dev vs production loading

| Mode | Frontend loaded | Proxy |
|------|----------------|-------|
| Dev (`ELECTRON_DEV=true`) | `http://localhost:5173` (Vite dev server) | Not needed — axios uses absolute URL |
| Production | `file://…/frontend/dist/index.html` | Not applicable |

Since `axios` now uses `baseURL: 'http://localhost:3001/api'` (absolute), no proxy is needed in either mode.

### Important: Build must run from Windows for packaging

`electron-builder` builds a Windows `.exe` installer. Run `npm run dist` from **Windows PowerShell or CMD** at `C:\Users\Moren\Desktop\Programas\gestor`. Running from WSL2 produces a Linux binary, not a Windows installer. Backend compilation and frontend dev work fine from WSL2.

### Tests are unaffected

All 3 test files mock `getDb()` with an in-memory SQLite. They don't read `ARCHIVO_ROOT`. No test changes needed.

---

## File Map

**Create:**
- `package.json` (root)
- `electron-builder.yml`
- `electron/tsconfig.json`
- `electron/main.ts`
- `electron/preload.ts`
- `frontend/src/types/electron.d.ts`
- `frontend/src/pages/SetupPage.tsx`

**Modify:**
- `backend/src/db/database.ts`
- `backend/src/services/fileSystemService.ts`
- `backend/src/server.ts`
- `backend/src/app.ts`
- `frontend/src/api/client.ts`
- `frontend/src/App.tsx`
- `frontend/vite.config.ts`

---

## Task 1: Root package.json + Electron dependencies

**Files:**
- Create: `package.json` (root)

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "archivo-genealogico",
  "version": "1.0.0",
  "description": "Archivo Genealógico Familiar — aplicación de escritorio local",
  "main": "electron/dist/main.js",
  "scripts": {
    "electron:compile": "tsc -p electron/tsconfig.json",
    "backend:build": "cd backend && npm run build && node -e \"const fs=require('fs');fs.mkdirSync('dist/db',{recursive:true});fs.copyFileSync('src/db/schema.sql','dist/db/schema.sql');\"",
    "frontend:build": "cd frontend && npm run build",
    "build": "npm run backend:build && npm run frontend:build && npm run electron:compile",
    "electron:dev": "cross-env ELECTRON_DEV=true electron .",
    "dev": "concurrently -k \"cd backend && npm run build -- --watch\" \"cd frontend && npm run dev\" \"wait-on http://localhost:5173 && npm run electron:dev\"",
    "dist": "npm run build && electron-builder"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "electron-store": "^8.1.0",
    "express": "^4.18.3",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.11.30",
    "concurrently": "^8.2.2",
    "cross-env": "^7.0.3",
    "electron": "^28.3.3",
    "electron-builder": "^24.13.3",
    "electron-rebuild": "^3.2.9",
    "typescript": "^5.4.3",
    "wait-on": "^7.2.0"
  }
}
```

Note on `backend:build` script: the inline `node -e` command copies `schema.sql` to `backend/dist/db/` because TypeScript compiler only copies `.ts` files. This is needed so packaged production code can find the schema.

- [ ] **Step 2: Install dependencies at root**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
npm install
```

Expected: `node_modules/` created at root containing `electron`, `electron-store`, `better-sqlite3`, `express`, etc.

- [ ] **Step 3: Rebuild better-sqlite3 for Electron's Node version**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
./node_modules/.bin/electron-rebuild -f -w better-sqlite3
```

Expected: output containing `✔ Rebuild Complete` or similar. This recompiles the native SQLite bindings for Electron's specific Node.js ABI, not the system Node.

- [ ] **Step 4: Verify electron binary exists**

```bash
ls node_modules/.bin/electron
```

Expected: file exists.

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
git add package.json package-lock.json
git commit -m "chore: add root Electron package.json with dependencies"
```

---

## Task 2: Backend — configurable ARCHIVO_ROOT

**Files:**
- Modify: `backend/src/db/database.ts`
- Modify: `backend/src/services/fileSystemService.ts`
- Modify: `backend/src/server.ts`
- Modify: `backend/src/app.ts`

All changes make paths runtime-computed from `process.env.ARCHIVO_ROOT` instead of hardcoded relative paths.

### database.ts

- [ ] **Step 1: Update database.ts**

Replace the entire file `backend/src/db/database.ts` with:

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db: Database.Database | undefined;

function getDbPath(): string {
  const root = process.env.ARCHIVO_ROOT;
  if (!root) {
    return path.join(__dirname, '../../genealogico.db');
  }
  return path.join(root, 'BaseDeDatos', 'genealogico.db');
}

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = getDbPath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = undefined;
  }
}
```

Key changes:
- `getDbPath()` reads `process.env.ARCHIVO_ROOT` at call time. If unset (tests/dev fallback), uses old path.
- `fs.mkdirSync(…, { recursive: true })` auto-creates `BaseDeDatos/` inside the chosen root.
- `closeDb()` exported for Electron shutdown cleanup.

- [ ] **Step 2: Verify backend tests still pass**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor/backend
npm test
```

Expected: 14/14 tests pass. Tests mock `getDb()` entirely, so the new `getDbPath()` logic is never called.

### fileSystemService.ts

- [ ] **Step 3: Update fileSystemService.ts**

Replace `export const DATA_ROOT = ...` at line 5 with a `getDataRoot()` function, and update `personaFolderPath` to call it. Replace the entire file:

```typescript
import fs from 'fs';
import path from 'path';
import type { Persona, Relacion, Documento } from '../types';

export function getDataRoot(): string {
  const root = process.env.ARCHIVO_ROOT;
  if (!root) {
    return path.join(process.cwd(), '..', 'Archivo_Genealogico');
  }
  return root;
}

export function formatDid(id: number): string {
  return `D${String(id).padStart(5, '0')}`;
}

function sanitizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function personaFolderName(persona: { id: number; nombre: string; apellido: string }): string {
  const pid = `P${String(persona.id).padStart(5, '0')}`;
  return `${pid}_${sanitizeName(persona.apellido)}_${sanitizeName(persona.nombre)}`;
}

export function personaFolderPath(persona: { id: number; nombre: string; apellido: string }): string {
  return path.join(getDataRoot(), 'Personas', personaFolderName(persona));
}

export function ensurePersonaFolder(persona: { id: number; nombre: string; apellido: string }): string {
  const folderPath = personaFolderPath(persona);
  fs.mkdirSync(path.join(folderPath, 'Documentos'), { recursive: true });
  fs.mkdirSync(path.join(folderPath, 'Fotos'), { recursive: true });
  return folderPath;
}

export function documentoFileName(docId: number, titulo: string, originalExt: string): string {
  const did = formatDid(docId);
  const safe = sanitizeName(titulo).slice(0, 40);
  return `${did}_${safe}${originalExt}`;
}

function formatFecha(dia: number | null, mes: number | null, anio: number | null, tipo: string): string {
  if (tipo === 'desconocida') return 'Desconocida';
  if (tipo === 'aproximada' && anio) return `aprox. ${anio}`;
  if (tipo === 'solo_anio' && anio) return String(anio);
  if (dia && mes && anio) return `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${anio}`;
  if (anio) return String(anio);
  return 'Desconocida';
}

function formatLugar(lugar: { ciudad: string; provincia: string | null; pais: string } | null | undefined): string {
  if (!lugar) return '';
  return [lugar.ciudad, lugar.provincia, lugar.pais].filter(Boolean).join(', ');
}

export function generatePersonaMd(
  persona: Persona,
  relaciones: Relacion[],
  docsPrincipales: Documento[],
  docsMencionada: Documento[]
): string {
  const pid = `P${String(persona.id).padStart(5, '0')}`;
  const nacimiento = formatFecha(persona.nac_dia, persona.nac_mes, persona.nac_anio, persona.nac_tipo);
  const defuncion = formatFecha(persona.def_dia, persona.def_mes, persona.def_anio, persona.def_tipo);
  const sexoLabel = persona.sexo === 'M' ? 'Masculino' : persona.sexo === 'F' ? 'Femenino' : 'Otro';

  const relacionesMd = relaciones.length > 0
    ? relaciones.map(r => `- **${r.tipo_relacion_nombre}:** [${r.persona_destino_pid}] ${r.persona_destino_nombre}`).join('\n')
    : '_Sin relaciones registradas._';

  const principalesMd = docsPrincipales.length > 0
    ? docsPrincipales.map(d => `- **${formatDid(d.id)}** — ${d.titulo} (${d.tipo})`).join('\n')
    : '_Sin documentos principales._';

  const mencionadaMd = docsMencionada.length > 0
    ? docsMencionada.map(d => `- **${formatDid(d.id)}** — ${d.titulo} (${d.tipo})`).join('\n')
    : '_Sin menciones en otros documentos._';

  return `# ${persona.apellido}, ${persona.nombre}

**ID:** ${pid}
**Actualizado:** ${persona.actualizado_en}

---

## Datos Personales

| Campo | Valor |
|-------|-------|
| Nombre | ${persona.nombre} |
| Apellido | ${persona.apellido} |
| Sexo | ${sexoLabel} |
| Fecha de nacimiento | ${nacimiento} |
| Lugar de nacimiento | ${formatLugar(persona.nac_lugar)} |
| Fecha de defunción | ${defuncion} |
| Lugar de defunción | ${formatLugar(persona.def_lugar)} |

---

## Historia Personal

${persona.historia || '_Sin historia registrada._'}

---

## Relaciones

${relacionesMd}

---

## Documentos Principales

${principalesMd}

---

## Mencionado En

${mencionadaMd}
`;
}

export function writePersonaMd(
  persona: Persona,
  relaciones: Relacion[],
  docsPrincipales: Documento[],
  docsMencionada: Documento[]
): void {
  const folderPath = ensurePersonaFolder(persona);
  const content = generatePersonaMd(persona, relaciones, docsPrincipales, docsMencionada);
  fs.writeFileSync(path.join(folderPath, 'persona.md'), content, 'utf-8');
}

export function getDocumentosPath(persona: { id: number; nombre: string; apellido: string }): string {
  return path.join(personaFolderPath(persona), 'Documentos');
}
```

The only real change vs the original: `DATA_ROOT` constant replaced by `getDataRoot()` function. All other code identical.

### server.ts

- [ ] **Step 4: Update server.ts to export startServer()**

Replace entire file `backend/src/server.ts`:

```typescript
import { createApp } from './app';
import { getDb } from './db/database';

export function startServer(port: number): void {
  getDb();
  const app = createApp();
  app.listen(port, () => {
    console.log(`Archivo Genealógico API running on http://localhost:${port}`);
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3001;
  startServer(port);
}
```

`require.main === module` ensures the server still auto-starts when run directly via `ts-node-dev src/server.ts` (standalone dev), while allowing Electron to import and call `startServer(3001)` without auto-starting.

### app.ts

- [ ] **Step 5: Update app.ts to use getDataRoot()**

Replace entire file `backend/src/app.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { getDataRoot } from './services/fileSystemService';
import { personasRouter } from './routes/personas';
import { relacionesRouter } from './routes/relaciones';
import { documentosRouter } from './routes/documentos';
import { lugaresRouter } from './routes/lugares';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(getDataRoot()));
  app.use('/api/personas', personasRouter);
  app.use('/api/relaciones', relacionesRouter);
  app.use('/api/documentos', documentosRouter);
  app.use('/api/lugares', lugaresRouter);
  return app;
}
```

`getDataRoot()` is called when `createApp()` is called, which happens inside `startServer()`, which is called after `ARCHIVO_ROOT` is set. So the static path is correct.

- [ ] **Step 6: Verify tests still pass**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor/backend
npm test
```

Expected: 14/14 pass.

- [ ] **Step 7: Commit**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
git add backend/src/db/database.ts backend/src/services/fileSystemService.ts backend/src/server.ts backend/src/app.ts
git commit -m "feat: configurable ARCHIVO_ROOT for backend paths"
```

---

## Task 3: Electron preload.ts

**Files:**
- Create: `electron/tsconfig.json`
- Create: `electron/preload.ts`
- Create: `frontend/src/types/electron.d.ts`

The preload script runs in the renderer's context but has access to Electron's `ipcRenderer`. It uses `contextBridge` to safely expose a minimal API (`window.electronAPI`) to the React app.

- [ ] **Step 1: Create electron/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["main.ts", "preload.ts"]
}
```

- [ ] **Step 2: Create electron/preload.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getArchivoRoot: (): Promise<string | null> =>
    ipcRenderer.invoke('get-archivo-root'),
  selectArchivoRoot: (): Promise<string | null> =>
    ipcRenderer.invoke('select-archivo-root'),
});
```

- [ ] **Step 3: Create frontend/src/types/electron.d.ts**

```typescript
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
```

This file adds `window.electronAPI` to the global Window type so TypeScript doesn't complain in the React code. The `?` means it's optional — when running in a plain browser (non-Electron dev), `window.electronAPI` is `undefined`.

- [ ] **Step 4: Compile preload to verify no TypeScript errors**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
npx tsc -p electron/tsconfig.json --noEmit
```

Expected: no output (0 errors).

- [ ] **Step 5: Commit**

```bash
git add electron/tsconfig.json electron/preload.ts frontend/src/types/electron.d.ts
git commit -m "feat: Electron preload with contextBridge for folder picker"
```

---

## Task 4: Electron main.ts

**Files:**
- Create: `electron/main.ts`

This is the Electron main process. It:
1. Reads `archivoRoot` from `electron-store` (persisted config)
2. If set: sets `process.env.ARCHIVO_ROOT` and starts Express in-process
3. Creates a `BrowserWindow` (loads Vite dev server in dev, `frontend/dist/index.html` in prod)
4. Handles IPC: `get-archivo-root` returns stored path, `select-archivo-root` opens native dialog and relaunches app

- [ ] **Step 1: Create electron/main.ts**

```typescript
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import Store from 'electron-store';
import path from 'path';

interface StoreSchema {
  archivoRoot: string;
}

const store = new Store<StoreSchema>();

let mainWindow: BrowserWindow | null = null;

function startBackend(archivoRoot: string): void {
  process.env.ARCHIVO_ROOT = archivoRoot;
  // Must set ARCHIVO_ROOT before requiring the backend module.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serverPath = path.join(app.getAppPath(), 'backend', 'dist', 'server');
  require(serverPath).startServer(3001);
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
  return store.get('archivoRoot', null) as string | null;
});

ipcMain.handle('select-archivo-root', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Elegí la carpeta del Archivo Genealógico',
    buttonLabel: 'Seleccionar carpeta',
  });
  if (result.canceled || !result.filePaths.length) return null;
  const chosen = result.filePaths[0];
  store.set('archivoRoot', chosen);
  app.relaunch();
  app.exit(0);
  return chosen;
});

app.whenReady().then(() => {
  const archivoRoot = store.get('archivoRoot', null) as string | null;
  if (archivoRoot) {
    startBackend(archivoRoot);
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

Key behaviors:
- `startBackend()` sets env var then does a `require()` — must happen before any module that calls `getDb()` or `getDataRoot()`.
- If `archivoRoot` is not set (first run), Express does NOT start. The React app shows `SetupPage`. User picks folder → `select-archivo-root` IPC saves to store → `app.relaunch()` restarts the app → this time archivoRoot is set → backend starts normally.
- `app.getAppPath()` returns the project root in dev, and `resources/app/` in packaged production.

- [ ] **Step 2: Compile to verify types**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
npx tsc -p electron/tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add electron/main.ts
git commit -m "feat: Electron main process with BrowserWindow, IPC, embedded Express"
```

---

## Task 5: Frontend — SetupPage + App integration

**Files:**
- Create: `frontend/src/pages/SetupPage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create frontend/src/pages/SetupPage.tsx**

```tsx
import { useState } from 'react';

interface Props {
  onSetup: () => void;
}

export default function SetupPage({ onSetup }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect() {
    if (!window.electronAPI) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.selectArchivoRoot();
      if (!result) {
        setError('No se seleccionó ninguna carpeta.');
        setLoading(false);
      }
      // If result is set, app.relaunch() fires — no further action needed here.
    } catch {
      setError('Error al seleccionar la carpeta.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '24px',
      fontFamily: 'system-ui, sans-serif',
      background: '#f9f9f9',
    }}>
      <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Archivo Genealógico Familiar</h1>
      <p style={{ margin: 0, color: '#555', maxWidth: 420, textAlign: 'center' }}>
        Elegí la carpeta donde se guardará tu archivo genealógico.
        Se creará automáticamente la estructura <code>Personas/</code> y <code>BaseDeDatos/</code> dentro de ella.
      </p>
      <button
        onClick={handleSelect}
        disabled={loading}
        style={{
          padding: '12px 28px',
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
        }}
      >
        {loading ? 'Seleccionando…' : 'Elegir carpeta'}
      </button>
      {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Replace frontend/src/App.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PersonaPage from './pages/PersonaPage';
import SetupPage from './pages/SetupPage';

export default function App() {
  const [ready, setReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (!window.electronAPI) {
      setReady(true);
      return;
    }
    window.electronAPI.getArchivoRoot().then(root => {
      setReady(root !== null);
    });
  }, []);

  if (ready === null) return null;
  if (!ready) return <SetupPage onSetup={() => setReady(true)} />;

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/persona/:id" element={<PersonaPage />} />
    </Routes>
  );
}
```

`window.electronAPI` is `undefined` when running in a plain browser (non-Electron). In that case, `setReady(true)` immediately, skipping setup and showing the app normally.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor/frontend
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
git add frontend/src/pages/SetupPage.tsx frontend/src/App.tsx
git commit -m "feat: SetupPage for first-run folder picker, App.tsx integration"
```

---

## Task 6: Frontend API client + Vite config

**Files:**
- Modify: `frontend/src/api/client.ts`
- Modify: `frontend/vite.config.ts`

In production (Electron), the page loads from `file://`. Relative URLs like `/api` resolve to `file:///api` which is meaningless. We use an absolute `http://localhost:3001/api` URL so it works in both dev (Electron loads Vite dev server) and production (page loaded from file://).

The Vite proxy was only needed for relative-URL dev. Since we're switching to absolute URLs, we remove the proxy.

`base: './'` in Vite config ensures all asset references in `index.html` use relative paths (`./assets/…`) instead of absolute paths (`/assets/…`), which is required when loading the page from the filesystem (`file://`).

- [ ] **Step 1: Update frontend/src/api/client.ts**

Replace the `const api = axios.create(...)` line only (line 4):

Old:
```typescript
const api = axios.create({ baseURL: '/api' });
```

New:
```typescript
const api = axios.create({ baseURL: 'http://localhost:3001/api' });
```

No other changes to `client.ts`.

- [ ] **Step 2: Update frontend/vite.config.ts**

Replace entire file:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
});
```

The `server.proxy` block is removed — axios uses `http://localhost:3001/api` directly so no proxy is needed.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor/frontend
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Verify frontend builds**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor/frontend
npm run build
```

Expected: `dist/` created with `index.html` that references assets as `./assets/…` (not `/assets/…`).

```bash
head -5 dist/index.html
```

Expected: script/link tags use `./assets/` paths.

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
git add frontend/src/api/client.ts frontend/vite.config.ts frontend/dist/
git commit -m "feat: absolute API baseURL and Vite base './' for Electron file:// loading"
```

---

## Task 7: electron-builder packaging config

**Files:**
- Create: `electron-builder.yml`

This defines how `electron-builder` packages the app into a Windows NSIS installer.

- [ ] **Step 1: Create electron-builder.yml**

```yaml
appId: com.genealogico.archivo
productName: Archivo Genealógico Familiar
copyright: Copyright © 2026

directories:
  output: release

files:
  - electron/dist/**
  - backend/dist/**
  - frontend/dist/**
  - node_modules/**
  - package.json

win:
  target:
    - target: nsis
      arch:
        - x64

nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
  installerLanguages:
    - es_ES

asar: false
```

Key decisions:
- `asar: false` — disables the `.asar` archive format. Simpler. Required for `better-sqlite3` native bindings to work (`.node` files can't be inside an asar archive).
- `files` — lists exactly what to include. `backend/dist/**` includes the compiled JS + the `schema.sql` we copy there in the build script.
- `nsis.allowToChangeInstallationDirectory: true` — user can choose where to install the app (separate from their Archivo_Genealogico data folder).
- `node_modules/**` — electron-builder is smart: with `asar: false` and production build, it only includes production dependencies (from `dependencies` in package.json, not `devDependencies`).

- [ ] **Step 2: Verify build compiles everything correctly (WSL2 — produces Linux binaries, not Windows)**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
npm run build
```

Expected output:
- `backend/dist/` created with JS files + `db/schema.sql`
- `frontend/dist/` has `index.html` with `./assets/` paths
- `electron/dist/main.js` and `electron/dist/preload.js` created

Check schema was copied:
```bash
ls backend/dist/db/
```
Expected: `database.js  schema.sql`

- [ ] **Step 3: Commit**

```bash
git add electron-builder.yml
git commit -m "chore: electron-builder packaging config for Windows NSIS installer"
```

---

## Task 8: Dev launch + integration smoke test

**Files:** No code changes — this task validates the full integration.

**Important:** Running the Electron window requires a graphical display. If you're in WSL2 **without** WSLg (Windows Subsystem for Linux GUI), Electron will fail to open a window. In that case, do the smoke test by running the app from **Windows PowerShell** at `C:\Users\Moren\Desktop\Programas\gestor`.

### Option A: WSL2 with WSLg (Windows 11)

- [ ] **Step 1A: Build backend and compile Electron**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
npm run backend:build
npm run electron:compile
```

Expected: `backend/dist/` and `electron/dist/main.js` exist.

- [ ] **Step 2A: Start Vite dev server in background**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor/frontend
npm run dev &
```

Wait until you see `VITE v5.x.x  ready in ...ms`.

- [ ] **Step 3A: Launch Electron in dev mode**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
npm run electron:dev
```

Expected: Electron window opens.

### Option B: Windows PowerShell (always works)

- [ ] **Step 1B: Open PowerShell, navigate to project**

```powershell
cd C:\Users\Moren\Desktop\Programas\gestor
```

- [ ] **Step 2B: Install root deps (first time)**

```powershell
npm install
```

- [ ] **Step 3B: Build everything**

```powershell
npm run build
```

- [ ] **Step 4B: Start Vite dev server**

In a second PowerShell window:
```powershell
cd C:\Users\Moren\Desktop\Programas\gestor\frontend
npm run dev
```

- [ ] **Step 5B: Launch Electron**

In the first PowerShell window:
```powershell
$env:ELECTRON_DEV="true"; npx electron .
```

### Smoke test steps (both options)

- [ ] **Step 6: Verify first-run SetupPage**

Expected: Electron window shows "Archivo Genealógico Familiar" with "Elegir carpeta" button. No data loaded yet.

- [ ] **Step 7: Select archive folder**

Click "Elegir carpeta". In the native dialog, navigate to or create `C:\Archivo_Genealogico` (or any folder). Click "Select folder".

Expected: App relaunches automatically. After relaunch, the main index page loads (empty person list).

- [ ] **Step 8: Verify data folder created**

In File Explorer (Windows) or from bash:
```bash
ls /mnt/c/Archivo_Genealogico/
```

Expected: `BaseDeDatos/` folder exists with `genealogico.db` inside.

- [ ] **Step 9: Create a person**

In the app, click "+ Agregar persona". Fill: Nombre=Tomás, Apellido=Moreno Bauer, Año nac=2004. Save.

Expected: Person appears in list as `P00001 — Moreno Bauer, Tomás — 2004`.

- [ ] **Step 10: Verify physical folder created**

```bash
ls "/mnt/c/Archivo_Genealogico/Personas/"
```

Expected: `P00001_Moreno_Bauer_Tomas/` with `persona.md`, `Documentos/`, `Fotos/`.

- [ ] **Step 11: Restart app and verify data persists**

Close and reopen Electron. Expected: person list shows P00001. No SetupPage (folder is remembered).

- [ ] **Step 12: Final commit**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
git add .
git commit -m "feat: Electron desktop app with folder picker, embedded Express, Windows packaging"
```

---

## Building the Windows installer (optional, run from Windows PowerShell)

After all tasks are done, from **Windows PowerShell**:

```powershell
cd C:\Users\Moren\Desktop\Programas\gestor
npm run dist
```

Expected: `release/` folder created with `Archivo Genealógico Familiar Setup 1.0.0.exe`.

Run the installer. App installs to `C:\Users\Moren\AppData\Local\Programs\Archivo Genealógico Familiar\` (or chosen path). On first launch, SetupPage appears to select the data folder.

---

## Spec Coverage Check

| Requirement | Task |
|---|---|
| Aplicación de escritorio local | Tasks 4, 5 (Electron BrowserWindow) |
| SQLite local en PC del usuario | Task 2 (ARCHIVO_ROOT/BaseDeDatos/genealogico.db) |
| Carpeta Archivo_Genealogico/ en PC | Task 2 (ARCHIVO_ROOT env var) |
| Usuario elige la carpeta | Tasks 3, 4, 5 (folder picker IPC) |
| Estructura Personas/P00001_.../ | Task 2 (fileSystemService unchanged) |
| BaseDeDatos/ subcarpeta | Task 2 (database.ts auto-creates) |
| Funciona completamente offline | Tasks 4 (embedded Express, no external deps) |
| Interfaz de escritorio (no browser) | Task 4 (BrowserWindow, no tabs, no address bar) |
| Carpeta configurada persiste entre sesiones | Task 4 (electron-store) |
| Packaging como instalador Windows | Task 7 (electron-builder NSIS) |
| Todas las features previas conservadas | Tasks 2, 6 (solo cambios de paths, sin refactor de lógica) |

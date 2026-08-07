# Archivo Genealógico Familiar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local genealogy file manager with person index, individual profiles, bidirectional relations, first-class document entities (D00001) with principal/mentioned persons, physical folder structure, and Markdown backups.

**Architecture:** Express + better-sqlite3 backend (port 3001) serves a REST API; Vite + React + TypeScript frontend (port 5173) proxied to the backend. All data lives in SQLite; each person also gets a physical folder and `persona.md` under `Archivo_Genealogico/Personas/` at the repo root. File uploads are stored in the person's `Documentos/` subfolder.

**Tech Stack:** Node.js 20, Express, better-sqlite3, TypeScript (ts-node-dev), React 18, Vite, Axios, multer, date-fns, Vitest, Supertest

---

## File Map

```
gestor/
├── Archivo_Genealogico/          ← data root (git-ignored)
│   └── Personas/
│       └── P00001_Tomas_Moreno_Bauer/
│           ├── persona.md
│           ├── Documentos/
│           └── Fotos/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app.ts                ← Express app factory
│       ├── server.ts             ← entry point
│       ├── db/
│       │   ├── database.ts       ← better-sqlite3 singleton
│       │   └── schema.sql        ← all CREATE TABLE statements
│       ├── services/
│       │   ├── personaService.ts ← CRUD + ID formatting (P00001)
│       │   ├── relacionService.ts← CRUD + inverse auto-generation
│       │   ├── documentoService.ts
│       │   ├── lugarService.ts   ← search + upsert
│       │   └── fileSystemService.ts ← folder + persona.md generation
│       ├── routes/
│       │   ├── personas.ts
│       │   ├── relaciones.ts
│       │   ├── documentos.ts
│       │   └── lugares.ts
│       └── __tests__/
│           ├── personaService.test.ts
│           └── relacionService.test.ts
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx               ← Router setup
│       ├── api/
│       │   └── client.ts         ← Axios instance + typed API calls
│       ├── types/
│       │   └── index.ts          ← Shared TS interfaces
│       ├── pages/
│       │   ├── HomePage.tsx      ← Person index list
│       │   └── PersonaPage.tsx   ← Full profile page
│       └── components/
│           ├── PersonaList/
│           │   └── PersonaList.tsx
│           ├── PersonaForm/
│           │   └── PersonaForm.tsx  ← Create/Edit modal
│           ├── RelacionForm/
│           │   └── RelacionForm.tsx ← Relation with internal search
│           ├── PersonaSearchInput/
│           │   └── PersonaSearchInput.tsx ← Reusable person picker (used by RelacionForm + DocumentoSection)
│           ├── DocumentoSection/
│           │   └── DocumentoSection.tsx   ← Shows "Documentos principales" + "Mencionado en"
│           ├── DocumentoForm/
│           │   └── DocumentoForm.tsx      ← Create/edit document with person search
│           ├── FechaInput/
│           │   └── FechaInput.tsx   ← Date normalizer
│           └── LugarInput/
│               └── LugarInput.tsx   ← Place autocomplete
└── .gitignore
```

---

## Task 1: Project Skeleton

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/server.ts`
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: Init backend**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
mkdir -p backend/src frontend/src
```

Create `backend/package.json`:
```json
{
  "name": "archivo-genealogico-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.3",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.11.30",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.3"
  }
}
```

Create `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Add `jest.config.js` to `backend/`:
```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
};
```

- [ ] **Step 2: Init frontend**

Create `frontend/package.json`:
```json
{
  "name": "archivo-genealogico-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest"
  },
  "dependencies": {
    "axios": "^1.6.8",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.3"
  },
  "devDependencies": {
    "@testing-library/react": "^14.2.2",
    "@types/react": "^18.2.73",
    "@types/react-dom": "^18.2.23",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.4.3",
    "vite": "^5.2.2",
    "vitest": "^1.4.0"
  }
}
```

Create `frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

Create `frontend/vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
});
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
Archivo_Genealogico/
*.db
*.db-shm
*.db-wal
.env
```

- [ ] **Step 4: Install dependencies**

```bash
cd backend && npm install
cd ../frontend && npm install
```

Expected: both complete without errors.

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/Users/Moren/Desktop/Programas/gestor
git init
git add backend/package.json backend/tsconfig.json backend/jest.config.js \
        frontend/package.json frontend/tsconfig.json frontend/vite.config.ts \
        .gitignore
git commit -m "chore: initialize monorepo skeleton"
```

---

## Task 2: Database Schema

**Files:**
- Create: `backend/src/db/schema.sql`
- Create: `backend/src/db/database.ts`

- [ ] **Step 1: Write schema**

Create `backend/src/db/schema.sql`:
```sql
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS lugares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ciudad TEXT NOT NULL,
  provincia TEXT,
  pais TEXT NOT NULL,
  latitud REAL,
  longitud REAL,
  UNIQUE(ciudad, provincia, pais)
);

CREATE TABLE IF NOT EXISTS personas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  sexo TEXT CHECK(sexo IN ('M','F','otro')) NOT NULL DEFAULT 'M',
  nac_dia INTEGER,
  nac_mes INTEGER,
  nac_anio INTEGER,
  nac_tipo TEXT CHECK(nac_tipo IN ('exacta','solo_anio','aproximada','desconocida')) DEFAULT 'desconocida',
  nac_lugar_id INTEGER REFERENCES lugares(id),
  def_dia INTEGER,
  def_mes INTEGER,
  def_anio INTEGER,
  def_tipo TEXT CHECK(def_tipo IN ('exacta','solo_anio','aproximada','desconocida')) DEFAULT 'desconocida',
  def_lugar_id INTEGER REFERENCES lugares(id),
  historia TEXT DEFAULT '',
  foto_ruta TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tipo_relacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  inverso_id INTEGER REFERENCES tipo_relacion(id)
);

CREATE TABLE IF NOT EXISTS relaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  persona_origen_id INTEGER NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo_relacion_id INTEGER NOT NULL REFERENCES tipo_relacion(id),
  persona_destino_id INTEGER NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  UNIQUE(persona_origen_id, tipo_relacion_id, persona_destino_id)
);

CREATE TABLE IF NOT EXISTS documentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  doc_dia INTEGER,
  doc_mes INTEGER,
  doc_anio INTEGER,
  doc_fecha_tipo TEXT CHECK(doc_fecha_tipo IN ('exacta','solo_anio','aproximada','desconocida')) DEFAULT 'desconocida',
  descripcion TEXT DEFAULT '',
  ruta TEXT,
  nombre_original TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Junction table: which personas appear in each document, and in what role
CREATE TABLE IF NOT EXISTS documento_personas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  documento_id INTEGER NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  persona_id INTEGER NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  rol TEXT CHECK(rol IN ('principal','mencionada')) NOT NULL DEFAULT 'principal',
  UNIQUE(documento_id, persona_id, rol)
);

CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  persona_id INTEGER NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  dia INTEGER,
  mes INTEGER,
  anio INTEGER,
  fecha_tipo TEXT CHECK(fecha_tipo IN ('exacta','solo_anio','aproximada','desconocida')) DEFAULT 'desconocida',
  lugar_id INTEGER REFERENCES lugares(id),
  descripcion TEXT DEFAULT ''
);

-- Seed relation types with inverses
-- We insert them first without inverso_id, then update
INSERT OR IGNORE INTO tipo_relacion (id, nombre) VALUES
  (1, 'Padre'),
  (2, 'Madre'),
  (3, 'Hijo'),
  (4, 'Hija'),
  (5, 'Cónyuge'),
  (6, 'Padre biológico'),
  (7, 'Madre biológica'),
  (8, 'Padre adoptivo'),
  (9, 'Madre adoptiva'),
  (10, 'Hermano'),
  (11, 'Hermana'),
  (12, 'Hermano medio'),
  (13, 'Abuelo'),
  (14, 'Abuela'),
  (15, 'Bisabuelo'),
  (16, 'Bisabuela'),
  (17, 'Tutor'),
  (18, 'Otro');

-- Padre → Hijo, Madre → Hija, etc.
UPDATE tipo_relacion SET inverso_id = 3 WHERE id = 1;  -- Padre ↔ Hijo
UPDATE tipo_relacion SET inverso_id = 4 WHERE id = 2;  -- Madre ↔ Hija
UPDATE tipo_relacion SET inverso_id = 1 WHERE id = 3;  -- Hijo ↔ Padre
UPDATE tipo_relacion SET inverso_id = 2 WHERE id = 4;  -- Hija ↔ Madre
UPDATE tipo_relacion SET inverso_id = 5 WHERE id = 5;  -- Cónyuge ↔ Cónyuge
UPDATE tipo_relacion SET inverso_id = 9 WHERE id = 6;  -- Padre bio ↔ Hijo (reuse 3)
UPDATE tipo_relacion SET inverso_id = 9 WHERE id = 7;  -- Madre bio ↔ Hija (reuse 4)
UPDATE tipo_relacion SET inverso_id = 3 WHERE id = 6;
UPDATE tipo_relacion SET inverso_id = 4 WHERE id = 7;
UPDATE tipo_relacion SET inverso_id = 3 WHERE id = 8;
UPDATE tipo_relacion SET inverso_id = 4 WHERE id = 9;
UPDATE tipo_relacion SET inverso_id = 10 WHERE id = 10; -- Hermano ↔ Hermano
UPDATE tipo_relacion SET inverso_id = 11 WHERE id = 11; -- Hermana ↔ Hermana
UPDATE tipo_relacion SET inverso_id = 12 WHERE id = 12;
UPDATE tipo_relacion SET inverso_id = 3 WHERE id = 13;  -- Abuelo → Nieto (Hijo)
UPDATE tipo_relacion SET inverso_id = 4 WHERE id = 14;
```

- [ ] **Step 2: Write database singleton**

Create `backend/src/db/database.ts`:
```ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../genealogico.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
  }
  return db;
}
```

- [ ] **Step 3: Write test**

Create `backend/src/__tests__/personaService.test.ts`:
```ts
import { getDb } from '../db/database';
import Database from 'better-sqlite3';

// Use in-memory DB for tests
jest.mock('../db/database', () => {
  const Database = require('better-sqlite3');
  const fs = require('fs');
  const path = require('path');
  let db: Database.Database;
  return {
    getDb: () => {
      if (!db) {
        db = new Database(':memory:');
        const schema = fs.readFileSync(
          path.join(__dirname, '../db/schema.sql'), 'utf-8'
        );
        db.exec(schema);
      }
      return db;
    },
  };
});

describe('database', () => {
  it('initializes without error', () => {
    const db = getDb();
    expect(db).toBeDefined();
  });

  it('has tipo_relacion seeded', () => {
    const db = getDb();
    const rows = db.prepare('SELECT COUNT(*) as c FROM tipo_relacion').get() as { c: number };
    expect(rows.c).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: Run test**

```bash
cd backend && npm test -- --testPathPattern=personaService
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/db/ backend/src/__tests__/personaService.test.ts
git commit -m "feat: database schema and initialization"
```

---

## Task 3: Shared Types

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `backend/src/types.ts`

- [ ] **Step 1: Write shared types**

Create `backend/src/types.ts`:
```ts
export interface Lugar {
  id: number;
  ciudad: string;
  provincia: string | null;
  pais: string;
  latitud: number | null;
  longitud: number | null;
}

export interface Persona {
  id: number;
  pid: string; // formatted "P00001"
  nombre: string;
  apellido: string;
  sexo: 'M' | 'F' | 'otro';
  nac_dia: number | null;
  nac_mes: number | null;
  nac_anio: number | null;
  nac_tipo: 'exacta' | 'solo_anio' | 'aproximada' | 'desconocida';
  nac_lugar_id: number | null;
  nac_lugar?: Lugar;
  def_dia: number | null;
  def_mes: number | null;
  def_anio: number | null;
  def_tipo: 'exacta' | 'solo_anio' | 'aproximada' | 'desconocida';
  def_lugar_id: number | null;
  historia: string;
  foto_ruta: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface PersonaListItem {
  id: number;
  pid: string;
  nombre: string;
  apellido: string;
  nac_anio: number | null;
}

export interface TipoRelacion {
  id: number;
  nombre: string;
  inverso_id: number | null;
}

export interface Relacion {
  id: number;
  persona_origen_id: number;
  tipo_relacion_id: number;
  tipo_relacion_nombre: string;
  persona_destino_id: number;
  persona_destino_nombre: string;
  persona_destino_pid: string;
}

export interface DocumentoPersona {
  persona_id: number;
  persona_pid: string;
  persona_nombre: string;
  rol: 'principal' | 'mencionada';
}

export interface Documento {
  id: number;
  did: string; // formatted "D00001"
  titulo: string;
  tipo: string;
  doc_dia: number | null;
  doc_mes: number | null;
  doc_anio: number | null;
  doc_fecha_tipo: FechaTipo;
  descripcion: string;
  ruta: string | null;
  nombre_original: string | null;
  creado_en: string;
  actualizado_en: string;
  personas: DocumentoPersona[];
}

export type FechaTipo = 'exacta' | 'solo_anio' | 'aproximada' | 'desconocida';

export interface FechaInput {
  dia: number | null;
  mes: number | null;
  anio: number | null;
  tipo: FechaTipo;
}
```

Create `frontend/src/types/index.ts` (same interfaces, for the frontend):
```ts
export type Sexo = 'M' | 'F' | 'otro';
export type FechaTipo = 'exacta' | 'solo_anio' | 'aproximada' | 'desconocida';

export interface Lugar {
  id: number;
  ciudad: string;
  provincia: string | null;
  pais: string;
}

export interface FechaInput {
  dia: number | null;
  mes: number | null;
  anio: number | null;
  tipo: FechaTipo;
}

export interface PersonaListItem {
  id: number;
  pid: string;
  nombre: string;
  apellido: string;
  nac_anio: number | null;
}

export interface Persona {
  id: number;
  pid: string;
  nombre: string;
  apellido: string;
  sexo: Sexo;
  nac_dia: number | null;
  nac_mes: number | null;
  nac_anio: number | null;
  nac_tipo: FechaTipo;
  nac_lugar: Lugar | null;
  def_dia: number | null;
  def_mes: number | null;
  def_anio: number | null;
  def_tipo: FechaTipo;
  def_lugar: Lugar | null;
  historia: string;
  foto_ruta: string | null;
}

export interface TipoRelacion {
  id: number;
  nombre: string;
  inverso_id: number | null;
}

export interface Relacion {
  id: number;
  tipo_relacion_id: number;
  tipo_relacion_nombre: string;
  persona_destino_id: number;
  persona_destino_pid: string;
  persona_destino_nombre: string;
}

export interface DocumentoPersona {
  persona_id: number;
  persona_pid: string;
  persona_nombre: string;
  rol: 'principal' | 'mencionada';
}

export interface Documento {
  id: number;
  did: string;
  titulo: string;
  tipo: string;
  doc_dia: number | null;
  doc_mes: number | null;
  doc_anio: number | null;
  doc_fecha_tipo: FechaTipo;
  descripcion: string;
  ruta: string | null;
  nombre_original: string | null;
  creado_en: string;
  personas: DocumentoPersona[];
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/types.ts frontend/src/types/index.ts
git commit -m "feat: shared TypeScript interfaces"
```

---

## Task 4: Persona Service (Backend)

**Files:**
- Create: `backend/src/services/personaService.ts`

- [ ] **Step 1: Write the service**

Create `backend/src/services/personaService.ts`:
```ts
import { getDb } from '../db/database';
import type { Persona, PersonaListItem } from '../types';

export function formatPid(id: number): string {
  return `P${String(id).padStart(5, '0')}`;
}

export function listPersonas(search?: string): PersonaListItem[] {
  const db = getDb();
  let query = `
    SELECT id, nombre, apellido, nac_anio
    FROM personas
  `;
  const params: string[] = [];
  if (search) {
    query += ` WHERE nombre LIKE ? OR apellido LIKE ? OR (apellido || ', ' || nombre) LIKE ?`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  query += ` ORDER BY apellido, nombre`;
  const rows = db.prepare(query).all(...params) as Array<{
    id: number; nombre: string; apellido: string; nac_anio: number | null;
  }>;
  return rows.map(r => ({ ...r, pid: formatPid(r.id) }));
}

export function getPersona(id: number): Persona | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT p.*,
      l1.ciudad as nac_ciudad, l1.provincia as nac_provincia, l1.pais as nac_pais,
      l2.ciudad as def_ciudad, l2.provincia as def_provincia, l2.pais as def_pais
    FROM personas p
    LEFT JOIN lugares l1 ON p.nac_lugar_id = l1.id
    LEFT JOIN lugares l2 ON p.def_lugar_id = l2.id
    WHERE p.id = ?
  `).get(id) as any;
  if (!row) return null;
  return {
    ...row,
    pid: formatPid(row.id),
    nac_lugar: row.nac_ciudad ? {
      id: row.nac_lugar_id,
      ciudad: row.nac_ciudad,
      provincia: row.nac_provincia,
      pais: row.nac_pais,
    } : null,
    def_lugar: row.def_ciudad ? {
      id: row.def_lugar_id,
      ciudad: row.def_ciudad,
      provincia: row.def_provincia,
      pais: row.def_pais,
    } : null,
  };
}

export interface CreatePersonaInput {
  nombre: string;
  apellido: string;
  sexo: 'M' | 'F' | 'otro';
  nac_dia?: number | null;
  nac_mes?: number | null;
  nac_anio?: number | null;
  nac_tipo?: string;
  nac_lugar_id?: number | null;
  def_dia?: number | null;
  def_mes?: number | null;
  def_anio?: number | null;
  def_tipo?: string;
  def_lugar_id?: number | null;
  historia?: string;
}

export function createPersona(input: CreatePersonaInput): Persona {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO personas
      (nombre, apellido, sexo, nac_dia, nac_mes, nac_anio, nac_tipo, nac_lugar_id,
       def_dia, def_mes, def_anio, def_tipo, def_lugar_id, historia)
    VALUES
      (@nombre, @apellido, @sexo, @nac_dia, @nac_mes, @nac_anio, @nac_tipo, @nac_lugar_id,
       @def_dia, @def_mes, @def_anio, @def_tipo, @def_lugar_id, @historia)
  `).run({
    nombre: input.nombre,
    apellido: input.apellido,
    sexo: input.sexo,
    nac_dia: input.nac_dia ?? null,
    nac_mes: input.nac_mes ?? null,
    nac_anio: input.nac_anio ?? null,
    nac_tipo: input.nac_tipo ?? 'desconocida',
    nac_lugar_id: input.nac_lugar_id ?? null,
    def_dia: input.def_dia ?? null,
    def_mes: input.def_mes ?? null,
    def_anio: input.def_anio ?? null,
    def_tipo: input.def_tipo ?? 'desconocida',
    def_lugar_id: input.def_lugar_id ?? null,
    historia: input.historia ?? '',
  });
  return getPersona(result.lastInsertRowid as number)!;
}

export function updatePersona(id: number, input: Partial<CreatePersonaInput>): Persona | null {
  const db = getDb();
  const fields = Object.entries(input)
    .map(([k]) => `${k} = @${k}`)
    .join(', ');
  if (!fields) return getPersona(id);
  db.prepare(`
    UPDATE personas SET ${fields}, actualizado_en = datetime('now') WHERE id = @id
  `).run({ ...input, id });
  return getPersona(id);
}

export function deletePersona(id: number): void {
  getDb().prepare('DELETE FROM personas WHERE id = ?').run(id);
}
```

- [ ] **Step 2: Add unit tests to personaService.test.ts**

Append to `backend/src/__tests__/personaService.test.ts`:
```ts
import { createPersona, listPersonas, updatePersona, formatPid } from '../services/personaService';

describe('formatPid', () => {
  it('pads to 5 digits', () => {
    expect(formatPid(1)).toBe('P00001');
    expect(formatPid(200)).toBe('P00200');
  });
});

describe('createPersona / listPersonas', () => {
  it('creates and lists a persona', () => {
    const p = createPersona({ nombre: 'Tomás', apellido: 'Moreno', sexo: 'M', nac_anio: 2004 });
    expect(p.pid).toMatch(/^P\d{5}$/);
    expect(p.nombre).toBe('Tomás');
    const list = listPersonas();
    expect(list.some(x => x.id === p.id)).toBe(true);
  });

  it('searches by name', () => {
    createPersona({ nombre: 'Ana', apellido: 'García', sexo: 'F' });
    const results = listPersonas('García');
    expect(results.every(x => x.apellido.includes('García'))).toBe(true);
  });
});

describe('updatePersona', () => {
  it('updates historia without changing id', () => {
    const p = createPersona({ nombre: 'Luis', apellido: 'Bauer', sexo: 'M' });
    const updated = updatePersona(p.id, { historia: 'Nació en 1950.' });
    expect(updated?.historia).toBe('Nació en 1950.');
    expect(updated?.id).toBe(p.id);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
cd backend && npm test -- --testPathPattern=personaService
```

Expected: PASS (5 tests)

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/personaService.ts backend/src/__tests__/personaService.test.ts
git commit -m "feat: persona service with CRUD and ID formatting"
```

---

## Task 5: File System Service

**Files:**
- Create: `backend/src/services/fileSystemService.ts`

- [ ] **Step 1: Write the service**

Create `backend/src/services/fileSystemService.ts`:
```ts
import fs from 'fs';
import path from 'path';
import type { Persona, Relacion, Documento } from '../types';

export function formatDid(id: number): string {
  return `D${String(id).padStart(5, '0')}`;
}

export const DATA_ROOT = path.join(process.cwd(), '..', 'Archivo_Genealogico');

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
  const n = sanitizeName(persona.nombre);
  const a = sanitizeName(persona.apellido);
  return `${pid}_${a}_${n}`;
}

export function personaFolderPath(persona: { id: number; nombre: string; apellido: string }): string {
  return path.join(DATA_ROOT, 'Personas', personaFolderName(persona));
}

export function ensurePersonaFolder(persona: { id: number; nombre: string; apellido: string }): string {
  const folderPath = personaFolderPath(persona);
  fs.mkdirSync(path.join(folderPath, 'Documentos'), { recursive: true });
  fs.mkdirSync(path.join(folderPath, 'Fotos'), { recursive: true });
  return folderPath;
}

function formatFecha(
  dia: number | null, mes: number | null, anio: number | null,
  tipo: string
): string {
  if (tipo === 'desconocida') return 'Desconocida';
  if (tipo === 'aproximada' && anio) return `aprox. ${anio}`;
  if (tipo === 'solo_anio' && anio) return String(anio);
  if (dia && mes && anio) {
    return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
  }
  if (anio) return String(anio);
  return 'Desconocida';
}

function formatLugar(lugar: { ciudad: string; provincia: string | null; pais: string } | null): string {
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
    ? relaciones.map(r =>
        `- **${r.tipo_relacion_nombre}:** [${r.persona_destino_pid}] ${r.persona_destino_nombre}`
      ).join('\n')
    : '_Sin relaciones registradas._';

  const principalesMd = docsPrincipales.length > 0
    ? docsPrincipales.map(d =>
        `- **${formatDid(d.id)}** — ${d.titulo} (${d.tipo})`
      ).join('\n')
    : '_Sin documentos principales._';

  const mencionadaMd = docsMencionada.length > 0
    ? docsMencionada.map(d =>
        `- **${formatDid(d.id)}** — ${d.titulo} (${d.tipo})`
      ).join('\n')
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
| Lugar de nacimiento | ${formatLugar(persona.nac_lugar ?? null)} |
| Fecha de defunción | ${defuncion} |
| Lugar de defunción | ${formatLugar(persona.def_lugar ?? null)} |

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

export function documentoFileName(docId: number, titulo: string, originalExt: string): string {
  const did = formatDid(docId);
  const safe = sanitizeName(titulo).slice(0, 40);
  return `${did}_${safe}${originalExt}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/fileSystemService.ts
git commit -m "feat: file system service for folder and Markdown generation"
```

---

## Task 6: Relacion Service

**Files:**
- Create: `backend/src/services/relacionService.ts`
- Modify: `backend/src/__tests__/relacionService.test.ts`

- [ ] **Step 1: Write the service**

Create `backend/src/services/relacionService.ts`:
```ts
import { getDb } from '../db/database';
import type { Relacion, TipoRelacion } from '../types';
import { formatPid } from './personaService';

export function listTiposRelacion(): TipoRelacion[] {
  return getDb().prepare('SELECT * FROM tipo_relacion ORDER BY id').all() as TipoRelacion[];
}

export function getRelacionesDePersona(personaId: number): Relacion[] {
  const rows = getDb().prepare(`
    SELECT
      r.id,
      r.persona_origen_id,
      r.tipo_relacion_id,
      tr.nombre as tipo_relacion_nombre,
      r.persona_destino_id,
      (p.apellido || ', ' || p.nombre) as persona_destino_nombre
    FROM relaciones r
    JOIN tipo_relacion tr ON r.tipo_relacion_id = tr.id
    JOIN personas p ON r.persona_destino_id = p.id
    WHERE r.persona_origen_id = ?
    ORDER BY tr.id, p.apellido, p.nombre
  `).all(personaId) as any[];
  return rows.map(r => ({
    ...r,
    persona_destino_pid: formatPid(r.persona_destino_id),
  }));
}

export function addRelacion(
  personaOrigenId: number,
  tipoRelacionId: number,
  personaDestinoId: number
): void {
  const db = getDb();
  const tipo = db.prepare(
    'SELECT * FROM tipo_relacion WHERE id = ?'
  ).get(tipoRelacionId) as TipoRelacion | undefined;
  if (!tipo) throw new Error(`Tipo de relación ${tipoRelacionId} no existe`);

  const insertRelacion = db.prepare(`
    INSERT OR IGNORE INTO relaciones (persona_origen_id, tipo_relacion_id, persona_destino_id)
    VALUES (?, ?, ?)
  `);

  db.transaction(() => {
    // Direct relation
    insertRelacion.run(personaOrigenId, tipoRelacionId, personaDestinoId);

    // Inverse relation
    if (tipo.inverso_id) {
      insertRelacion.run(personaDestinoId, tipo.inverso_id, personaOrigenId);
    }
  })();
}

export function deleteRelacion(relacionId: number): void {
  const db = getDb();
  const rel = db.prepare('SELECT * FROM relaciones WHERE id = ?').get(relacionId) as any;
  if (!rel) return;
  const tipo = db.prepare('SELECT * FROM tipo_relacion WHERE id = ?').get(rel.tipo_relacion_id) as TipoRelacion;

  db.transaction(() => {
    db.prepare('DELETE FROM relaciones WHERE id = ?').run(relacionId);
    // Delete inverse too
    if (tipo.inverso_id) {
      db.prepare(`
        DELETE FROM relaciones
        WHERE persona_origen_id = ? AND tipo_relacion_id = ? AND persona_destino_id = ?
      `).run(rel.persona_destino_id, tipo.inverso_id, rel.persona_origen_id);
    }
  })();
}
```

- [ ] **Step 2: Write tests**

Create `backend/src/__tests__/relacionService.test.ts`:
```ts
jest.mock('../db/database', () => {
  const Database = require('better-sqlite3');
  const fs = require('fs');
  const path = require('path');
  let db: any;
  return {
    getDb: () => {
      if (!db) {
        db = new Database(':memory:');
        const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');
        db.exec(schema);
      }
      return db;
    },
  };
});

import { createPersona } from '../services/personaService';
import { addRelacion, getRelacionesDePersona, deleteRelacion, listTiposRelacion } from '../services/relacionService';

describe('addRelacion', () => {
  it('creates bidirectional relation (Padre ↔ Hijo)', () => {
    const padre = createPersona({ nombre: 'Luis', apellido: 'Bauer', sexo: 'M' });
    const hija = createPersona({ nombre: 'Lorena', apellido: 'Bauer', sexo: 'F' });

    const tipos = listTiposRelacion();
    const tipoMadre = tipos.find(t => t.nombre === 'Padre')!;

    addRelacion(padre.id, tipoMadre.id, hija.id);

    const relacionesPadre = getRelacionesDePersona(padre.id);
    const relacionesHija = getRelacionesDePersona(hija.id);

    expect(relacionesPadre.some(r => r.persona_destino_id === hija.id)).toBe(true);
    expect(relacionesHija.some(r => r.persona_destino_id === padre.id)).toBe(true);
  });

  it('deletes both directions on deleteRelacion', () => {
    const a = createPersona({ nombre: 'A', apellido: 'Z', sexo: 'M' });
    const b = createPersona({ nombre: 'B', apellido: 'Z', sexo: 'F' });
    const tipos = listTiposRelacion();
    const conyugue = tipos.find(t => t.nombre === 'Cónyuge')!;
    addRelacion(a.id, conyugue.id, b.id);

    const relA = getRelacionesDePersona(a.id);
    deleteRelacion(relA[0].id);

    expect(getRelacionesDePersona(a.id)).toHaveLength(0);
    expect(getRelacionesDePersona(b.id)).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
cd backend && npm test -- --testPathPattern=relacionService
```

Expected: PASS (2 tests)

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/relacionService.ts backend/src/__tests__/relacionService.test.ts
git commit -m "feat: relacion service with automatic inverse creation"
```

---

## Task 7: Lugar Service

**Files:**
- Create: `backend/src/services/lugarService.ts`

- [ ] **Step 1: Write the service**

Create `backend/src/services/lugarService.ts`:
```ts
import { getDb } from '../db/database';
import type { Lugar } from '../types';

export function searchLugares(q: string): Lugar[] {
  const search = `%${q}%`;
  return getDb().prepare(`
    SELECT * FROM lugares
    WHERE ciudad LIKE ? OR provincia LIKE ? OR pais LIKE ?
    ORDER BY ciudad, provincia, pais
    LIMIT 20
  `).all(search, search, search) as Lugar[];
}

export function upsertLugar(input: {
  ciudad: string;
  provincia?: string | null;
  pais: string;
  latitud?: number | null;
  longitud?: number | null;
}): Lugar {
  const db = getDb();
  db.prepare(`
    INSERT INTO lugares (ciudad, provincia, pais, latitud, longitud)
    VALUES (@ciudad, @provincia, @pais, @latitud, @longitud)
    ON CONFLICT(ciudad, provincia, pais) DO UPDATE SET
      latitud = COALESCE(@latitud, latitud),
      longitud = COALESCE(@longitud, longitud)
  `).run({
    ciudad: input.ciudad,
    provincia: input.provincia ?? null,
    pais: input.pais,
    latitud: input.latitud ?? null,
    longitud: input.longitud ?? null,
  });
  return db.prepare(
    'SELECT * FROM lugares WHERE ciudad = ? AND pais = ? AND (provincia = ? OR (provincia IS NULL AND ? IS NULL))'
  ).get(input.ciudad, input.pais, input.provincia ?? null, input.provincia ?? null) as Lugar;
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/lugarService.ts
git commit -m "feat: lugar service with search and upsert"
```

---

## Task 8: Documento Service

**Files:**
- Create: `backend/src/services/documentoService.ts`

- [ ] **Step 1: Write the service**

Create `backend/src/services/documentoService.ts`:
```ts
import { getDb } from '../db/database';
import type { Documento, DocumentoPersona } from '../types';
import { formatPid } from './personaService';

export function formatDid(id: number): string {
  return `D${String(id).padStart(5, '0')}`;
}

function hydratePersonas(documentoId: number): DocumentoPersona[] {
  return (getDb().prepare(`
    SELECT dp.persona_id, dp.rol,
      (p.apellido || ', ' || p.nombre) as persona_nombre
    FROM documento_personas dp
    JOIN personas p ON dp.persona_id = p.id
    WHERE dp.documento_id = ?
    ORDER BY dp.rol DESC, p.apellido, p.nombre
  `).all(documentoId) as any[]).map(r => ({
    persona_id: r.persona_id,
    persona_pid: formatPid(r.persona_id),
    persona_nombre: r.persona_nombre,
    rol: r.rol as 'principal' | 'mencionada',
  }));
}

function hydrateDoc(row: any): Documento {
  return {
    ...row,
    did: formatDid(row.id),
    personas: hydratePersonas(row.id),
  };
}

export function getDocumento(id: number): Documento | null {
  const row = getDb().prepare('SELECT * FROM documentos WHERE id = ?').get(id);
  if (!row) return null;
  return hydrateDoc(row);
}

// Returns documents where this persona is 'principal'
export function getDocumentosPrincipalesDePersona(personaId: number): Documento[] {
  const rows = getDb().prepare(`
    SELECT d.* FROM documentos d
    JOIN documento_personas dp ON dp.documento_id = d.id
    WHERE dp.persona_id = ? AND dp.rol = 'principal'
    ORDER BY d.doc_anio DESC, d.creado_en DESC
  `).all(personaId) as any[];
  return rows.map(hydrateDoc);
}

// Returns documents where this persona is 'mencionada'
export function getDocumentosMencionadaDePersona(personaId: number): Documento[] {
  const rows = getDb().prepare(`
    SELECT d.* FROM documentos d
    JOIN documento_personas dp ON dp.documento_id = d.id
    WHERE dp.persona_id = ? AND dp.rol = 'mencionada'
    ORDER BY d.doc_anio DESC, d.creado_en DESC
  `).all(personaId) as any[];
  return rows.map(hydrateDoc);
}

export interface CreateDocumentoInput {
  titulo: string;
  tipo: string;
  doc_dia?: number | null;
  doc_mes?: number | null;
  doc_anio?: number | null;
  doc_fecha_tipo?: string;
  descripcion?: string;
  ruta?: string | null;
  nombre_original?: string | null;
  personasPrincipales: number[];  // persona IDs
  personasMencionadas?: number[]; // persona IDs
}

export function createDocumento(input: CreateDocumentoInput): Documento {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO documentos
      (titulo, tipo, doc_dia, doc_mes, doc_anio, doc_fecha_tipo, descripcion, ruta, nombre_original)
    VALUES
      (@titulo, @tipo, @doc_dia, @doc_mes, @doc_anio, @doc_fecha_tipo, @descripcion, @ruta, @nombre_original)
  `).run({
    titulo: input.titulo,
    tipo: input.tipo,
    doc_dia: input.doc_dia ?? null,
    doc_mes: input.doc_mes ?? null,
    doc_anio: input.doc_anio ?? null,
    doc_fecha_tipo: input.doc_fecha_tipo ?? 'desconocida',
    descripcion: input.descripcion ?? '',
    ruta: input.ruta ?? null,
    nombre_original: input.nombre_original ?? null,
  });
  const docId = result.lastInsertRowid as number;

  const insertPersona = db.prepare(`
    INSERT OR IGNORE INTO documento_personas (documento_id, persona_id, rol)
    VALUES (?, ?, ?)
  `);

  db.transaction(() => {
    for (const pid of input.personasPrincipales) {
      insertPersona.run(docId, pid, 'principal');
    }
    for (const pid of (input.personasMencionadas ?? [])) {
      insertPersona.run(docId, pid, 'mencionada');
    }
  })();

  return getDocumento(docId)!;
}

export function updateDocumentoRuta(docId: number, ruta: string, nombreOriginal: string): void {
  getDb().prepare(`
    UPDATE documentos SET ruta = ?, nombre_original = ?, actualizado_en = datetime('now') WHERE id = ?
  `).run(ruta, nombreOriginal, docId);
}

export function updateDocumento(id: number, input: Partial<CreateDocumentoInput>): Documento | null {
  const db = getDb();
  const fields: string[] = [];
  const params: Record<string, any> = { id };
  const allowed = ['titulo','tipo','doc_dia','doc_mes','doc_anio','doc_fecha_tipo','descripcion'];
  for (const key of allowed) {
    if (key in input) { fields.push(`${key} = @${key}`); params[key] = (input as any)[key]; }
  }
  if (fields.length > 0) {
    db.prepare(`UPDATE documentos SET ${fields.join(', ')}, actualizado_en = datetime('now') WHERE id = @id`).run(params);
  }

  // Update personas if provided
  if (input.personasPrincipales !== undefined || input.personasMencionadas !== undefined) {
    db.transaction(() => {
      if (input.personasPrincipales !== undefined) {
        db.prepare("DELETE FROM documento_personas WHERE documento_id = ? AND rol = 'principal'").run(id);
        for (const pid of input.personasPrincipales) {
          db.prepare("INSERT OR IGNORE INTO documento_personas (documento_id, persona_id, rol) VALUES (?,?,'principal')").run(id, pid);
        }
      }
      if (input.personasMencionadas !== undefined) {
        db.prepare("DELETE FROM documento_personas WHERE documento_id = ? AND rol = 'mencionada'").run(id);
        for (const pid of input.personasMencionadas) {
          db.prepare("INSERT OR IGNORE INTO documento_personas (documento_id, persona_id, rol) VALUES (?,?,'mencionada')").run(id, pid);
        }
      }
    })();
  }

  return getDocumento(id);
}

export function deleteDocumento(id: number): void {
  getDb().prepare('DELETE FROM documentos WHERE id = ?').run(id);
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/documentoService.ts
git commit -m "feat: documento service with D00001 IDs, principal/mencionada personas"
```

---

## Task 9: Express App + Routes

**Files:**
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`
- Create: `backend/src/routes/personas.ts`
- Create: `backend/src/routes/relaciones.ts`
- Create: `backend/src/routes/documentos.ts`
- Create: `backend/src/routes/lugares.ts`

- [ ] **Step 1: Write app.ts**

Create `backend/src/app.ts`:
```ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import { personasRouter } from './routes/personas';
import { relacionesRouter } from './routes/relaciones';
import { documentosRouter } from './routes/documentos';
import { lugaresRouter } from './routes/lugares';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(process.cwd(), '..', 'Archivo_Genealogico')));
  app.use('/api/personas', personasRouter);
  app.use('/api/relaciones', relacionesRouter);
  app.use('/api/documentos', documentosRouter);
  app.use('/api/lugares', lugaresRouter);
  return app;
}
```

Create `backend/src/server.ts`:
```ts
import { createApp } from './app';
import { getDb } from './db/database';

const PORT = process.env.PORT || 3001;
getDb(); // initialize DB on startup
const app = createApp();
app.listen(PORT, () => {
  console.log(`Archivo Genealógico API running on http://localhost:${PORT}`);
});
```

- [ ] **Step 2: Write personas route**

Create `backend/src/routes/personas.ts`:
```ts
import { Router } from 'express';
import {
  listPersonas, getPersona, createPersona, updatePersona, deletePersona
} from '../services/personaService';
import { getRelacionesDePersona } from '../services/relacionService';
import { getDocumentosPrincipalesDePersona, getDocumentosMencionadaDePersona } from '../services/documentoService';
import { writePersonaMd } from '../services/fileSystemService';

export const personasRouter = Router();

function regenerateMd(personaId: number): void {
  const p = getPersona(personaId);
  if (!p) return;
  writePersonaMd(
    p,
    getRelacionesDePersona(personaId),
    getDocumentosPrincipalesDePersona(personaId),
    getDocumentosMencionadaDePersona(personaId)
  );
}

personasRouter.get('/', (req, res) => {
  const search = typeof req.query.q === 'string' ? req.query.q : undefined;
  res.json(listPersonas(search));
});

personasRouter.get('/:id', (req, res) => {
  const p = getPersona(Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'No encontrada' });
  res.json(p);
});

personasRouter.post('/', (req, res) => {
  try {
    const persona = createPersona(req.body);
    regenerateMd(persona.id);
    res.status(201).json(persona);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

personasRouter.put('/:id', (req, res) => {
  const updated = updatePersona(Number(req.params.id), req.body);
  if (!updated) return res.status(404).json({ error: 'No encontrada' });
  regenerateMd(updated.id);
  res.json(updated);
});

personasRouter.delete('/:id', (req, res) => {
  deletePersona(Number(req.params.id));
  res.status(204).end();
});
```

- [ ] **Step 3: Write relaciones route**

Create `backend/src/routes/relaciones.ts`:
```ts
import { Router } from 'express';
import { addRelacion, deleteRelacion, getRelacionesDePersona, listTiposRelacion } from '../services/relacionService';
import { getPersona } from '../services/personaService';
import { getDocumentosPrincipalesDePersona, getDocumentosMencionadaDePersona } from '../services/documentoService';
import { writePersonaMd } from '../services/fileSystemService';

export const relacionesRouter = Router();

function regenerateMd(personaId: number): void {
  const p = getPersona(personaId);
  if (!p) return;
  writePersonaMd(
    p,
    getRelacionesDePersona(personaId),
    getDocumentosPrincipalesDePersona(personaId),
    getDocumentosMencionadaDePersona(personaId)
  );
}

relacionesRouter.get('/tipos', (_req, res) => {
  res.json(listTiposRelacion());
});

relacionesRouter.get('/persona/:id', (req, res) => {
  res.json(getRelacionesDePersona(Number(req.params.id)));
});

relacionesRouter.post('/', (req, res) => {
  const { persona_origen_id, tipo_relacion_id, persona_destino_id } = req.body;
  try {
    addRelacion(Number(persona_origen_id), Number(tipo_relacion_id), Number(persona_destino_id));
    for (const id of [persona_origen_id, persona_destino_id]) regenerateMd(Number(id));
    res.status(201).json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

relacionesRouter.delete('/:id', (req, res) => {
  deleteRelacion(Number(req.params.id));
  res.status(204).end();
});
```

- [ ] **Step 4: Write documentos route**

Create `backend/src/routes/documentos.ts`:
```ts
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  createDocumento, getDocumento, updateDocumento, updateDocumentoRuta,
  deleteDocumento, getDocumentosPrincipalesDePersona, getDocumentosMencionadaDePersona,
} from '../services/documentoService';
import { getPersona } from '../services/personaService';
import { getRelacionesDePersona } from '../services/relacionService';
import {
  writePersonaMd, getDocumentosPath, ensurePersonaFolder, documentoFileName,
} from '../services/fileSystemService';

export const documentosRouter = Router();

// Helper: regenerate persona.md for all affected personas after document changes
function regenerateMdForDocPersonas(docId: number): void {
  const doc = getDocumento(docId);
  if (!doc) return;
  const allPersonaIds = doc.personas.map(p => p.persona_id);
  for (const pid of allPersonaIds) {
    const p = getPersona(pid);
    if (!p) continue;
    writePersonaMd(
      p,
      getRelacionesDePersona(pid),
      getDocumentosPrincipalesDePersona(pid),
      getDocumentosMencionadaDePersona(pid)
    );
  }
}

// Multer: file goes into the first principal persona's Documentos/ folder
// docId is passed as a query param after the document record is created
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const docId = Number(req.params.docId);
    const doc = getDocumento(docId);
    if (!doc) return cb(new Error('Documento no encontrado'), '');
    const principal = doc.personas.find(p => p.rol === 'principal');
    if (!principal) return cb(new Error('Sin persona principal'), '');
    const persona = getPersona(principal.persona_id);
    if (!persona) return cb(new Error('Persona principal no encontrada'), '');
    ensurePersonaFolder(persona);
    cb(null, getDocumentosPath(persona));
  },
  filename: (req, file, cb) => {
    const docId = Number(req.params.docId);
    const ext = path.extname(file.originalname);
    const doc = getDocumento(docId);
    cb(null, doc ? documentoFileName(docId, doc.titulo, ext) : `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// GET /api/documentos/persona/:personaId
documentosRouter.get('/persona/:personaId', (req, res) => {
  const pid = Number(req.params.personaId);
  res.json({
    principales: getDocumentosPrincipalesDePersona(pid),
    mencionada: getDocumentosMencionadaDePersona(pid),
  });
});

// GET /api/documentos/:id
documentosRouter.get('/:id', (req, res) => {
  const doc = getDocumento(Number(req.params.id));
  if (!doc) return res.status(404).json({ error: 'No encontrado' });
  res.json(doc);
});

// POST /api/documentos — create document record (without file yet)
documentosRouter.post('/', (req, res) => {
  try {
    const { titulo, tipo, doc_dia, doc_mes, doc_anio, doc_fecha_tipo,
            descripcion, personasPrincipales, personasMencionadas } = req.body;
    if (!titulo || !tipo) return res.status(400).json({ error: 'titulo y tipo son requeridos' });
    if (!personasPrincipales?.length) return res.status(400).json({ error: 'Se requiere al menos una persona principal' });

    const doc = createDocumento({
      titulo, tipo,
      doc_dia: doc_dia ?? null,
      doc_mes: doc_mes ?? null,
      doc_anio: doc_anio ?? null,
      doc_fecha_tipo: doc_fecha_tipo ?? 'desconocida',
      descripcion: descripcion ?? '',
      personasPrincipales: personasPrincipales.map(Number),
      personasMencionadas: (personasMencionadas ?? []).map(Number),
    });

    regenerateMdForDocPersonas(doc.id);
    res.status(201).json(doc);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/documentos/:docId/archivo — upload file to an existing document
documentosRouter.post('/:docId/archivo', upload.single('archivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const docId = Number(req.params.docId);
  updateDocumentoRuta(docId, req.file.path, req.file.originalname);
  regenerateMdForDocPersonas(docId);
  res.json(getDocumento(docId));
});

// PUT /api/documentos/:id — update metadata + personas
documentosRouter.put('/:id', (req, res) => {
  const updated = updateDocumento(Number(req.params.id), req.body);
  if (!updated) return res.status(404).json({ error: 'No encontrado' });
  regenerateMdForDocPersonas(updated.id);
  res.json(updated);
});

// DELETE /api/documentos/:id
documentosRouter.delete('/:id', (req, res) => {
  regenerateMdForDocPersonas(Number(req.params.id));
  deleteDocumento(Number(req.params.id));
  res.status(204).end();
});
```

- [ ] **Step 5: Write lugares route**

Create `backend/src/routes/lugares.ts`:
```ts
import { Router } from 'express';
import { searchLugares, upsertLugar } from '../services/lugarService';

export const lugaresRouter = Router();

lugaresRouter.get('/search', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  if (q.length < 2) return res.json([]);
  res.json(searchLugares(q));
});

lugaresRouter.post('/', (req, res) => {
  try {
    res.status(201).json(upsertLugar(req.body));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
```

- [ ] **Step 6: Start and smoke test**

```bash
cd backend && npm run dev
```

In another terminal:
```bash
curl -s -X POST http://localhost:3001/api/personas \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Tomás","apellido":"Moreno Bauer","sexo":"M","nac_anio":2004}' | jq .

curl -s http://localhost:3001/api/personas | jq .
```

Expected: persona created with `pid: "P00001"`, listing returns array.

- [ ] **Step 7: Commit**

```bash
git add backend/src/app.ts backend/src/server.ts backend/src/routes/
git commit -m "feat: Express REST API for personas, relaciones, documentos, lugares"
```

---

## Task 10: Frontend Foundation + API Client

**Files:**
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/index.html`

- [ ] **Step 1: Write entry files**

Create `frontend/index.html`:
```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Archivo Genealógico Familiar</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f5f5f0; color: #1a1a1a; }
      a { color: inherit; text-decoration: none; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `frontend/src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

Create `frontend/src/App.tsx`:
```tsx
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PersonaPage from './pages/PersonaPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/persona/:id" element={<PersonaPage />} />
    </Routes>
  );
}
```

- [ ] **Step 2: Write API client**

Create `frontend/src/api/client.ts`:
```ts
import axios from 'axios';
import type { PersonaListItem, Persona, Relacion, TipoRelacion, Documento, Lugar } from '../types';

const api = axios.create({ baseURL: '/api' });

export const personasApi = {
  list: (q?: string) =>
    api.get<PersonaListItem[]>('/personas', { params: q ? { q } : {} }).then(r => r.data),
  get: (id: number) =>
    api.get<Persona>(`/personas/${id}`).then(r => r.data),
  create: (data: Partial<Persona>) =>
    api.post<Persona>('/personas', data).then(r => r.data),
  update: (id: number, data: Partial<Persona>) =>
    api.put<Persona>(`/personas/${id}`, data).then(r => r.data),
  delete: (id: number) =>
    api.delete(`/personas/${id}`),
};

export const relacionesApi = {
  tipos: () =>
    api.get<TipoRelacion[]>('/relaciones/tipos').then(r => r.data),
  dePersona: (id: number) =>
    api.get<Relacion[]>(`/relaciones/persona/${id}`).then(r => r.data),
  add: (data: { persona_origen_id: number; tipo_relacion_id: number; persona_destino_id: number }) =>
    api.post('/relaciones', data),
  delete: (id: number) =>
    api.delete(`/relaciones/${id}`),
};

export const documentosApi = {
  dePersona: (personaId: number) =>
    api.get<{ principales: Documento[]; mencionada: Documento[] }>(
      `/documentos/persona/${personaId}`
    ).then(r => r.data),
  get: (id: number) =>
    api.get<Documento>(`/documentos/${id}`).then(r => r.data),
  create: (data: {
    titulo: string;
    tipo: string;
    doc_dia?: number | null;
    doc_mes?: number | null;
    doc_anio?: number | null;
    doc_fecha_tipo?: string;
    descripcion?: string;
    personasPrincipales: number[];
    personasMencionadas?: number[];
  }) => api.post<Documento>('/documentos', data).then(r => r.data),
  uploadArchivo: (docId: number, file: File) => {
    const fd = new FormData();
    fd.append('archivo', file);
    return api.post<Documento>(`/documentos/${docId}/archivo`, fd).then(r => r.data);
  },
  update: (id: number, data: Partial<{
    titulo: string; tipo: string; descripcion: string;
    personasPrincipales: number[]; personasMencionadas: number[];
  }>) => api.put<Documento>(`/documentos/${id}`, data).then(r => r.data),
  delete: (id: number) =>
    api.delete(`/documentos/${id}`),
};

export const lugaresApi = {
  search: (q: string) =>
    api.get<Lugar[]>('/lugares/search', { params: { q } }).then(r => r.data),
  create: (data: { ciudad: string; provincia?: string; pais: string }) =>
    api.post<Lugar>('/lugares', data).then(r => r.data),
};
```

- [ ] **Step 3: Commit**

```bash
git add frontend/index.html frontend/src/main.tsx frontend/src/App.tsx frontend/src/api/client.ts
git commit -m "feat: frontend setup with routing and API client"
```

---

## Task 11: HomePage — Índice de Personas

**Files:**
- Create: `frontend/src/pages/HomePage.tsx`
- Create: `frontend/src/components/PersonaList/PersonaList.tsx`
- Create: `frontend/src/components/PersonaForm/PersonaForm.tsx`

- [ ] **Step 1: Write PersonaList**

Create `frontend/src/components/PersonaList/PersonaList.tsx`:
```tsx
import { useNavigate } from 'react-router-dom';
import type { PersonaListItem } from '../../types';

interface Props {
  personas: PersonaListItem[];
}

export default function PersonaList({ personas }: Props) {
  const navigate = useNavigate();

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
          <th style={thStyle}>ID</th>
          <th style={thStyle}>Apellido, Nombre</th>
          <th style={thStyle}>Nacimiento</th>
        </tr>
      </thead>
      <tbody>
        {personas.map(p => (
          <tr
            key={p.id}
            onClick={() => navigate(`/persona/${p.id}`)}
            style={rowStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#eee')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <td style={tdStyle}>
              <code style={{ color: '#666', fontSize: '0.85em' }}>{p.pid}</code>
            </td>
            <td style={tdStyle}>
              <strong>{p.apellido}</strong>, {p.nombre}
            </td>
            <td style={tdStyle}>{p.nac_anio ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const thStyle: React.CSSProperties = { padding: '8px 12px', fontWeight: 600, color: '#555' };
const tdStyle: React.CSSProperties = { padding: '8px 12px', borderBottom: '1px solid #e0e0e0' };
const rowStyle: React.CSSProperties = { cursor: 'pointer', transition: 'background 0.1s' };
```

- [ ] **Step 2: Write PersonaForm (create/edit)**

Create `frontend/src/components/PersonaForm/PersonaForm.tsx`:
```tsx
import { useState } from 'react';
import type { Persona } from '../../types';

interface Props {
  initial?: Partial<Persona>;
  onSave: (data: Partial<Persona>) => void;
  onCancel: () => void;
  compact?: boolean; // for "quick create" from relation dialog
}

export default function PersonaForm({ initial = {}, onSave, onCancel, compact = false }: Props) {
  const [form, setForm] = useState({
    nombre: initial.nombre ?? '',
    apellido: initial.apellido ?? '',
    sexo: initial.sexo ?? 'M',
    nac_anio: initial.nac_anio ?? '',
    nac_dia: initial.nac_dia ?? '',
    nac_mes: initial.nac_mes ?? '',
    nac_tipo: initial.nac_tipo ?? 'desconocida',
    historia: initial.historia ?? '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      nombre: form.nombre,
      apellido: form.apellido,
      sexo: form.sexo as 'M' | 'F' | 'otro',
      nac_anio: form.nac_anio ? Number(form.nac_anio) : null,
      nac_dia: form.nac_dia ? Number(form.nac_dia) : null,
      nac_mes: form.nac_mes ? Number(form.nac_mes) : null,
      nac_tipo: form.nac_tipo as any,
      historia: compact ? undefined : form.historia,
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={rowStyle}>
        <label>Nombre *</label>
        <input required value={form.nombre} onChange={e => set('nombre', e.target.value)} style={inputStyle} />
      </div>
      <div style={rowStyle}>
        <label>Apellido *</label>
        <input required value={form.apellido} onChange={e => set('apellido', e.target.value)} style={inputStyle} />
      </div>
      <div style={rowStyle}>
        <label>Sexo *</label>
        <select value={form.sexo} onChange={e => set('sexo', e.target.value)} style={inputStyle}>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <div style={rowStyle}>
        <label>Año nacimiento</label>
        <input
          type="number" placeholder="ej. 1978"
          value={form.nac_anio} onChange={e => set('nac_anio', e.target.value)}
          style={inputStyle}
        />
      </div>
      {!compact && (
        <>
          <div style={rowStyle}>
            <label>Fecha tipo</label>
            <select value={form.nac_tipo} onChange={e => set('nac_tipo', e.target.value)} style={inputStyle}>
              <option value="desconocida">Desconocida</option>
              <option value="solo_anio">Solo año</option>
              <option value="aproximada">Aproximada</option>
              <option value="exacta">Exacta</option>
            </select>
          </div>
          {form.nac_tipo === 'exacta' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" placeholder="Día" min={1} max={31}
                value={form.nac_dia} onChange={e => set('nac_dia', e.target.value)}
                style={{ ...inputStyle, width: 80 }} />
              <input type="number" placeholder="Mes" min={1} max={12}
                value={form.nac_mes} onChange={e => set('nac_mes', e.target.value)}
                style={{ ...inputStyle, width: 80 }} />
            </div>
          )}
          <div style={rowStyle}>
            <label>Historia</label>
            <textarea
              rows={6} value={form.historia}
              onChange={e => set('historia', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={btnSecondary}>Cancelar</button>
        <button type="submit" style={btnPrimary}>Guardar</button>
      </div>
    </form>
  );
}

const rowStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
const inputStyle: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.95rem', width: '100%',
};
const btnPrimary: React.CSSProperties = {
  background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 20px',
  borderRadius: 4, cursor: 'pointer', fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  background: 'transparent', border: '1px solid #ccc', padding: '8px 16px',
  borderRadius: 4, cursor: 'pointer',
};
```

- [ ] **Step 3: Write HomePage**

Create `frontend/src/pages/HomePage.tsx`:
```tsx
import { useState, useEffect, useCallback } from 'react';
import { personasApi } from '../api/client';
import type { Persona, PersonaListItem } from '../types';
import PersonaList from '../components/PersonaList/PersonaList';
import PersonaForm from '../components/PersonaForm/PersonaForm';

export default function HomePage() {
  const [personas, setPersonas] = useState<PersonaListItem[]>([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [sortKey, setSortKey] = useState<'apellido' | 'nac_anio' | 'pid'>('apellido');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const load = useCallback(async () => {
    const data = await personasApi.list(search || undefined);
    setPersonas(data);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...personas].sort((a, b) => {
    const va = sortKey === 'pid' ? a.id : sortKey === 'nac_anio' ? (a.nac_anio ?? 9999) : a.apellido;
    const vb = sortKey === 'pid' ? b.id : sortKey === 'nac_anio' ? (b.nac_anio ?? 9999) : b.apellido;
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  async function handleCreate(data: Partial<Persona>) {
    await personasApi.create(data);
    setShowCreate(false);
    load();
  }

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 4 }}>
          Archivo Genealógico Familiar
        </h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>{personas.length} personas registradas</p>
      </header>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="search" placeholder="Buscar por nombre o apellido..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.95rem' }}
        />
        <button onClick={() => setShowCreate(true)} style={btnPrimary}>
          + Nueva persona
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['apellido', 'nac_anio', 'pid'] as const).map(k => (
            <button key={k} onClick={() => toggleSort(k)} style={{
              ...btnSmall,
              background: sortKey === k ? '#1a1a1a' : '#eee',
              color: sortKey === k ? '#fff' : '#333',
            }}>
              {k === 'apellido' ? 'Apellido' : k === 'nac_anio' ? 'Año' : 'ID'}
              {sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
            </button>
          ))}
        </div>
      </div>

      <PersonaList personas={sorted} />

      {showCreate && (
        <Modal title="Nueva Persona" onClose={() => setShowCreate(false)}>
          <PersonaForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={overlay}>
      <div style={dialog}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.1rem' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
};
const dialog: React.CSSProperties = {
  background: '#fff', borderRadius: 8, padding: 24, width: '100%',
  maxWidth: 500, maxHeight: '90vh', overflowY: 'auto',
};
const btnPrimary: React.CSSProperties = {
  background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 16px',
  borderRadius: 4, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
};
const btnSmall: React.CSSProperties = {
  border: 'none', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem',
};
```

- [ ] **Step 4: Start both servers and verify in browser**

Terminal 1:
```bash
cd backend && npm run dev
```

Terminal 2:
```bash
cd frontend && npm run dev
```

Open `http://localhost:5173` — should show empty index with "Nueva persona" button.
Create a person → should appear in the list with P00001.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/HomePage.tsx frontend/src/components/PersonaList/ frontend/src/components/PersonaForm/
git commit -m "feat: homepage with person index, search, sort, and create"
```

---

## Task 12: PersonaPage — Ficha Completa

**Files:**
- Create: `frontend/src/pages/PersonaPage.tsx`
- Create: `frontend/src/components/PersonaSearchInput/PersonaSearchInput.tsx`
- Create: `frontend/src/components/RelacionForm/RelacionForm.tsx`
- Create: `frontend/src/components/DocumentoSection/DocumentoSection.tsx`
- Create: `frontend/src/components/DocumentoForm/DocumentoForm.tsx`

- [ ] **Step 1: Write PersonaSearchInput (shared reusable picker)**

Create `frontend/src/components/PersonaSearchInput/PersonaSearchInput.tsx`:
```tsx
import { useState, useEffect, useRef } from 'react';
import { personasApi } from '../../api/client';
import type { PersonaListItem, Persona } from '../../types';
import PersonaForm from '../PersonaForm/PersonaForm';

interface Props {
  label?: string;
  excludeIds?: number[];
  onSelect: (p: PersonaListItem) => void;
  placeholder?: string;
}

export default function PersonaSearchInput({ label, excludeIds = [], onSelect, placeholder = 'Buscar persona...' }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<PersonaListItem[]>([]);
  const [creandoNueva, setCreandoNueva] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (busqueda.length < 2) { setResultados([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const r = await personasApi.list(busqueda);
      setResultados(r.filter(p => !excludeIds.includes(p.id)));
    }, 200);
  }, [busqueda, excludeIds]);

  async function handleCrearNueva(data: Partial<Persona>) {
    const nueva = await personasApi.create(data);
    onSelect({ id: nueva.id, pid: nueva.pid, nombre: nueva.nombre, apellido: nueva.apellido, nac_anio: nueva.nac_anio });
    setCreandoNueva(false);
    setBusqueda('');
  }

  if (creandoNueva) {
    return (
      <div style={{ padding: 12, background: '#f9f9f9', borderRadius: 6, border: '1px solid #ddd' }}>
        <p style={{ marginBottom: 10, fontSize: '0.85rem', color: '#666' }}>Crear nueva persona</p>
        <PersonaForm compact onSave={handleCrearNueva} onCancel={() => setCreandoNueva(false)} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {label && <label style={{ fontSize: '0.85rem', color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>}
      <input
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder={placeholder}
        style={inp}
      />
      {busqueda.length >= 2 && (
        <div style={dropdown}>
          {resultados.map(p => (
            <div key={p.id} style={item} onClick={() => { onSelect(p); setBusqueda(''); setResultados([]); }}>
              <code style={{ color: '#888', fontSize: '0.78em' }}>{p.pid}</code>{' '}
              {p.apellido}, {p.nombre}{p.nac_anio ? ` (${p.nac_anio})` : ''}
            </div>
          ))}
          <div style={{ ...item, color: '#0070f3', fontWeight: 600 }} onClick={() => setCreandoNueva(true)}>
            + Crear nueva persona
          </div>
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = { padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem', width: '100%' };
const dropdown: React.CSSProperties = {
  position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
  border: '1px solid #ccc', borderRadius: 4, zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};
const item: React.CSSProperties = { padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '0.9rem' };
```

- [ ] **Step 3: Write RelacionForm (uses PersonaSearchInput)**

Create `frontend/src/components/RelacionForm/RelacionForm.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { relacionesApi } from '../../api/client';
import type { TipoRelacion, PersonaListItem } from '../../types';
import PersonaSearchInput from '../PersonaSearchInput/PersonaSearchInput';

interface Props {
  personaId: number;
  onSaved: () => void;
  onCancel: () => void;
}

export default function RelacionForm({ personaId, onSaved, onCancel }: Props) {
  const [tipos, setTipos] = useState<TipoRelacion[]>([]);
  const [tipoId, setTipoId] = useState('');
  const [seleccionada, setSeleccionada] = useState<PersonaListItem | null>(null);

  useEffect(() => {
    relacionesApi.tipos().then(t => {
      setTipos(t);
      if (t.length > 0) setTipoId(String(t[0].id));
    });
  }, []);

  async function handleGuardar() {
    if (!tipoId || !seleccionada) return;
    await relacionesApi.add({
      persona_origen_id: personaId,
      tipo_relacion_id: Number(tipoId),
      persona_destino_id: seleccionada.id,
    });
    onSaved();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: '0.85rem', color: '#555' }}>Tipo de relación</label>
        <select value={tipoId} onChange={e => setTipoId(e.target.value)} style={inp}>
          {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
      </div>

      <PersonaSearchInput
        label="Persona relacionada"
        excludeIds={[personaId]}
        onSelect={setSeleccionada}
      />

      {seleccionada && (
        <div style={{ padding: '7px 12px', background: '#f0f9ff', borderRadius: 4, fontSize: '0.9rem' }}>
          <strong>{seleccionada.apellido}, {seleccionada.nombre}</strong>
          {' '}<span style={{ color: '#888' }}>({seleccionada.pid})</span>
          <button onClick={() => setSeleccionada(null)}
            style={{ marginLeft: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#c00' }}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={btnSecondary}>Cancelar</button>
        <button onClick={handleGuardar} disabled={!seleccionada} style={btnPrimary}>Agregar relación</button>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.95rem' };
const btnPrimary: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };
const btnSecondary: React.CSSProperties = { background: 'transparent', border: '1px solid #ccc', padding: '8px 14px', borderRadius: 4, cursor: 'pointer' };
```

- [ ] **Step 4: Write DocumentoForm (create document with persona search)**

Create `frontend/src/components/DocumentoForm/DocumentoForm.tsx`:
```tsx
import { useState } from 'react';
import { documentosApi } from '../../api/client';
import type { PersonaListItem, Documento } from '../../types';
import PersonaSearchInput from '../PersonaSearchInput/PersonaSearchInput';

const TIPOS_DOCUMENTO = [
  'Partida de nacimiento', 'Partida de matrimonio', 'Partida de defunción',
  'DNI', 'Foto', 'Censo', 'Registro histórico', 'Otro',
];

interface Props {
  defaultPersonaId?: number;
  onSaved: (doc: Documento) => void;
  onCancel: () => void;
}

export default function DocumentoForm({ defaultPersonaId, onSaved, onCancel }: Props) {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState(TIPOS_DOCUMENTO[0]);
  const [anio, setAnio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [principales, setPrincipales] = useState<PersonaListItem[]>([]);
  const [mencionadas, setMencionadas] = useState<PersonaListItem[]>([]);
  const [saving, setSaving] = useState(false);

  const allSelectedIds = [...principales, ...mencionadas].map(p => p.id);
  if (defaultPersonaId && !allSelectedIds.includes(defaultPersonaId)) {
    allSelectedIds.push(defaultPersonaId);
  }

  function removeFrom(list: PersonaListItem[], id: number): PersonaListItem[] {
    return list.filter(p => p.id !== id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const effectivePrincipales = principales.length > 0
      ? principales.map(p => p.id)
      : defaultPersonaId ? [defaultPersonaId] : [];
    if (!titulo || effectivePrincipales.length === 0) return;
    setSaving(true);
    try {
      const doc = await documentosApi.create({
        titulo, tipo,
        doc_anio: anio ? Number(anio) : null,
        doc_fecha_tipo: anio ? 'solo_anio' : 'desconocida',
        descripcion,
        personasPrincipales: effectivePrincipales,
        personasMencionadas: mencionadas.map(p => p.id),
      });
      if (file) await documentosApi.uploadArchivo(doc.id, file);
      onSaved(doc);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={f}><label>Título *</label>
        <input required value={titulo} onChange={e => setTitulo(e.target.value)} style={inp} placeholder="Partida de nacimiento de..." />
      </div>
      <div style={f}><label>Tipo *</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)} style={inp}>
          {TIPOS_DOCUMENTO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={f}><label>Año</label>
        <input type="number" placeholder="ej. 1978" value={anio} onChange={e => setAnio(e.target.value)} style={inp} />
      </div>
      <div style={f}><label>Descripción</label>
        <textarea rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)} style={{ ...inp, resize: 'vertical' }} />
      </div>

      <div style={f}>
        <label style={{ fontWeight: 600 }}>Persona(s) principal(es) {!defaultPersonaId && '*'}</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          {principales.map(p => (
            <span key={p.id} style={chip}>
              <code style={{ fontSize: '0.75em' }}>{p.pid}</code> {p.apellido}, {p.nombre}
              <button type="button" onClick={() => setPrincipales(l => removeFrom(l, p.id))} style={chipX}>×</button>
            </span>
          ))}
        </div>
        <PersonaSearchInput excludeIds={allSelectedIds} onSelect={p => setPrincipales(l => [...l, p])} placeholder="Buscar persona principal..." />
      </div>

      <div style={f}>
        <label>Personas mencionadas</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          {mencionadas.map(p => (
            <span key={p.id} style={{ ...chip, background: '#f0f0ff' }}>
              <code style={{ fontSize: '0.75em' }}>{p.pid}</code> {p.apellido}, {p.nombre}
              <button type="button" onClick={() => setMencionadas(l => removeFrom(l, p.id))} style={chipX}>×</button>
            </span>
          ))}
        </div>
        <PersonaSearchInput excludeIds={allSelectedIds} onSelect={p => setMencionadas(l => [...l, p])} placeholder="Buscar persona mencionada..." />
      </div>

      <div style={f}><label>Archivo (opcional)</label>
        <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ fontSize: '0.9rem' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={btnSecondary}>Cancelar</button>
        <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Guardando...' : 'Crear documento'}</button>
      </div>
    </form>
  );
}

const f: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
const inp: React.CSSProperties = { padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem', width: '100%' };
const chip: React.CSSProperties = { background: '#e8f5e9', padding: '3px 8px', borderRadius: 20, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 4 };
const chipX: React.CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', color: '#888', fontSize: '1rem', lineHeight: 1 };
const btnPrimary: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };
const btnSecondary: React.CSSProperties = { background: 'transparent', border: '1px solid #ccc', padding: '8px 14px', borderRadius: 4, cursor: 'pointer' };
```

- [ ] **Step 5: Write DocumentoSection (principales + mencionada)**

Create `frontend/src/components/DocumentoSection/DocumentoSection.tsx`:
```tsx
import { useState } from 'react';
import type { Documento } from '../../types';
import DocumentoForm from '../DocumentoForm/DocumentoForm';
import { documentosApi } from '../../api/client';

interface Props {
  personaId: number;
  principales: Documento[];
  mencionada: Documento[];
  onUpdate: () => void;
}

export default function DocumentoSection({ personaId, principales, mencionada, onUpdate }: Props) {
  const [adding, setAdding] = useState(false);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este documento?')) return;
    await documentosApi.delete(id);
    onUpdate();
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={sectionTitle}>Documentos</h2>
        <button onClick={() => setAdding(true)} style={btnSmall}>+ Agregar</button>
      </div>

      {adding && (
        <div style={{ marginBottom: 20, padding: 16, background: '#f9f9f9', borderRadius: 6, border: '1px solid #e0e0e0' }}>
          <DocumentoForm
            defaultPersonaId={personaId}
            onSaved={() => { setAdding(false); onUpdate(); }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <h3 style={subTitle}>Documentos principales</h3>
      {principales.length === 0
        ? <p style={empty}>Sin documentos principales.</p>
        : <ul style={list}>
            {principales.map(d => (
              <li key={d.id} style={listItem}>
                <div>
                  <code style={did}>{d.did}</code>
                  <span style={{ fontWeight: 500 }}>{d.titulo}</span>
                  <span style={tag}>{d.tipo}</span>
                  {d.doc_anio && <span style={yearStyle}>{d.doc_anio}</span>}
                  {d.nombre_original && (
                    <span style={{ marginLeft: 8, color: '#0070f3', fontSize: '0.8rem' }}>📎 {d.nombre_original}</span>
                  )}
                  {d.descripcion && <p style={{ color: '#666', fontSize: '0.82rem', marginTop: 2 }}>{d.descripcion}</p>}
                  <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 2 }}>
                    Mencionados: {d.personas.filter(p => p.rol === 'mencionada').map(p => p.persona_nombre).join(', ') || '—'}
                  </div>
                </div>
                <button onClick={() => handleDelete(d.id)} style={delBtn}>Eliminar</button>
              </li>
            ))}
          </ul>
      }

      <h3 style={{ ...subTitle, marginTop: 16 }}>Mencionado en</h3>
      {mencionada.length === 0
        ? <p style={empty}>No aparece mencionado en otros documentos.</p>
        : <ul style={list}>
            {mencionada.map(d => (
              <li key={d.id} style={listItem}>
                <div>
                  <code style={did}>{d.did}</code>
                  <span style={{ fontWeight: 500 }}>{d.titulo}</span>
                  <span style={tag}>{d.tipo}</span>
                  {d.doc_anio && <span style={yearStyle}>{d.doc_anio}</span>}
                  <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 2 }}>
                    Principal: {d.personas.filter(p => p.rol === 'principal').map(p => p.persona_nombre).join(', ')}
                  </div>
                </div>
              </li>
            ))}
          </ul>
      }
    </section>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 0 };
const subTitle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 };
const empty: React.CSSProperties = { color: '#bbb', fontSize: '0.88rem', marginBottom: 8 };
const list: React.CSSProperties = { listStyle: 'none', padding: 0, marginBottom: 8 };
const listItem: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #f2f2f2' };
const did: React.CSSProperties = { color: '#888', fontSize: '0.78em', marginRight: 8 };
const tag: React.CSSProperties = { background: '#f0f0f0', padding: '1px 6px', borderRadius: 3, fontSize: '0.75rem', marginLeft: 8, color: '#555' };
const yearStyle: React.CSSProperties = { color: '#999', fontSize: '0.8rem', marginLeft: 6 };
const delBtn: React.CSSProperties = { border: 'none', background: 'none', color: '#bbb', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' };
const btnSmall: React.CSSProperties = { border: '1px solid #ccc', background: 'transparent', padding: '5px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' };
```

- [ ] **Step 6: Write PersonaPage**

Create `frontend/src/pages/PersonaPage.tsx`:
```tsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { personasApi, relacionesApi, documentosApi } from '../api/client';
import type { Persona, Relacion, Documento } from '../types';
import PersonaForm from '../components/PersonaForm/PersonaForm';
import RelacionForm from '../components/RelacionForm/RelacionForm';
import DocumentoSection from '../components/DocumentoSection/DocumentoSection';

export default function PersonaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numId = Number(id);

  const [persona, setPersona] = useState<Persona | null>(null);
  const [relaciones, setRelaciones] = useState<Relacion[]>([]);
  const [docsPrincipales, setDocsPrincipales] = useState<Documento[]>([]);
  const [docsMencionada, setDocsMencionada] = useState<Documento[]>([]);
  const [editing, setEditing] = useState(false);
  const [addingRelacion, setAddingRelacion] = useState(false);

  const loadRelaciones = useCallback(() =>
    relacionesApi.dePersona(numId).then(setRelaciones), [numId]);
  const loadDocumentos = useCallback(async () => {
    const { principales, mencionada } = await documentosApi.dePersona(numId);
    setDocsPrincipales(principales);
    setDocsMencionada(mencionada);
  }, [numId]);

  useEffect(() => {
    personasApi.get(numId).then(setPersona).catch(() => navigate('/'));
    loadRelaciones();
    loadDocumentos();
  }, [numId, navigate, loadRelaciones, loadDocumentos]);

  async function handleSave(data: Partial<Persona>) {
    const updated = await personasApi.update(numId, data);
    setPersona(updated);
    setEditing(false);
  }

  async function handleDeleteRelacion(relId: number) {
    await relacionesApi.delete(relId);
    loadRelaciones();
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar a ${persona?.apellido}, ${persona?.nombre}? Esta acción no se puede deshacer.`)) return;
    await personasApi.delete(numId);
    navigate('/');
  }

  if (!persona) return <div style={{ padding: 32, color: '#666' }}>Cargando...</div>;

  const nacimiento = formatFecha(persona.nac_dia, persona.nac_mes, persona.nac_anio, persona.nac_tipo);
  const defuncion = formatFecha(persona.def_dia, persona.def_mes, persona.def_anio, persona.def_tipo);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
      <nav style={{ marginBottom: 24, color: '#666', fontSize: '0.9rem' }}>
        <Link to="/" style={{ color: '#0070f3' }}>← Índice</Link>
      </nav>

      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <code style={{ color: '#888', fontSize: '0.85rem' }}>{persona.pid}</code>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginTop: 2 }}>
              {persona.apellido}, {persona.nombre}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditing(true)} style={btnSecondary}>Editar</button>
            <button onClick={handleDelete} style={btnDanger}>Eliminar</button>
          </div>
        </div>
      </header>

      {editing ? (
        <section style={card}>
          <h2 style={sectionTitle}>Editar datos</h2>
          <PersonaForm initial={persona} onSave={handleSave} onCancel={() => setEditing(false)} />
        </section>
      ) : (
        <>
          <section style={card}>
            <h2 style={sectionTitle}>Datos Personales</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Nombre', persona.nombre],
                  ['Apellido', persona.apellido],
                  ['Sexo', { M: 'Masculino', F: 'Femenino', otro: 'Otro' }[persona.sexo]],
                  ['Nacimiento', nacimiento],
                  ['Lugar nacimiento', persona.nac_lugar
                    ? [persona.nac_lugar.ciudad, persona.nac_lugar.provincia, persona.nac_lugar.pais].filter(Boolean).join(', ')
                    : '—'],
                  ['Defunción', defuncion],
                ].map(([label, val]) => (
                  <tr key={label as string}>
                    <td style={labelCell}>{label}</td>
                    <td style={valueCell}>{val || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={card}>
            <h2 style={sectionTitle}>Historia Personal</h2>
            {persona.historia
              ? <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{persona.historia}</p>
              : <p style={{ color: '#999' }}>Sin historia registrada.</p>
            }
          </section>
        </>
      )}

      <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ ...sectionTitle, marginBottom: 0 }}>Relaciones</h2>
          <button onClick={() => setAddingRelacion(true)} style={btnSmall}>+ Agregar</button>
        </div>

        {addingRelacion && (
          <div style={{ marginBottom: 16, padding: 16, background: '#f9f9f9', borderRadius: 6 }}>
            <RelacionForm
              personaId={numId}
              onSaved={() => { setAddingRelacion(false); loadRelaciones(); }}
              onCancel={() => setAddingRelacion(false)}
            />
          </div>
        )}

        {relaciones.length === 0 && !addingRelacion
          ? <p style={{ color: '#999' }}>Sin relaciones registradas.</p>
          : (
            <ul style={{ padding: 0, listStyle: 'none' }}>
              {relaciones.map(r => (
                <li key={r.id} style={relItem}>
                  <div>
                    <span style={relTag}>{r.tipo_relacion_nombre}</span>
                    <Link to={`/persona/${r.persona_destino_id}`} style={{ color: '#0070f3' }}>
                      {r.persona_destino_nombre}
                    </Link>
                    <span style={{ color: '#999', marginLeft: 6, fontSize: '0.82rem' }}>
                      ({r.persona_destino_pid})
                    </span>
                  </div>
                  <button onClick={() => handleDeleteRelacion(r.id)} style={delBtn}>×</button>
                </li>
              ))}
            </ul>
          )
        }
      </section>

      <section style={card}>
        <DocumentoSection
          personaId={numId}
          principales={docsPrincipales}
          mencionada={docsMencionada}
          onUpdate={loadDocumentos}
        />
      </section>
    </div>
  );
}

function formatFecha(dia: number | null, mes: number | null, anio: number | null, tipo: string): string {
  if (tipo === 'desconocida') return '—';
  if (tipo === 'aproximada' && anio) return `aprox. ${anio}`;
  if (tipo === 'solo_anio' && anio) return String(anio);
  if (dia && mes && anio) {
    return `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${anio}`;
  }
  if (anio) return String(anio);
  return '—';
}

const card: React.CSSProperties = {
  background: '#fff', borderRadius: 8, padding: 20, marginBottom: 16,
  border: '1px solid #e8e8e8',
};
const sectionTitle: React.CSSProperties = {
  fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: '#888', marginBottom: 12,
};
const labelCell: React.CSSProperties = {
  padding: '6px 0', width: 160, color: '#666', fontSize: '0.9rem', verticalAlign: 'top',
};
const valueCell: React.CSSProperties = { padding: '6px 0', fontWeight: 500 };
const relItem: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '8px 0', borderBottom: '1px solid #f2f2f2',
};
const relTag: React.CSSProperties = {
  background: '#f0f0f0', padding: '2px 8px', borderRadius: 3,
  fontSize: '0.78rem', marginRight: 10, color: '#555',
};
const delBtn: React.CSSProperties = {
  border: 'none', background: 'none', color: '#bbb', cursor: 'pointer', fontSize: '1rem',
};
const btnSecondary: React.CSSProperties = {
  border: '1px solid #ccc', background: 'transparent', padding: '7px 14px',
  borderRadius: 4, cursor: 'pointer',
};
const btnDanger: React.CSSProperties = {
  border: '1px solid #fcc', background: '#fff5f5', color: '#c00',
  padding: '7px 14px', borderRadius: 4, cursor: 'pointer',
};
const btnSmall: React.CSSProperties = {
  border: '1px solid #ccc', background: 'transparent', padding: '5px 12px',
  borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem',
};
```

- [ ] **Step 4: Test in browser**

Navigate `http://localhost:5173`, create a few personas, open one, verify:
- All fields display correctly
- "Editar" opens the form inline
- "Agregar relación" opens the search dropdown
- Typing ≥2 chars shows matching persons
- Selecting and saving creates the relation in both directions
- Uploading a document appears under "Documentos principales"
- The same document appears under "Mencionado en" on other personas' fichas
- Clicking a related person navigates to their ficha
- D00001 format IDs appear next to each document

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/PersonaPage.tsx \
        frontend/src/components/PersonaSearchInput/ \
        frontend/src/components/RelacionForm/ \
        frontend/src/components/DocumentoSection/ \
        frontend/src/components/DocumentoForm/
git commit -m "feat: persona ficha with shared PersonaSearchInput, document entities D00001, principal/mencionada"
```

---

## Task 13: LugarInput — Autocomplete de Lugares

**Files:**
- Create: `frontend/src/components/LugarInput/LugarInput.tsx`
- Modify: `frontend/src/components/PersonaForm/PersonaForm.tsx`

- [ ] **Step 1: Write LugarInput**

Create `frontend/src/components/LugarInput/LugarInput.tsx`:
```tsx
import { useState, useEffect, useRef } from 'react';
import { lugaresApi } from '../../api/client';
import type { Lugar } from '../../types';

interface Props {
  value: Lugar | null;
  onChange: (lugar: Lugar | null) => void;
  placeholder?: string;
}

export default function LugarInput({ value, onChange, placeholder = 'Ciudad, provincia, país...' }: Props) {
  const [text, setText] = useState('');
  const [results, setResults] = useState<Lugar[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newCiudad, setNewCiudad] = useState('');
  const [newProvincia, setNewProvincia] = useState('');
  const [newPais, setNewPais] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(value ? formatLugar(value) : '');
  }, [value]);

  useEffect(() => {
    if (text.length < 2 || value) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setResults(await lugaresApi.search(text));
    }, 250);
  }, [text, value]);

  async function handleCreateLugar() {
    const l = await lugaresApi.create({
      ciudad: newCiudad,
      provincia: newProvincia || undefined,
      pais: newPais,
    });
    onChange(l);
    setShowNew(false);
    setResults([]);
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={value ? formatLugar(value) : text}
        onChange={e => { onChange(null); setText(e.target.value); }}
        placeholder={placeholder}
        style={inp}
      />
      {value && (
        <button
          onClick={() => { onChange(null); setText(''); }}
          style={{ position: 'absolute', right: 6, top: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#999' }}>
          ×
        </button>
      )}
      {results.length > 0 && !value && (
        <div style={dropdown}>
          {results.map(l => (
            <div key={l.id} style={item} onClick={() => { onChange(l); setResults([]); }}>
              {formatLugar(l)}
            </div>
          ))}
          <div style={{ ...item, color: '#0070f3' }} onClick={() => { setNewCiudad(text); setShowNew(true); setResults([]); }}>
            + Agregar lugar nuevo
          </div>
        </div>
      )}
      {!value && text.length >= 2 && results.length === 0 && (
        <div style={dropdown}>
          <div style={{ ...item, color: '#0070f3' }} onClick={() => { setNewCiudad(text); setShowNew(true); }}>
            + Agregar lugar nuevo "{text}"
          </div>
        </div>
      )}
      {showNew && (
        <div style={{ marginTop: 8, padding: 12, background: '#f9f9f9', borderRadius: 6, border: '1px solid #ddd' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input placeholder="Ciudad *" value={newCiudad} onChange={e => setNewCiudad(e.target.value)} style={inp} />
            <input placeholder="Provincia" value={newProvincia} onChange={e => setNewProvincia(e.target.value)} style={inp} />
            <input placeholder="País *" value={newPais} onChange={e => setNewPais(e.target.value)} style={inp} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleCreateLugar} disabled={!newCiudad || !newPais}
                style={{ ...btnPrimary, fontSize: '0.85rem', padding: '5px 12px' }}>
                Guardar lugar
              </button>
              <button onClick={() => setShowNew(false)} style={{ border: '1px solid #ccc', background: 'none', borderRadius: 4, padding: '5px 10px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatLugar(l: Lugar) {
  return [l.ciudad, l.provincia, l.pais].filter(Boolean).join(', ');
}

const inp: React.CSSProperties = { padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem', width: '100%' };
const dropdown: React.CSSProperties = {
  position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
  border: '1px solid #ccc', borderRadius: 4, zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};
const item: React.CSSProperties = { padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '0.9rem' };
const btnPrimary: React.CSSProperties = {
  background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600,
};
```

- [ ] **Step 2: Integrate LugarInput into PersonaForm**

In `frontend/src/components/PersonaForm/PersonaForm.tsx`, add lugar fields for non-compact mode.

Add import at the top:
```tsx
import LugarInput from '../LugarInput/LugarInput';
import type { Lugar } from '../../types';
```

Add state:
```tsx
const [nacLugar, setNacLugar] = useState<Lugar | null>(initial.nac_lugar ?? null);
const [defLugar, setDefLugar] = useState<Lugar | null>(initial.def_lugar ?? null);
```

Update `handleSubmit` to include:
```tsx
onSave({
  ...existingFields,
  nac_lugar_id: nacLugar?.id ?? null,
  def_lugar_id: defLugar?.id ?? null,
});
```

Add below fecha fields (non-compact block):
```tsx
<div style={rowStyle}>
  <label>Lugar de nacimiento</label>
  <LugarInput value={nacLugar} onChange={setNacLugar} />
</div>
<div style={rowStyle}>
  <label>Lugar de defunción</label>
  <LugarInput value={defLugar} onChange={setDefLugar} placeholder="Ciudad, provincia, país..." />
</div>
```

- [ ] **Step 3: Test in browser**

Edit a persona → type "Buenos" in lugar → should suggest "Buenos Aires, ..." if already created, or offer to create new.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/LugarInput/ frontend/src/components/PersonaForm/PersonaForm.tsx
git commit -m "feat: place autocomplete with create-on-demand in persona form"
```

---

## Task 14: Historia Editor in PersonaPage

**Files:**
- Modify: `frontend/src/pages/PersonaPage.tsx`

The historia field in the non-editing view already shows the text. This task adds inline editing for historia without going into full edit mode.

- [ ] **Step 1: Add inline historia editing**

In `PersonaPage.tsx`, replace the historia section with:

```tsx
const [editingHistoria, setEditingHistoria] = useState(false);
const [historiaText, setHistoriaText] = useState(persona?.historia ?? '');

// When persona loads
useEffect(() => { setHistoriaText(persona?.historia ?? ''); }, [persona]);

async function handleSaveHistoria() {
  const updated = await personasApi.update(numId, { historia: historiaText });
  setPersona(updated);
  setEditingHistoria(false);
}
```

Replace the historia card body:
```tsx
<section style={card}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
    <h2 style={{ ...sectionTitle, marginBottom: 0 }}>Historia Personal</h2>
    {!editingHistoria && (
      <button onClick={() => setEditingHistoria(true)} style={btnSmall}>Editar</button>
    )}
  </div>
  {editingHistoria ? (
    <div>
      <textarea
        value={historiaText}
        onChange={e => setHistoriaText(e.target.value)}
        rows={10}
        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.95rem', resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={handleSaveHistoria} style={btnPrimary}>Guardar</button>
        <button onClick={() => { setEditingHistoria(false); setHistoriaText(persona.historia); }} style={btnSecondary}>Cancelar</button>
      </div>
    </div>
  ) : (
    persona.historia
      ? <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{persona.historia}</p>
      : <p style={{ color: '#999' }}>Sin historia registrada. <button onClick={() => setEditingHistoria(true)} style={{ border: 'none', background: 'none', color: '#0070f3', cursor: 'pointer' }}>Agregar</button></p>
  )}
</section>
```

Add missing style variable:
```tsx
const btnPrimary: React.CSSProperties = {
  background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 16px',
  borderRadius: 4, cursor: 'pointer', fontWeight: 600,
};
```

- [ ] **Step 2: Test in browser**

Open a persona → click "Editar" next to Historia → write text → Guardar → text persists on reload.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/PersonaPage.tsx
git commit -m "feat: inline historia editor in persona page"
```

---

## Task 15: Final Integration Verification

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && npm test
```

Expected: all tests PASS

- [ ] **Step 2: Full user flow walkthrough in browser**

With both servers running, verify this flow:

1. Open `http://localhost:5173` → empty index
2. Create P00001: Moreno Bauer, Tomás Agustín, M, 2004
3. Create P00002: Moreno, Mariano Javier, M, 1978
4. Create P00003: Bauer, Lorena Mabel, F, 1976
5. Open P00001 → Add relación: Padre → buscar "Maria" → select Mariano
6. Verify P00001 shows "Padre: Moreno, Mariano" with link
7. Open P00002 → verify it shows "Hijo: Moreno Bauer, Tomás" (inverse)
8. On P00001 → click "+ Agregar" under Documentos → fill:
   - Título: "Partida de nacimiento de Tomás Moreno Bauer"
   - Tipo: Partida de nacimiento
   - Personas principales: (already P00001 by default)
   - Personas mencionadas: buscar Mariano → agregar, buscar Lorena → agregar
   - Guardar → document appears with ID D00001
9. Open P00002 → verify "Mencionado en" shows D00001
10. Open P00003 → verify "Mencionado en" shows D00001
11. Check `Archivo_Genealogico/Personas/P00001_.../persona.md` has "Documentos Principales" and "Mencionado En" sections
12. Check `Archivo_Genealogico/Personas/P00002_.../persona.md` has correct "Mencionado En"

- [ ] **Step 3: Verify file system output**

```bash
cat "Archivo_Genealogico/Personas/P00001_Moreno_Bauer_Tomas_Agustin/persona.md"
```

Expected: Markdown file with all data sections populated.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete MVP — Archivo Genealógico Familiar v1.0"
```

---

## Spec Coverage Check

| Requirement | Covered |
|---|---|
| Índice de personas con ID-Apellido-Año | Task 11 |
| ID permanente P00001 format | Tasks 4, 10 |
| Ficha completa por persona | Task 12 |
| Editor de historia | Task 14 |
| Documentos como entidad propia con D00001 | Tasks 2, 8 |
| Título, tipo, fecha, descripción por documento | Tasks 2, 8 |
| Persona principal en documento | Tasks 2, 8, 12 |
| Personas mencionadas en documento | Tasks 2, 8, 12 |
| "Documentos principales" en ficha | Tasks 5, 12 |
| "Mencionado en" en ficha | Tasks 5, 12 |
| Archivo físico en carpeta de persona principal | Tasks 5, 8, 9 |
| Nombre de archivo D00001_Titulo.ext | Task 5 |
| Buscador de personas al asignar principal/mencionada | Task 12 (PersonaSearchInput) |
| Crear persona desde formulario de documento | Task 12 (PersonaSearchInput) |
| PersonaSearchInput reutilizable (relaciones + docs) | Task 12 |
| Relaciones bidireccionales automáticas | Tasks 6, 12 |
| Buscador interno al crear relaciones | Task 12 |
| Crear persona desde relación (compact form) | Task 12 |
| Soporte múltiples padres/madres | Task 2 (schema sin UNIQUE en tipo+persona) |
| Relaciones personalizadas | Task 2 (tipo_relacion table) |
| Carpeta física por persona | Task 5 |
| persona.md con Documentos Principales y Mencionado En | Tasks 5, 9 |
| Normalización de fechas (exacta/solo_año/aprox/desconocida) | Tasks 2, 3, 11 |
| Normalización de lugares como entidad | Tasks 7, 13 |
| Autocomplete de lugares | Task 13 |
| Búsqueda y filtrado en índice | Task 11 |
| Navegación entre personas via links | Tasks 11, 12 |
| SQLite local | Task 2 |

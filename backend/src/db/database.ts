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
    try { db.exec('ALTER TABLE personas ADD COLUMN fallecida INTEGER NOT NULL DEFAULT 0'); } catch {}
    try { db.exec('ALTER TABLE personas ADD COLUMN dni TEXT'); } catch {}
    runMigrations(db);
  }
  return db;
}

function runMigrations(db: Database.Database): void {
  // Crea relaciones de hermanos entre hijos que comparten un padre
  const padres = db.prepare(`
    SELECT DISTINCT persona_origen_id as parentId FROM relaciones WHERE tipo_relacion_id IN (3, 4)
  `).all() as { parentId: number }[];
  const insertHermano = db.prepare(`
    INSERT OR IGNORE INTO relaciones (persona_origen_id, tipo_relacion_id, persona_destino_id) VALUES (?, ?, ?)
  `);
  for (const { parentId } of padres) {
    const hijos = db.prepare(`
      SELECT persona_destino_id as id, p.sexo FROM relaciones r
      JOIN personas p ON r.persona_destino_id = p.id
      WHERE r.persona_origen_id = ? AND r.tipo_relacion_id IN (3, 4)
    `).all(parentId) as { id: number; sexo: string }[];
    for (let i = 0; i < hijos.length; i++) {
      for (let j = i + 1; j < hijos.length; j++) {
        const a = hijos[i], b = hijos[j];
        insertHermano.run(a.id, b.sexo === 'F' ? 11 : 10, b.id);
        insertHermano.run(b.id, a.sexo === 'F' ? 11 : 10, a.id);
      }
    }
  }

  // Corrige relaciones con género incorrecto según el sexo de persona_destino
  const grupos: [number, number][] = [
    [1, 2], [3, 4], [6, 7], [8, 9], [10, 11], [13, 14], [15, 16],
  ];
  for (const [M, F] of grupos) {
    db.prepare(`UPDATE relaciones SET tipo_relacion_id = ?
      WHERE tipo_relacion_id IN (?, ?)
      AND persona_destino_id IN (SELECT id FROM personas WHERE sexo = 'F')`).run(F, M, F);
    db.prepare(`UPDATE relaciones SET tipo_relacion_id = ?
      WHERE tipo_relacion_id IN (?, ?)
      AND persona_destino_id IN (SELECT id FROM personas WHERE sexo != 'F')`).run(M, M, F);
  }
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = undefined;
  }
}

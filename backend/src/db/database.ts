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

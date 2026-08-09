"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.closeDb = closeDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const SCHEMA_PATH = path_1.default.join(__dirname, 'schema.sql');
let db;
function getDbPath() {
    const root = process.env.ARCHIVO_ROOT;
    if (!root) {
        return path_1.default.join(__dirname, '../../genealogico.db');
    }
    return path_1.default.join(root, 'BaseDeDatos', 'genealogico.db');
}
function getDb() {
    if (!db) {
        const dbPath = getDbPath();
        fs_1.default.mkdirSync(path_1.default.dirname(dbPath), { recursive: true });
        db = new better_sqlite3_1.default(dbPath);
        const schema = fs_1.default.readFileSync(SCHEMA_PATH, 'utf-8');
        db.exec(schema);
        try {
            db.exec('ALTER TABLE personas ADD COLUMN fallecida INTEGER NOT NULL DEFAULT 0');
        }
        catch { }
        runMigrations(db);
    }
    return db;
}
function runMigrations(db) {
    // Crea relaciones de hermanos entre hijos que comparten un padre
    const padres = db.prepare(`
    SELECT DISTINCT persona_origen_id as parentId FROM relaciones WHERE tipo_relacion_id IN (3, 4)
  `).all();
    const insertHermano = db.prepare(`
    INSERT OR IGNORE INTO relaciones (persona_origen_id, tipo_relacion_id, persona_destino_id) VALUES (?, ?, ?)
  `);
    for (const { parentId } of padres) {
        const hijos = db.prepare(`
      SELECT persona_destino_id as id, p.sexo FROM relaciones r
      JOIN personas p ON r.persona_destino_id = p.id
      WHERE r.persona_origen_id = ? AND r.tipo_relacion_id IN (3, 4)
    `).all(parentId);
        for (let i = 0; i < hijos.length; i++) {
            for (let j = i + 1; j < hijos.length; j++) {
                const a = hijos[i], b = hijos[j];
                insertHermano.run(a.id, b.sexo === 'F' ? 11 : 10, b.id);
                insertHermano.run(b.id, a.sexo === 'F' ? 11 : 10, a.id);
            }
        }
    }
    // Corrige relaciones con género incorrecto según el sexo de persona_destino
    const grupos = [
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
function closeDb() {
    if (db) {
        db.close();
        db = undefined;
    }
}

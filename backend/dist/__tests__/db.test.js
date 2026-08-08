"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../db/database', () => {
    const Database = require('better-sqlite3');
    const fs = require('fs');
    const path = require('path');
    let db;
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
const database_1 = require("../db/database");
describe('database', () => {
    it('initializes without error', () => {
        expect((0, database_1.getDb)()).toBeDefined();
    });
    it('has all required tables', () => {
        const db = (0, database_1.getDb)();
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((r) => r.name);
        expect(tables).toContain('personas');
        expect(tables).toContain('relaciones');
        expect(tables).toContain('documentos');
        expect(tables).toContain('documento_personas');
        expect(tables).toContain('lugares');
        expect(tables).toContain('tipo_relacion');
    });
    it('has tipo_relacion seeded with 18 rows', () => {
        const db = (0, database_1.getDb)();
        const { c } = db.prepare('SELECT COUNT(*) as c FROM tipo_relacion').get();
        expect(c).toBe(18);
    });
    it('Padre has inverse Hijo (id=3)', () => {
        const db = (0, database_1.getDb)();
        const row = db.prepare('SELECT inverso_id FROM tipo_relacion WHERE id=1').get();
        expect(row.inverso_id).toBe(3);
    });
    it('Cónyuge inverse is itself (id=5)', () => {
        const db = (0, database_1.getDb)();
        const row = db.prepare('SELECT inverso_id FROM tipo_relacion WHERE id=5').get();
        expect(row.inverso_id).toBe(5);
    });
});

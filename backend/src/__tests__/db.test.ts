jest.mock('../db/database', () => {
  const Database = require('better-sqlite3');
  const fs = require('fs');
  const path = require('path');
  let db: any;
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

import { getDb } from '../db/database';

describe('database', () => {
  it('initializes without error', () => {
    expect(getDb()).toBeDefined();
  });

  it('has all required tables', () => {
    const db = getDb();
    const tables = (db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as any[]).map((r: any) => r.name);
    expect(tables).toContain('personas');
    expect(tables).toContain('relaciones');
    expect(tables).toContain('documentos');
    expect(tables).toContain('documento_personas');
    expect(tables).toContain('lugares');
    expect(tables).toContain('tipo_relacion');
  });

  it('has tipo_relacion seeded with 18 rows', () => {
    const db = getDb();
    const { c } = db.prepare('SELECT COUNT(*) as c FROM tipo_relacion').get() as any;
    expect(c).toBe(18);
  });

  it('Padre has inverse Hijo (id=3)', () => {
    const db = getDb();
    const row = db.prepare('SELECT inverso_id FROM tipo_relacion WHERE id=1').get() as any;
    expect(row.inverso_id).toBe(3);
  });

  it('Cónyuge inverse is itself (id=5)', () => {
    const db = getDb();
    const row = db.prepare('SELECT inverso_id FROM tipo_relacion WHERE id=5').get() as any;
    expect(row.inverso_id).toBe(5);
  });
});

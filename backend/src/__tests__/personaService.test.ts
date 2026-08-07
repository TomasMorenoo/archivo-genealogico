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

import { formatPid, createPersona, listPersonas, updatePersona, deletePersona, getPersona } from '../services/personaService';

describe('formatPid', () => {
  it('pads to 5 digits', () => {
    expect(formatPid(1)).toBe('P00001');
    expect(formatPid(200)).toBe('P00200');
  });
});

describe('personaService CRUD', () => {
  it('createPersona returns persona with pid', () => {
    const p = createPersona({ nombre: 'Juan', apellido: 'García', sexo: 'M' });
    expect(p.pid).toMatch(/^P\d{5}$/);
    expect(p.nombre).toBe('Juan');
    expect(p.apellido).toBe('García');
  });

  it('listPersonas returns created persona', () => {
    const list = listPersonas();
    expect(list.some(p => p.apellido === 'García')).toBe(true);
  });

  it('listPersonas filters by apellido', () => {
    createPersona({ nombre: 'Maria', apellido: 'Lopez', sexo: 'F' });
    const list = listPersonas('García');
    expect(list.every(p => p.apellido === 'García')).toBe(true);
    expect(list.some(p => p.apellido === 'Lopez')).toBe(false);
  });

  it('updatePersona changes historia without changing id', () => {
    const p = createPersona({ nombre: 'Carlos', apellido: 'Ruiz', sexo: 'M' });
    const updated = updatePersona(p.id, { historia: 'Nueva historia' });
    expect(updated!.id).toBe(p.id);
    expect(updated!.historia).toBe('Nueva historia');
  });

  it('deletePersona removes persona', () => {
    const p = createPersona({ nombre: 'Temp', apellido: 'Borrar', sexo: 'M' });
    deletePersona(p.id);
    expect(getPersona(p.id)).toBeNull();
  });
});

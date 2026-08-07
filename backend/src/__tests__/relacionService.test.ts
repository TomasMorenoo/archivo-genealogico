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
import { addRelacion, deleteRelacion, getRelacionesDePersona, listTiposRelacion } from '../services/relacionService';

let padreId: number;
let hijoId: number;

beforeAll(() => {
  const padre = createPersona({ nombre: 'Pedro', apellido: 'Gomez', sexo: 'M' });
  const hijo = createPersona({ nombre: 'Luis', apellido: 'Gomez', sexo: 'M' });
  padreId = padre.id;
  hijoId = hijo.id;
});

describe('relacionService', () => {
  it('Padre relation creates inverse Hijo automatically', () => {
    const tipos = listTiposRelacion();
    const tiposPadre = tipos.find(t => t.nombre === 'Padre');
    expect(tiposPadre).toBeDefined();

    addRelacion(padreId, tiposPadre!.id, hijoId);

    const relacionesPadre = getRelacionesDePersona(padreId);
    expect(relacionesPadre.some(r => r.tipo_relacion_nombre === 'Padre' && r.persona_destino_id === hijoId)).toBe(true);

    const relacionesHijo = getRelacionesDePersona(hijoId);
    expect(relacionesHijo.some(r => r.tipo_relacion_nombre === 'Hijo' && r.persona_destino_id === padreId)).toBe(true);
  });

  it('deleteRelacion removes both directions', () => {
    const relacionesPadre = getRelacionesDePersona(padreId);
    const rel = relacionesPadre.find(r => r.tipo_relacion_nombre === 'Padre');
    expect(rel).toBeDefined();

    deleteRelacion(rel!.id);

    expect(getRelacionesDePersona(padreId).some(r => r.tipo_relacion_nombre === 'Padre')).toBe(false);
    expect(getRelacionesDePersona(hijoId).some(r => r.tipo_relacion_nombre === 'Hijo')).toBe(false);
  });

  it('Conyuge relation is its own inverse', () => {
    const tipos = listTiposRelacion();
    const tipoConyuge = tipos.find(t => t.nombre === 'Cónyuge');
    expect(tipoConyuge).toBeDefined();
    expect(tipoConyuge!.inverso_id).toBe(tipoConyuge!.id);

    const p1 = createPersona({ nombre: 'Ana', apellido: 'Rios', sexo: 'F' });
    const p2 = createPersona({ nombre: 'Jose', apellido: 'Rios', sexo: 'M' });

    addRelacion(p1.id, tipoConyuge!.id, p2.id);

    expect(getRelacionesDePersona(p1.id).some(r => r.tipo_relacion_nombre === 'Cónyuge' && r.persona_destino_id === p2.id)).toBe(true);
    expect(getRelacionesDePersona(p2.id).some(r => r.tipo_relacion_nombre === 'Cónyuge' && r.persona_destino_id === p1.id)).toBe(true);
  });
});

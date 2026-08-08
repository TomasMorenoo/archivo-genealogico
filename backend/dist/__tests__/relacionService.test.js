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
const personaService_1 = require("../services/personaService");
const relacionService_1 = require("../services/relacionService");
let padreId;
let hijoId;
beforeAll(() => {
    const padre = (0, personaService_1.createPersona)({ nombre: 'Pedro', apellido: 'Gomez', sexo: 'M' });
    const hijo = (0, personaService_1.createPersona)({ nombre: 'Luis', apellido: 'Gomez', sexo: 'M' });
    padreId = padre.id;
    hijoId = hijo.id;
});
describe('relacionService', () => {
    it('Padre relation creates inverse Hijo automatically', () => {
        const tipos = (0, relacionService_1.listTiposRelacion)();
        const tiposPadre = tipos.find(t => t.nombre === 'Padre');
        expect(tiposPadre).toBeDefined();
        (0, relacionService_1.addRelacion)(padreId, tiposPadre.id, hijoId);
        const relacionesPadre = (0, relacionService_1.getRelacionesDePersona)(padreId);
        expect(relacionesPadre.some(r => r.tipo_relacion_nombre === 'Padre' && r.persona_destino_id === hijoId)).toBe(true);
        const relacionesHijo = (0, relacionService_1.getRelacionesDePersona)(hijoId);
        expect(relacionesHijo.some(r => r.tipo_relacion_nombre === 'Hijo' && r.persona_destino_id === padreId)).toBe(true);
    });
    it('deleteRelacion removes both directions', () => {
        const relacionesPadre = (0, relacionService_1.getRelacionesDePersona)(padreId);
        const rel = relacionesPadre.find(r => r.tipo_relacion_nombre === 'Padre');
        expect(rel).toBeDefined();
        (0, relacionService_1.deleteRelacion)(rel.id);
        expect((0, relacionService_1.getRelacionesDePersona)(padreId).some(r => r.tipo_relacion_nombre === 'Padre')).toBe(false);
        expect((0, relacionService_1.getRelacionesDePersona)(hijoId).some(r => r.tipo_relacion_nombre === 'Hijo')).toBe(false);
    });
    it('Conyuge relation is its own inverse', () => {
        const tipos = (0, relacionService_1.listTiposRelacion)();
        const tipoConyuge = tipos.find(t => t.nombre === 'Cónyuge');
        expect(tipoConyuge).toBeDefined();
        expect(tipoConyuge.inverso_id).toBe(tipoConyuge.id);
        const p1 = (0, personaService_1.createPersona)({ nombre: 'Ana', apellido: 'Rios', sexo: 'F' });
        const p2 = (0, personaService_1.createPersona)({ nombre: 'Jose', apellido: 'Rios', sexo: 'M' });
        (0, relacionService_1.addRelacion)(p1.id, tipoConyuge.id, p2.id);
        expect((0, relacionService_1.getRelacionesDePersona)(p1.id).some(r => r.tipo_relacion_nombre === 'Cónyuge' && r.persona_destino_id === p2.id)).toBe(true);
        expect((0, relacionService_1.getRelacionesDePersona)(p2.id).some(r => r.tipo_relacion_nombre === 'Cónyuge' && r.persona_destino_id === p1.id)).toBe(true);
    });
});

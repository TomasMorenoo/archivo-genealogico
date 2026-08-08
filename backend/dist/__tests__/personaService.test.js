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
describe('formatPid', () => {
    it('pads to 5 digits', () => {
        expect((0, personaService_1.formatPid)(1)).toBe('P00001');
        expect((0, personaService_1.formatPid)(200)).toBe('P00200');
    });
});
describe('personaService CRUD', () => {
    it('createPersona returns persona with pid', () => {
        const p = (0, personaService_1.createPersona)({ nombre: 'Juan', apellido: 'García', sexo: 'M' });
        expect(p.pid).toMatch(/^P\d{5}$/);
        expect(p.nombre).toBe('Juan');
        expect(p.apellido).toBe('García');
    });
    it('listPersonas returns created persona', () => {
        const list = (0, personaService_1.listPersonas)();
        expect(list.some(p => p.apellido === 'García')).toBe(true);
    });
    it('listPersonas filters by apellido', () => {
        (0, personaService_1.createPersona)({ nombre: 'Maria', apellido: 'Lopez', sexo: 'F' });
        const list = (0, personaService_1.listPersonas)('García');
        expect(list.every(p => p.apellido === 'García')).toBe(true);
        expect(list.some(p => p.apellido === 'Lopez')).toBe(false);
    });
    it('updatePersona changes historia without changing id', () => {
        const p = (0, personaService_1.createPersona)({ nombre: 'Carlos', apellido: 'Ruiz', sexo: 'M' });
        const updated = (0, personaService_1.updatePersona)(p.id, { historia: 'Nueva historia' });
        expect(updated.id).toBe(p.id);
        expect(updated.historia).toBe('Nueva historia');
    });
    it('deletePersona removes persona', () => {
        const p = (0, personaService_1.createPersona)({ nombre: 'Temp', apellido: 'Borrar', sexo: 'M' });
        (0, personaService_1.deletePersona)(p.id);
        expect((0, personaService_1.getPersona)(p.id)).toBeNull();
    });
});

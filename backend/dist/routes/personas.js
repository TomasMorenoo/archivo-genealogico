"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personasRouter = void 0;
const express_1 = require("express");
const personaService_1 = require("../services/personaService");
const relacionService_1 = require("../services/relacionService");
const documentoService_1 = require("../services/documentoService");
const fileSystemService_1 = require("../services/fileSystemService");
exports.personasRouter = (0, express_1.Router)();
function regenerateMd(personaId) {
    const p = (0, personaService_1.getPersona)(personaId);
    if (!p)
        return;
    (0, fileSystemService_1.writePersonaMd)(p, (0, relacionService_1.getRelacionesDePersona)(personaId), (0, documentoService_1.getDocumentosPrincipalesDePersona)(personaId), (0, documentoService_1.getDocumentosMencionadaDePersona)(personaId));
}
exports.personasRouter.get('/', (req, res) => {
    const search = typeof req.query.q === 'string' ? req.query.q : undefined;
    res.json((0, personaService_1.listPersonas)(search));
});
exports.personasRouter.get('/:id', (req, res) => {
    const p = (0, personaService_1.getPersona)(Number(req.params.id));
    if (!p)
        return res.status(404).json({ error: 'No encontrada' });
    res.json(p);
});
exports.personasRouter.post('/', (req, res) => {
    try {
        const persona = (0, personaService_1.createPersona)(req.body);
        regenerateMd(persona.id);
        res.status(201).json(persona);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
exports.personasRouter.put('/:id', (req, res) => {
    const updated = (0, personaService_1.updatePersona)(Number(req.params.id), req.body);
    if (!updated)
        return res.status(404).json({ error: 'No encontrada' });
    regenerateMd(updated.id);
    res.json(updated);
});
exports.personasRouter.delete('/:id', (req, res) => {
    (0, personaService_1.deletePersona)(Number(req.params.id));
    res.status(204).end();
});

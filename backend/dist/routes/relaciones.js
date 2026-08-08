"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relacionesRouter = void 0;
const express_1 = require("express");
const relacionService_1 = require("../services/relacionService");
const personaService_1 = require("../services/personaService");
const documentoService_1 = require("../services/documentoService");
const fileSystemService_1 = require("../services/fileSystemService");
exports.relacionesRouter = (0, express_1.Router)();
function regenerateMd(personaId) {
    const p = (0, personaService_1.getPersona)(personaId);
    if (!p)
        return;
    (0, fileSystemService_1.writePersonaMd)(p, (0, relacionService_1.getRelacionesDePersona)(personaId), (0, documentoService_1.getDocumentosPrincipalesDePersona)(personaId), (0, documentoService_1.getDocumentosMencionadaDePersona)(personaId));
}
exports.relacionesRouter.get('/tipos', (_req, res) => {
    res.json((0, relacionService_1.listTiposRelacion)());
});
exports.relacionesRouter.get('/persona/:id', (req, res) => {
    res.json((0, relacionService_1.getRelacionesDePersona)(Number(req.params.id)));
});
exports.relacionesRouter.post('/', (req, res) => {
    const { persona_origen_id, tipo_relacion_id, persona_destino_id } = req.body;
    try {
        (0, relacionService_1.addRelacion)(Number(persona_origen_id), Number(tipo_relacion_id), Number(persona_destino_id));
        for (const id of [persona_origen_id, persona_destino_id])
            regenerateMd(Number(id));
        res.status(201).json({ ok: true });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
exports.relacionesRouter.delete('/:id', (req, res) => {
    (0, relacionService_1.deleteRelacion)(Number(req.params.id));
    res.status(204).end();
});

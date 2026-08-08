"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentosRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const documentoService_1 = require("../services/documentoService");
const personaService_1 = require("../services/personaService");
const relacionService_1 = require("../services/relacionService");
const fileSystemService_1 = require("../services/fileSystemService");
exports.documentosRouter = (0, express_1.Router)();
function regenerateMdForDocPersonas(docId) {
    const doc = (0, documentoService_1.getDocumento)(docId);
    if (!doc)
        return;
    const allPersonaIds = [...new Set(doc.personas.map(p => p.persona_id))];
    for (const pid of allPersonaIds) {
        const p = (0, personaService_1.getPersona)(pid);
        if (!p)
            continue;
        (0, fileSystemService_1.writePersonaMd)(p, (0, relacionService_1.getRelacionesDePersona)(pid), (0, documentoService_1.getDocumentosPrincipalesDePersona)(pid), (0, documentoService_1.getDocumentosMencionadaDePersona)(pid));
    }
}
const storage = multer_1.default.diskStorage({
    destination: (req, _file, cb) => {
        const docId = Number(req.params.docId);
        const doc = (0, documentoService_1.getDocumento)(docId);
        if (!doc)
            return cb(new Error('Documento no encontrado'), '');
        const principal = doc.personas.find(p => p.rol === 'principal');
        if (!principal)
            return cb(new Error('Sin persona principal'), '');
        const persona = (0, personaService_1.getPersona)(principal.persona_id);
        if (!persona)
            return cb(new Error('Persona principal no encontrada'), '');
        (0, fileSystemService_1.ensurePersonaFolder)(persona);
        cb(null, (0, fileSystemService_1.getDocumentosPath)(persona));
    },
    filename: (req, file, cb) => {
        const docId = Number(req.params.docId);
        const ext = path_1.default.extname(file.originalname);
        const doc = (0, documentoService_1.getDocumento)(docId);
        cb(null, doc ? (0, fileSystemService_1.documentoFileName)(docId, doc.titulo, ext) : `${Date.now()}${ext}`);
    },
});
const upload = (0, multer_1.default)({ storage });
exports.documentosRouter.get('/persona/:personaId', (req, res) => {
    const pid = Number(req.params.personaId);
    res.json({
        principales: (0, documentoService_1.getDocumentosPrincipalesDePersona)(pid),
        mencionada: (0, documentoService_1.getDocumentosMencionadaDePersona)(pid),
    });
});
exports.documentosRouter.get('/:id', (req, res) => {
    const doc = (0, documentoService_1.getDocumento)(Number(req.params.id));
    if (!doc)
        return res.status(404).json({ error: 'No encontrado' });
    res.json(doc);
});
exports.documentosRouter.post('/', (req, res) => {
    try {
        const { titulo, tipo, doc_dia, doc_mes, doc_anio, doc_fecha_tipo, descripcion, personasPrincipales, personasMencionadas } = req.body;
        if (!titulo || !tipo)
            return res.status(400).json({ error: 'titulo y tipo son requeridos' });
        if (!personasPrincipales?.length)
            return res.status(400).json({ error: 'Se requiere al menos una persona principal' });
        const doc = (0, documentoService_1.createDocumento)({
            titulo, tipo,
            doc_dia: doc_dia ?? null,
            doc_mes: doc_mes ?? null,
            doc_anio: doc_anio ?? null,
            doc_fecha_tipo: doc_fecha_tipo ?? 'desconocida',
            descripcion: descripcion ?? '',
            personasPrincipales: personasPrincipales.map(Number),
            personasMencionadas: (personasMencionadas ?? []).map(Number),
        });
        regenerateMdForDocPersonas(doc.id);
        res.status(201).json(doc);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
exports.documentosRouter.post('/:docId/archivo', upload.single('archivo'), (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: 'No file uploaded' });
    const docId = Number(req.params.docId);
    (0, documentoService_1.updateDocumentoRuta)(docId, req.file.path, req.file.originalname);
    regenerateMdForDocPersonas(docId);
    res.json((0, documentoService_1.getDocumento)(docId));
});
exports.documentosRouter.put('/:id', (req, res) => {
    const updated = (0, documentoService_1.updateDocumento)(Number(req.params.id), req.body);
    if (!updated)
        return res.status(404).json({ error: 'No encontrado' });
    regenerateMdForDocPersonas(updated.id);
    res.json(updated);
});
exports.documentosRouter.delete('/:id', (req, res) => {
    regenerateMdForDocPersonas(Number(req.params.id));
    (0, documentoService_1.deleteDocumento)(Number(req.params.id));
    res.status(204).end();
});

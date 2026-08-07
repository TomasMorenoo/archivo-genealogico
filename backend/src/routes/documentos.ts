import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  createDocumento, getDocumento, updateDocumento, updateDocumentoRuta,
  deleteDocumento, getDocumentosPrincipalesDePersona, getDocumentosMencionadaDePersona,
} from '../services/documentoService';
import { getPersona } from '../services/personaService';
import { getRelacionesDePersona } from '../services/relacionService';
import {
  writePersonaMd, getDocumentosPath, ensurePersonaFolder, documentoFileName,
} from '../services/fileSystemService';

export const documentosRouter = Router();

function regenerateMdForDocPersonas(docId: number): void {
  const doc = getDocumento(docId);
  if (!doc) return;
  const allPersonaIds = [...new Set(doc.personas.map(p => p.persona_id))];
  for (const pid of allPersonaIds) {
    const p = getPersona(pid);
    if (!p) continue;
    writePersonaMd(
      p,
      getRelacionesDePersona(pid),
      getDocumentosPrincipalesDePersona(pid),
      getDocumentosMencionadaDePersona(pid)
    );
  }
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const docId = Number(req.params.docId);
    const doc = getDocumento(docId);
    if (!doc) return cb(new Error('Documento no encontrado'), '');
    const principal = doc.personas.find(p => p.rol === 'principal');
    if (!principal) return cb(new Error('Sin persona principal'), '');
    const persona = getPersona(principal.persona_id);
    if (!persona) return cb(new Error('Persona principal no encontrada'), '');
    ensurePersonaFolder(persona);
    cb(null, getDocumentosPath(persona));
  },
  filename: (req, file, cb) => {
    const docId = Number(req.params.docId);
    const ext = path.extname(file.originalname);
    const doc = getDocumento(docId);
    cb(null, doc ? documentoFileName(docId, doc.titulo, ext) : `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

documentosRouter.get('/persona/:personaId', (req, res) => {
  const pid = Number(req.params.personaId);
  res.json({
    principales: getDocumentosPrincipalesDePersona(pid),
    mencionada: getDocumentosMencionadaDePersona(pid),
  });
});

documentosRouter.get('/:id', (req, res) => {
  const doc = getDocumento(Number(req.params.id));
  if (!doc) return res.status(404).json({ error: 'No encontrado' });
  res.json(doc);
});

documentosRouter.post('/', (req, res) => {
  try {
    const { titulo, tipo, doc_dia, doc_mes, doc_anio, doc_fecha_tipo,
            descripcion, personasPrincipales, personasMencionadas } = req.body;
    if (!titulo || !tipo) return res.status(400).json({ error: 'titulo y tipo son requeridos' });
    if (!personasPrincipales?.length) return res.status(400).json({ error: 'Se requiere al menos una persona principal' });

    const doc = createDocumento({
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
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

documentosRouter.post('/:docId/archivo', upload.single('archivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const docId = Number(req.params.docId);
  updateDocumentoRuta(docId, req.file.path, req.file.originalname);
  regenerateMdForDocPersonas(docId);
  res.json(getDocumento(docId));
});

documentosRouter.put('/:id', (req, res) => {
  const updated = updateDocumento(Number(req.params.id), req.body);
  if (!updated) return res.status(404).json({ error: 'No encontrado' });
  regenerateMdForDocPersonas(updated.id);
  res.json(updated);
});

documentosRouter.delete('/:id', (req, res) => {
  regenerateMdForDocPersonas(Number(req.params.id));
  deleteDocumento(Number(req.params.id));
  res.status(204).end();
});

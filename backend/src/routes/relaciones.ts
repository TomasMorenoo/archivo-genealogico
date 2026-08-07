import { Router } from 'express';
import {
  addRelacion, deleteRelacion, getRelacionesDePersona, listTiposRelacion
} from '../services/relacionService';
import { getPersona } from '../services/personaService';
import {
  getDocumentosPrincipalesDePersona, getDocumentosMencionadaDePersona
} from '../services/documentoService';
import { writePersonaMd } from '../services/fileSystemService';

export const relacionesRouter = Router();

function regenerateMd(personaId: number): void {
  const p = getPersona(personaId);
  if (!p) return;
  writePersonaMd(
    p,
    getRelacionesDePersona(personaId),
    getDocumentosPrincipalesDePersona(personaId),
    getDocumentosMencionadaDePersona(personaId)
  );
}

relacionesRouter.get('/tipos', (_req, res) => {
  res.json(listTiposRelacion());
});

relacionesRouter.get('/persona/:id', (req, res) => {
  res.json(getRelacionesDePersona(Number(req.params.id)));
});

relacionesRouter.post('/', (req, res) => {
  const { persona_origen_id, tipo_relacion_id, persona_destino_id } = req.body;
  try {
    addRelacion(Number(persona_origen_id), Number(tipo_relacion_id), Number(persona_destino_id));
    for (const id of [persona_origen_id, persona_destino_id]) regenerateMd(Number(id));
    res.status(201).json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

relacionesRouter.delete('/:id', (req, res) => {
  deleteRelacion(Number(req.params.id));
  res.status(204).end();
});

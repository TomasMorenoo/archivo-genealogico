import { Router } from 'express';
import {
  listPersonas, getPersona, createPersona, updatePersona, deletePersona
} from '../services/personaService';
import { getRelacionesDePersona } from '../services/relacionService';
import {
  getDocumentosPrincipalesDePersona, getDocumentosMencionadaDePersona
} from '../services/documentoService';
import { writePersonaMd } from '../services/fileSystemService';

export const personasRouter = Router();

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

personasRouter.get('/', (req, res) => {
  const search = typeof req.query.q === 'string' ? req.query.q : undefined;
  res.json(listPersonas(search));
});

personasRouter.get('/:id', (req, res) => {
  const p = getPersona(Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'No encontrada' });
  res.json(p);
});

personasRouter.post('/', (req, res) => {
  try {
    const persona = createPersona(req.body);
    regenerateMd(persona.id);
    res.status(201).json(persona);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

personasRouter.put('/:id', (req, res) => {
  const updated = updatePersona(Number(req.params.id), req.body);
  if (!updated) return res.status(404).json({ error: 'No encontrada' });
  regenerateMd(updated.id);
  res.json(updated);
});

personasRouter.delete('/:id', (req, res) => {
  deletePersona(Number(req.params.id));
  res.status(204).end();
});

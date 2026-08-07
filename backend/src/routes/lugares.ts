import { Router } from 'express';
import { searchLugares, upsertLugar } from '../services/lugarService';

export const lugaresRouter = Router();

lugaresRouter.get('/search', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  if (q.length < 2) return res.json([]);
  res.json(searchLugares(q));
});

lugaresRouter.post('/', (req, res) => {
  try {
    res.status(201).json(upsertLugar(req.body));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

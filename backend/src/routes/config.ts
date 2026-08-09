import { Router } from 'express';
import { getDb } from '../db/database';

export const configRouter = Router();

configRouter.get('/:clave', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT valor FROM configuracion WHERE clave = ?').get(req.params.clave) as { valor: string } | null;
  res.json(row ? row.valor : null);
});

configRouter.put('/:clave', (req, res) => {
  const db = getDb();
  const { valor } = req.body as { valor: string | null };
  if (valor === null || valor === undefined) {
    db.prepare('DELETE FROM configuracion WHERE clave = ?').run(req.params.clave);
  } else {
    db.prepare('INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?, ?)').run(req.params.clave, String(valor));
  }
  res.json({ ok: true });
});

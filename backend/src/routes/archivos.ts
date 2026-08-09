import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { getDataRoot } from '../services/fileSystemService';

export const archivosRouter = Router();

archivosRouter.get('/file', (req, res) => {
  const ruta = typeof req.query.ruta === 'string' ? req.query.ruta : null;
  if (!ruta) return res.status(400).json({ error: 'ruta requerida' });

  const dataRoot = getDataRoot();
  const normalized = path.normalize(ruta);
  if (!normalized.startsWith(path.normalize(dataRoot))) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  if (!fs.existsSync(normalized)) return res.status(404).json({ error: 'Archivo no encontrado' });

  res.sendFile(normalized);
});

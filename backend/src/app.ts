import express from 'express';
import cors from 'cors';
import { getDataRoot } from './services/fileSystemService';
import { personasRouter } from './routes/personas';
import { relacionesRouter } from './routes/relaciones';
import { documentosRouter } from './routes/documentos';
import { lugaresRouter } from './routes/lugares';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(getDataRoot()));
  app.use('/api/personas', personasRouter);
  app.use('/api/relaciones', relacionesRouter);
  app.use('/api/documentos', documentosRouter);
  app.use('/api/lugares', lugaresRouter);
  return app;
}

import { createApp } from './app';
import { getDb, closeDb } from './db/database';
import type { Server } from 'http';

let server: Server | null = null;

export function startServer(port: number): Promise<void> {
  return new Promise((resolve) => {
    getDb();
    const app = createApp();
    server = app.listen(port, () => {
      console.log(`Archivo Genealógico API running on http://localhost:${port}`);
      resolve();
    });
  });
}

export function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    closeDb();
    if (server) {
      server.close(() => resolve());
      server = null;
    } else {
      resolve();
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3001;
  startServer(port);
}

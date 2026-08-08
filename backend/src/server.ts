import { createApp } from './app';
import { getDb } from './db/database';

export function startServer(port: number): Promise<void> {
  return new Promise((resolve) => {
    getDb();
    const app = createApp();
    app.listen(port, () => {
      console.log(`Archivo Genealógico API running on http://localhost:${port}`);
      resolve();
    });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3001;
  startServer(port);
}

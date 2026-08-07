import { createApp } from './app';
import { getDb } from './db/database';

const PORT = process.env.PORT || 3001;
getDb();
const app = createApp();
app.listen(PORT, () => {
  console.log(`Archivo Genealógico API running on http://localhost:${PORT}`);
});

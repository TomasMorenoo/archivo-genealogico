import { getDb } from '../db/database';
import type { Lugar } from '../types';

export function searchLugares(q: string): Lugar[] {
  const search = `%${q}%`;
  return getDb().prepare(`
    SELECT * FROM lugares
    WHERE ciudad LIKE ? OR provincia LIKE ? OR pais LIKE ?
    ORDER BY ciudad, provincia, pais
    LIMIT 20
  `).all(search, search, search) as Lugar[];
}

export function getAllLugares(): Lugar[] {
  return getDb().prepare('SELECT * FROM lugares ORDER BY id').all() as Lugar[];
}

export function updateLugarById(id: number, data: { ciudad: string; provincia: string | null; pais: string; latitud: number; longitud: number }): void {
  getDb().prepare('UPDATE lugares SET ciudad=?, provincia=?, pais=?, latitud=?, longitud=? WHERE id=?')
    .run(data.ciudad, data.provincia, data.pais, data.latitud, data.longitud, id);
}

export function upsertLugar(input: {
  ciudad: string;
  provincia?: string | null;
  pais: string;
  latitud?: number | null;
  longitud?: number | null;
}): Lugar {
  const db = getDb();
  db.prepare(`
    INSERT INTO lugares (ciudad, provincia, pais, latitud, longitud)
    VALUES (@ciudad, @provincia, @pais, @latitud, @longitud)
    ON CONFLICT(ciudad, provincia, pais) DO UPDATE SET
      latitud = COALESCE(@latitud, latitud),
      longitud = COALESCE(@longitud, longitud)
  `).run({
    ciudad: input.ciudad,
    provincia: input.provincia ?? null,
    pais: input.pais,
    latitud: input.latitud ?? null,
    longitud: input.longitud ?? null,
  });
  return db.prepare(
    'SELECT * FROM lugares WHERE ciudad = ? AND pais = ? AND (provincia = ? OR (provincia IS NULL AND ? IS NULL))'
  ).get(input.ciudad, input.pais, input.provincia ?? null, input.provincia ?? null) as Lugar;
}

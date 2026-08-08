import { getDb } from '../db/database';
import type { Relacion, TipoRelacion } from '../types';
import { formatPid } from './personaService';

export function listTiposRelacion(): TipoRelacion[] {
  return getDb().prepare('SELECT * FROM tipo_relacion ORDER BY id').all() as TipoRelacion[];
}

export function getRelacionesDePersona(personaId: number): Relacion[] {
  const rows = getDb().prepare(`
    SELECT
      r.id,
      r.persona_origen_id,
      r.tipo_relacion_id,
      tr.nombre as tipo_relacion_nombre,
      r.persona_destino_id,
      (p.apellido || ', ' || p.nombre) as persona_destino_nombre
    FROM relaciones r
    JOIN tipo_relacion tr ON r.tipo_relacion_id = tr.id
    JOIN personas p ON r.persona_destino_id = p.id
    WHERE r.persona_origen_id = ?
    ORDER BY tr.id, p.apellido, p.nombre
  `).all(personaId) as any[];
  return rows.map(r => ({ ...r, persona_destino_pid: formatPid(r.persona_destino_id) }));
}

// Grupos de relaciones generizadas: todos los ids que representan el mismo concepto
const GENDERED_GROUPS: Record<number, number[]> = {
  1: [1, 2], 2: [1, 2],       // Padre / Madre
  3: [3, 4], 4: [3, 4],       // Hijo / Hija
  6: [6, 7], 7: [6, 7],       // Padre biológico / Madre biológica
  8: [8, 9], 9: [8, 9],       // Padre adoptivo / Madre adoptiva
  10: [10, 11], 11: [10, 11], // Hermano / Hermana
  13: [13, 14], 14: [13, 14], // Abuelo / Abuela
  15: [15, 16], 16: [15, 16], // Bisabuelo / Bisabuela
};

// Elige el inverso correcto según el sexo de la persona origen
function resolveInverso(inversoId: number, sexo: string): number {
  const f = sexo === 'F';
  if (inversoId === 1 || inversoId === 2)   return f ? 2 : 1;
  if (inversoId === 3 || inversoId === 4)   return f ? 4 : 3;
  if (inversoId === 6 || inversoId === 7)   return f ? 7 : 6;
  if (inversoId === 8 || inversoId === 9)   return f ? 9 : 8;
  if (inversoId === 10 || inversoId === 11) return f ? 11 : 10;
  if (inversoId === 13 || inversoId === 14) return f ? 14 : 13;
  if (inversoId === 15 || inversoId === 16) return f ? 16 : 15;
  return inversoId;
}

export function addRelacion(
  personaOrigenId: number,
  tipoRelacionId: number,
  personaDestinoId: number
): void {
  const db = getDb();
  const tipo = db.prepare('SELECT * FROM tipo_relacion WHERE id = ?').get(tipoRelacionId) as TipoRelacion | undefined;
  if (!tipo) throw new Error(`Tipo de relación ${tipoRelacionId} no existe`);

  const insertRelacion = db.prepare(`
    INSERT OR IGNORE INTO relaciones (persona_origen_id, tipo_relacion_id, persona_destino_id)
    VALUES (?, ?, ?)
  `);

  db.transaction(() => {
    insertRelacion.run(personaOrigenId, tipoRelacionId, personaDestinoId);
    if (tipo.inverso_id) {
      const origen = db.prepare('SELECT sexo FROM personas WHERE id = ?').get(personaOrigenId) as { sexo: string } | undefined;
      const inversoId = resolveInverso(tipo.inverso_id, origen?.sexo ?? 'M');
      insertRelacion.run(personaDestinoId, inversoId, personaOrigenId);
    }
  })();
}

export function deleteRelacion(relacionId: number): void {
  const db = getDb();
  const rel = db.prepare('SELECT * FROM relaciones WHERE id = ?').get(relacionId) as any;
  if (!rel) return;
  const tipo = db.prepare('SELECT * FROM tipo_relacion WHERE id = ?').get(rel.tipo_relacion_id) as TipoRelacion;

  db.transaction(() => {
    db.prepare('DELETE FROM relaciones WHERE id = ?').run(relacionId);
    if (tipo.inverso_id) {
      const group = GENDERED_GROUPS[tipo.inverso_id] ?? [tipo.inverso_id];
      const placeholders = group.map(() => '?').join(', ');
      db.prepare(`
        DELETE FROM relaciones
        WHERE persona_origen_id = ? AND tipo_relacion_id IN (${placeholders}) AND persona_destino_id = ?
      `).run(rel.persona_destino_id, ...group, rel.persona_origen_id);
    }
  })();
}

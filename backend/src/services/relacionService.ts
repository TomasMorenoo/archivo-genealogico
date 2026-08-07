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
      insertRelacion.run(personaDestinoId, tipo.inverso_id, personaOrigenId);
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
      db.prepare(`
        DELETE FROM relaciones
        WHERE persona_origen_id = ? AND tipo_relacion_id = ? AND persona_destino_id = ?
      `).run(rel.persona_destino_id, tipo.inverso_id, rel.persona_origen_id);
    }
  })();
}

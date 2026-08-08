"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTiposRelacion = listTiposRelacion;
exports.getRelacionesDePersona = getRelacionesDePersona;
exports.addRelacion = addRelacion;
exports.deleteRelacion = deleteRelacion;
const database_1 = require("../db/database");
const personaService_1 = require("./personaService");
function listTiposRelacion() {
    return (0, database_1.getDb)().prepare('SELECT * FROM tipo_relacion ORDER BY id').all();
}
function getRelacionesDePersona(personaId) {
    const rows = (0, database_1.getDb)().prepare(`
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
  `).all(personaId);
    return rows.map(r => ({ ...r, persona_destino_pid: (0, personaService_1.formatPid)(r.persona_destino_id) }));
}
function addRelacion(personaOrigenId, tipoRelacionId, personaDestinoId) {
    const db = (0, database_1.getDb)();
    const tipo = db.prepare('SELECT * FROM tipo_relacion WHERE id = ?').get(tipoRelacionId);
    if (!tipo)
        throw new Error(`Tipo de relación ${tipoRelacionId} no existe`);
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
function deleteRelacion(relacionId) {
    const db = (0, database_1.getDb)();
    const rel = db.prepare('SELECT * FROM relaciones WHERE id = ?').get(relacionId);
    if (!rel)
        return;
    const tipo = db.prepare('SELECT * FROM tipo_relacion WHERE id = ?').get(rel.tipo_relacion_id);
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

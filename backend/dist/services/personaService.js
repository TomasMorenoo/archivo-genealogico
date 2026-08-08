"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPid = formatPid;
exports.listPersonas = listPersonas;
exports.getPersona = getPersona;
exports.createPersona = createPersona;
exports.updatePersona = updatePersona;
exports.deletePersona = deletePersona;
const database_1 = require("../db/database");
function formatPid(id) {
    return `P${String(id).padStart(5, '0')}`;
}
function listPersonas(search) {
    const db = (0, database_1.getDb)();
    let query = `SELECT id, nombre, apellido, nac_anio FROM personas`;
    const params = [];
    if (search) {
        query += ` WHERE nombre LIKE ? OR apellido LIKE ? OR (apellido || ', ' || nombre) LIKE ?`;
        const s = `%${search}%`;
        params.push(s, s, s);
    }
    query += ` ORDER BY apellido, nombre`;
    const rows = db.prepare(query).all(...params);
    return rows.map(r => ({ ...r, pid: formatPid(r.id) }));
}
function getPersona(id) {
    const db = (0, database_1.getDb)();
    const row = db.prepare(`
    SELECT p.*,
      l1.ciudad as nac_ciudad, l1.provincia as nac_provincia, l1.pais as nac_pais,
      l2.ciudad as def_ciudad, l2.provincia as def_provincia, l2.pais as def_pais
    FROM personas p
    LEFT JOIN lugares l1 ON p.nac_lugar_id = l1.id
    LEFT JOIN lugares l2 ON p.def_lugar_id = l2.id
    WHERE p.id = ?
  `).get(id);
    if (!row)
        return null;
    return {
        ...row,
        pid: formatPid(row.id),
        nac_lugar: row.nac_ciudad ? {
            id: row.nac_lugar_id, ciudad: row.nac_ciudad,
            provincia: row.nac_provincia, pais: row.nac_pais,
        } : null,
        def_lugar: row.def_ciudad ? {
            id: row.def_lugar_id, ciudad: row.def_ciudad,
            provincia: row.def_provincia, pais: row.def_pais,
        } : null,
    };
}
function createPersona(input) {
    const db = (0, database_1.getDb)();
    const result = db.prepare(`
    INSERT INTO personas
      (nombre, apellido, sexo, nac_dia, nac_mes, nac_anio, nac_tipo, nac_lugar_id,
       def_dia, def_mes, def_anio, def_tipo, def_lugar_id, historia)
    VALUES
      (@nombre, @apellido, @sexo, @nac_dia, @nac_mes, @nac_anio, @nac_tipo, @nac_lugar_id,
       @def_dia, @def_mes, @def_anio, @def_tipo, @def_lugar_id, @historia)
  `).run({
        nombre: input.nombre,
        apellido: input.apellido,
        sexo: input.sexo,
        nac_dia: input.nac_dia ?? null,
        nac_mes: input.nac_mes ?? null,
        nac_anio: input.nac_anio ?? null,
        nac_tipo: input.nac_tipo ?? 'desconocida',
        nac_lugar_id: input.nac_lugar_id ?? null,
        def_dia: input.def_dia ?? null,
        def_mes: input.def_mes ?? null,
        def_anio: input.def_anio ?? null,
        def_tipo: input.def_tipo ?? 'desconocida',
        def_lugar_id: input.def_lugar_id ?? null,
        historia: input.historia ?? '',
    });
    return getPersona(result.lastInsertRowid);
}
function updatePersona(id, input) {
    const db = (0, database_1.getDb)();
    const allowed = ['nombre', 'apellido', 'sexo', 'nac_dia', 'nac_mes', 'nac_anio', 'nac_tipo',
        'nac_lugar_id', 'def_dia', 'def_mes', 'def_anio', 'def_tipo', 'def_lugar_id', 'historia'];
    const entries = Object.entries(input).filter(([k]) => allowed.includes(k));
    if (entries.length === 0)
        return getPersona(id);
    const fields = entries.map(([k]) => `${k} = @${k}`).join(', ');
    const params = { id };
    for (const [k, v] of entries)
        params[k] = v;
    db.prepare(`UPDATE personas SET ${fields}, actualizado_en = datetime('now') WHERE id = @id`).run(params);
    return getPersona(id);
}
function deletePersona(id) {
    (0, database_1.getDb)().prepare('DELETE FROM personas WHERE id = ?').run(id);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDid = formatDid;
exports.getDocumento = getDocumento;
exports.getDocumentosPrincipalesDePersona = getDocumentosPrincipalesDePersona;
exports.getDocumentosMencionadaDePersona = getDocumentosMencionadaDePersona;
exports.createDocumento = createDocumento;
exports.updateDocumentoRuta = updateDocumentoRuta;
exports.updateDocumento = updateDocumento;
exports.deleteDocumento = deleteDocumento;
const database_1 = require("../db/database");
const personaService_1 = require("./personaService");
function formatDid(id) {
    return `D${String(id).padStart(5, '0')}`;
}
function hydratePersonas(documentoId) {
    return (0, database_1.getDb)().prepare(`
    SELECT dp.persona_id, dp.rol,
      (p.apellido || ', ' || p.nombre) as persona_nombre
    FROM documento_personas dp
    JOIN personas p ON dp.persona_id = p.id
    WHERE dp.documento_id = ?
    ORDER BY dp.rol DESC, p.apellido, p.nombre
  `).all(documentoId).map((r) => ({
        persona_id: r.persona_id,
        persona_pid: (0, personaService_1.formatPid)(r.persona_id),
        persona_nombre: r.persona_nombre,
        rol: r.rol,
    }));
}
function hydrateDoc(row) {
    return { ...row, did: formatDid(row.id), personas: hydratePersonas(row.id) };
}
function getDocumento(id) {
    const row = (0, database_1.getDb)().prepare('SELECT * FROM documentos WHERE id = ?').get(id);
    if (!row)
        return null;
    return hydrateDoc(row);
}
function getDocumentosPrincipalesDePersona(personaId) {
    const rows = (0, database_1.getDb)().prepare(`
    SELECT d.* FROM documentos d
    JOIN documento_personas dp ON dp.documento_id = d.id
    WHERE dp.persona_id = ? AND dp.rol = 'principal'
    ORDER BY d.doc_anio DESC, d.creado_en DESC
  `).all(personaId);
    return rows.map(hydrateDoc);
}
function getDocumentosMencionadaDePersona(personaId) {
    const rows = (0, database_1.getDb)().prepare(`
    SELECT d.* FROM documentos d
    JOIN documento_personas dp ON dp.documento_id = d.id
    WHERE dp.persona_id = ? AND dp.rol = 'mencionada'
    ORDER BY d.doc_anio DESC, d.creado_en DESC
  `).all(personaId);
    return rows.map(hydrateDoc);
}
function createDocumento(input) {
    const db = (0, database_1.getDb)();
    const result = db.prepare(`
    INSERT INTO documentos
      (titulo, tipo, doc_dia, doc_mes, doc_anio, doc_fecha_tipo, descripcion, ruta, nombre_original)
    VALUES
      (@titulo, @tipo, @doc_dia, @doc_mes, @doc_anio, @doc_fecha_tipo, @descripcion, @ruta, @nombre_original)
  `).run({
        titulo: input.titulo,
        tipo: input.tipo,
        doc_dia: input.doc_dia ?? null,
        doc_mes: input.doc_mes ?? null,
        doc_anio: input.doc_anio ?? null,
        doc_fecha_tipo: input.doc_fecha_tipo ?? 'desconocida',
        descripcion: input.descripcion ?? '',
        ruta: input.ruta ?? null,
        nombre_original: input.nombre_original ?? null,
    });
    const docId = result.lastInsertRowid;
    const insertPersona = db.prepare(`
    INSERT OR IGNORE INTO documento_personas (documento_id, persona_id, rol) VALUES (?, ?, ?)
  `);
    db.transaction(() => {
        for (const pid of input.personasPrincipales)
            insertPersona.run(docId, pid, 'principal');
        for (const pid of (input.personasMencionadas ?? []))
            insertPersona.run(docId, pid, 'mencionada');
    })();
    return getDocumento(docId);
}
function updateDocumentoRuta(docId, ruta, nombreOriginal) {
    (0, database_1.getDb)().prepare(`
    UPDATE documentos SET ruta = ?, nombre_original = ?, actualizado_en = datetime('now') WHERE id = ?
  `).run(ruta, nombreOriginal, docId);
}
function updateDocumento(id, input) {
    const db = (0, database_1.getDb)();
    const allowed = ['titulo', 'tipo', 'doc_dia', 'doc_mes', 'doc_anio', 'doc_fecha_tipo', 'descripcion'];
    const entries = Object.entries(input).filter(([k]) => allowed.includes(k));
    if (entries.length > 0) {
        const fields = entries.map(([k]) => `${k} = @${k}`).join(', ');
        const params = { id };
        for (const [k, v] of entries)
            params[k] = v;
        db.prepare(`UPDATE documentos SET ${fields}, actualizado_en = datetime('now') WHERE id = @id`).run(params);
    }
    if (input.personasPrincipales !== undefined || input.personasMencionadas !== undefined) {
        db.transaction(() => {
            if (input.personasPrincipales !== undefined) {
                db.prepare("DELETE FROM documento_personas WHERE documento_id = ? AND rol = 'principal'").run(id);
                for (const pid of input.personasPrincipales) {
                    db.prepare("INSERT OR IGNORE INTO documento_personas (documento_id, persona_id, rol) VALUES (?,?,'principal')").run(id, pid);
                }
            }
            if (input.personasMencionadas !== undefined) {
                db.prepare("DELETE FROM documento_personas WHERE documento_id = ? AND rol = 'mencionada'").run(id);
                for (const pid of input.personasMencionadas) {
                    db.prepare("INSERT OR IGNORE INTO documento_personas (documento_id, persona_id, rol) VALUES (?,?,'mencionada')").run(id, pid);
                }
            }
        })();
    }
    return getDocumento(id);
}
function deleteDocumento(id) {
    (0, database_1.getDb)().prepare('DELETE FROM documentos WHERE id = ?').run(id);
}

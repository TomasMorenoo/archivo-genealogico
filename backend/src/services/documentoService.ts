import { getDb } from '../db/database';
import type { Documento, DocumentoPersona } from '../types';
import { formatPid } from './personaService';

export function formatDid(id: number): string {
  return `D${String(id).padStart(5, '0')}`;
}

function hydratePersonas(documentoId: number): DocumentoPersona[] {
  return (getDb().prepare(`
    SELECT dp.persona_id, dp.rol,
      (p.apellido || ', ' || p.nombre) as persona_nombre
    FROM documento_personas dp
    JOIN personas p ON dp.persona_id = p.id
    WHERE dp.documento_id = ?
    ORDER BY dp.rol DESC, p.apellido, p.nombre
  `).all(documentoId) as any[]).map((r: any) => ({
    persona_id: r.persona_id,
    persona_pid: formatPid(r.persona_id),
    persona_nombre: r.persona_nombre,
    rol: r.rol as 'principal' | 'mencionada',
  }));
}

function hydrateDoc(row: any): Documento {
  return { ...row, did: formatDid(row.id), personas: hydratePersonas(row.id) };
}

export function getDocumento(id: number): Documento | null {
  const row = getDb().prepare('SELECT * FROM documentos WHERE id = ?').get(id);
  if (!row) return null;
  return hydrateDoc(row);
}

export function getDocumentosPrincipalesDePersona(personaId: number): Documento[] {
  const rows = getDb().prepare(`
    SELECT d.* FROM documentos d
    JOIN documento_personas dp ON dp.documento_id = d.id
    WHERE dp.persona_id = ? AND dp.rol = 'principal'
    ORDER BY d.doc_anio DESC, d.creado_en DESC
  `).all(personaId) as any[];
  return rows.map(hydrateDoc);
}

export function getDocumentosMencionadaDePersona(personaId: number): Documento[] {
  const rows = getDb().prepare(`
    SELECT d.* FROM documentos d
    JOIN documento_personas dp ON dp.documento_id = d.id
    WHERE dp.persona_id = ? AND dp.rol = 'mencionada'
    ORDER BY d.doc_anio DESC, d.creado_en DESC
  `).all(personaId) as any[];
  return rows.map(hydrateDoc);
}

export interface CreateDocumentoInput {
  titulo: string;
  tipo: string;
  doc_dia?: number | null;
  doc_mes?: number | null;
  doc_anio?: number | null;
  doc_fecha_tipo?: string;
  descripcion?: string;
  ruta?: string | null;
  nombre_original?: string | null;
  personasPrincipales: number[];
  personasMencionadas?: number[];
}

export function createDocumento(input: CreateDocumentoInput): Documento {
  const db = getDb();
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
  const docId = result.lastInsertRowid as number;

  const insertPersona = db.prepare(`
    INSERT OR IGNORE INTO documento_personas (documento_id, persona_id, rol) VALUES (?, ?, ?)
  `);

  db.transaction(() => {
    for (const pid of input.personasPrincipales) insertPersona.run(docId, pid, 'principal');
    for (const pid of (input.personasMencionadas ?? [])) insertPersona.run(docId, pid, 'mencionada');
  })();

  return getDocumento(docId)!;
}

export function updateDocumentoRuta(docId: number, ruta: string, nombreOriginal: string): void {
  getDb().prepare(`
    UPDATE documentos SET ruta = ?, nombre_original = ?, actualizado_en = datetime('now') WHERE id = ?
  `).run(ruta, nombreOriginal, docId);
}

export function updateDocumento(id: number, input: Partial<CreateDocumentoInput>): Documento | null {
  const db = getDb();
  const allowed = ['titulo','tipo','doc_dia','doc_mes','doc_anio','doc_fecha_tipo','descripcion'];
  const entries = Object.entries(input).filter(([k]) => allowed.includes(k));
  if (entries.length > 0) {
    const fields = entries.map(([k]) => `${k} = @${k}`).join(', ');
    const params: Record<string, any> = { id };
    for (const [k, v] of entries) params[k] = v;
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

export function deleteDocumento(id: number): void {
  getDb().prepare('DELETE FROM documentos WHERE id = ?').run(id);
}

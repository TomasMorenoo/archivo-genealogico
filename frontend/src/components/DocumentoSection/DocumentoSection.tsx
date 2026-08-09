import { useState } from 'react';
import type { Documento } from '../../types';
import DocumentoForm from '../DocumentoForm/DocumentoForm';
import { documentosApi } from '../../api/client';

const FILE_URL = (ruta: string) =>
  `http://localhost:3001/api/archivos/file?ruta=${encodeURIComponent(ruta)}`;

function isImage(nombre: string | null): boolean {
  if (!nombre) return false;
  return /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i.test(nombre);
}

function isPdf(nombre: string | null): boolean {
  if (!nombre) return false;
  return /\.pdf$/i.test(nombre);
}

function docLabel(d: Documento): string {
  const tipo = d.tipo === 'Otro' ? d.titulo : d.tipo;
  const principal = d.personas.find(p => p.rol === 'principal');
  return principal ? `${tipo} · ${principal.persona_nombre}` : tipo;
}

function FilePreview({ ruta, nombre }: { ruta: string; nombre: string }) {
  if (isImage(nombre)) {
    return (
      <img
        src={FILE_URL(ruta)}
        alt={nombre}
        style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 4, background: '#f0f0f0' }}
      />
    );
  }
  if (isPdf(nombre)) {
    return (
      <iframe
        src={FILE_URL(ruta)}
        title={nombre}
        style={{ width: '100%', height: 320, border: 'none', borderRadius: 4 }}
      />
    );
  }
  return null;
}

function DocCard({ d, onDelete, showDelete }: { d: Documento; onDelete?: () => void; showDelete?: boolean }) {
  const [open, setOpen] = useState(false);
  const mencionados = d.personas.filter(p => p.rol === 'mencionada');
  const principales = d.personas.filter(p => p.rol === 'principal');

  return (
    <div style={card}>
      {/* Collapsed row */}
      <div style={row}>
        <code style={didStyle}>{d.did}</code>
        <span style={labelStyle}>{docLabel(d)}</span>
        {d.doc_anio && <span style={yearStyle}>{d.doc_anio}</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {d.ruta && (
            <button onClick={() => window.electronAPI?.openFile(d.ruta!)} style={openBtn}>Abrir</button>
          )}
          {showDelete && onDelete && (
            <button onClick={onDelete} style={delBtn}>✕</button>
          )}
          <button onClick={() => setOpen(o => !o)} style={chevronBtn} title={open ? 'Cerrar' : 'Ver detalles'}>
            {open ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div style={expanded}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {!showDelete && principales.length > 0 && (
              <div style={metaBlock}>
                <span style={metaLbl}>Principal</span>
                {principales.map(p => <div key={p.persona_id} style={personLine}>{p.persona_nombre}</div>)}
              </div>
            )}
            {mencionados.length > 0 && (
              <div style={metaBlock}>
                <span style={metaLbl}>Mencionados</span>
                {mencionados.map(p => <div key={p.persona_id} style={personLine}>{p.persona_nombre}</div>)}
              </div>
            )}
            {d.descripcion && (
              <div style={metaBlock}>
                <span style={metaLbl}>Descripción</span>
                <span style={personLine}>{d.descripcion}</span>
              </div>
            )}
            {d.nombre_original && (
              <div style={{ ...metaBlock, marginTop: 8 }}>
                <span style={metaLbl}>Archivo</span>
                <span style={{ ...personLine, color: '#555' }}>📎 {d.nombre_original}</span>
              </div>
            )}
          </div>
          {d.ruta && d.nombre_original && (isImage(d.nombre_original) || isPdf(d.nombre_original)) && (
            <div style={{ width: 260, flexShrink: 0 }}>
              <FilePreview ruta={d.ruta} nombre={d.nombre_original} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  personaId: number;
  personaNombre?: string;
  personaApellido?: string;
  personaPid?: string;
  principales: Documento[];
  mencionada: Documento[];
  onUpdate: () => void;
}

export default function DocumentoSection({ personaId, personaNombre, personaApellido, personaPid, principales, mencionada, onUpdate }: Props) {
  const [adding, setAdding] = useState(false);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este documento?')) return;
    await documentosApi.delete(id);
    onUpdate();
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={sectionTitle}>Documentos</h2>
        <button onClick={() => setAdding(true)} style={btnSmall}>+ Agregar</button>
      </div>

      {adding && (
        <div style={{ marginBottom: 20, padding: 16, background: '#f9f9f9', borderRadius: 6, border: '1px solid #e0e0e0' }}>
          <DocumentoForm
            defaultPersona={personaNombre ? { id: personaId, nombre: personaNombre, apellido: personaApellido ?? '', pid: personaPid ?? '' } : undefined}
            onSaved={() => { setAdding(false); onUpdate(); }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <h3 style={subTitle}>Propios</h3>
      {principales.length === 0
        ? <p style={empty}>Sin documentos.</p>
        : <div style={list}>
            {principales.map(d => (
              <DocCard key={d.id} d={d} showDelete onDelete={() => handleDelete(d.id)} />
            ))}
          </div>
      }

      <h3 style={{ ...subTitle, marginTop: 12 }}>Mencionado en</h3>
      {mencionada.length === 0
        ? <p style={empty}>No aparece en otros documentos.</p>
        : <div style={list}>
            {mencionada.map(d => (
              <DocCard key={d.id} d={d} />
            ))}
          </div>
      }
    </section>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#444', marginBottom: 0 };
const subTitle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 };
const empty: React.CSSProperties = { color: '#bbb', fontSize: '0.85rem', marginBottom: 8 };
const list: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 };

const card: React.CSSProperties = { border: '1px solid #e8e8e8', borderRadius: 6, overflow: 'hidden' };
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#fafafa' };
const didStyle: React.CSSProperties = { color: '#aaa', fontSize: '0.75rem', flexShrink: 0 };
const labelStyle: React.CSSProperties = { fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const yearStyle: React.CSSProperties = { color: '#888', fontSize: '0.82rem', flexShrink: 0 };
const expanded: React.CSSProperties = { display: 'flex', gap: 16, padding: '12px 14px', borderTop: '1px solid #efefef', background: '#fff' };
const metaBlock: React.CSSProperties = { marginBottom: 8 };
const metaLbl: React.CSSProperties = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 };
const personLine: React.CSSProperties = { fontSize: '0.85rem', color: '#444', lineHeight: 1.6 };

const openBtn: React.CSSProperties = { border: '1px solid #cce0ff', background: '#f0f7ff', color: '#0070f3', cursor: 'pointer', fontSize: '0.78rem', padding: '3px 10px', borderRadius: 4 };
const delBtn: React.CSSProperties = { border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 4px' };
const chevronBtn: React.CSSProperties = { border: 'none', background: 'none', color: '#888', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 4px' };
const btnSmall: React.CSSProperties = { border: '1px solid #ccc', background: 'transparent', padding: '5px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' };

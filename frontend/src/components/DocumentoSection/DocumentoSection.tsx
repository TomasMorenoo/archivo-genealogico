import { useState } from 'react';
import type { Documento } from '../../types';
import DocumentoForm from '../DocumentoForm/DocumentoForm';
import { documentosApi } from '../../api/client';

interface Props {
  personaId: number;
  personaNombre?: string;
  personaApellido?: string;
  personaPid?: string;
  principales: Documento[];
  mencionada: Documento[];
  onUpdate: () => void;
}

function DocCard({ d, onDelete, showDelete }: { d: Documento; onDelete?: () => void; showDelete?: boolean }) {
  const mencionados = d.personas.filter(p => p.rol === 'mencionada').map(p => p.persona_nombre);
  const principales = d.personas.filter(p => p.rol === 'principal').map(p => p.persona_nombre);

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={titleStyle}>{d.titulo}</span>
            <span style={tag}>{d.tipo}</span>
            {d.doc_anio && <span style={year}>{d.doc_anio}</span>}
          </div>
          <div style={meta}><span style={metaLabel}>ID</span>{d.did}</div>
          {d.nombre_original && (
            <div style={meta}><span style={metaLabel}>Archivo</span><span style={{ color: '#555' }}>📎 {d.nombre_original}</span></div>
          )}
          {mencionados.length > 0 && (
            <div style={meta}><span style={metaLabel}>Mencionados</span>{mencionados.join(', ')}</div>
          )}
          {principales.length > 0 && !showDelete && (
            <div style={meta}><span style={metaLabel}>Principal</span>{principales.join(', ')}</div>
          )}
          {d.descripcion && <div style={{ ...meta, color: '#666', marginTop: 4 }}>{d.descripcion}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
          {d.ruta && (
            <button onClick={() => window.electronAPI?.openFile(d.ruta!)} style={openBtn}>Abrir</button>
          )}
          {showDelete && onDelete && (
            <button onClick={onDelete} style={delBtn}>Eliminar</button>
          )}
        </div>
      </div>
    </div>
  );
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
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {principales.map(d => (
              <DocCard key={d.id} d={d} showDelete onDelete={() => handleDelete(d.id)} />
            ))}
          </div>
      }

      <h3 style={{ ...subTitle, marginTop: 8 }}>Mencionado en</h3>
      {mencionada.length === 0
        ? <p style={empty}>No aparece en otros documentos.</p>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
const card: React.CSSProperties = { background: '#fafafa', border: '1px solid #ebebeb', borderRadius: 6, padding: '10px 14px' };
const titleStyle: React.CSSProperties = { fontWeight: 600, fontSize: '0.95rem' };
const tag: React.CSSProperties = { background: '#efefef', padding: '2px 7px', borderRadius: 3, fontSize: '0.72rem', color: '#555' };
const year: React.CSSProperties = { color: '#888', fontSize: '0.82rem' };
const meta: React.CSSProperties = { fontSize: '0.8rem', color: '#888', display: 'flex', gap: 6, marginTop: 2 };
const metaLabel: React.CSSProperties = { fontWeight: 600, color: '#aaa', minWidth: 64, flexShrink: 0 };
const openBtn: React.CSSProperties = { border: '1px solid #cce0ff', background: '#f0f7ff', color: '#0070f3', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 12px', borderRadius: 4 };
const delBtn: React.CSSProperties = { border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 0' };
const btnSmall: React.CSSProperties = { border: '1px solid #ccc', background: 'transparent', padding: '5px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' };

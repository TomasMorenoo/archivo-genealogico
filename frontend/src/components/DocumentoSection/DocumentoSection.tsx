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

      <h3 style={subTitle}>Documentos principales</h3>
      {principales.length === 0
        ? <p style={empty}>Sin documentos principales.</p>
        : <ul style={list}>
            {principales.map(d => (
              <li key={d.id} style={listItem}>
                <div>
                  <code style={did}>{d.did}</code>
                  <span style={{ fontWeight: 500 }}>{d.titulo}</span>
                  <span style={tag}>{d.tipo}</span>
                  {d.doc_anio && <span style={yearStyle}>{d.doc_anio}</span>}
                  {d.nombre_original && (
                    <span style={{ marginLeft: 8, color: '#888', fontSize: '0.8rem' }}>📎 {d.nombre_original}</span>
                  )}
                  {d.descripcion && <p style={{ color: '#666', fontSize: '0.82rem', marginTop: 2 }}>{d.descripcion}</p>}
                  <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 2 }}>
                    Mencionados: {d.personas.filter(p => p.rol === 'mencionada').map(p => p.persona_nombre).join(', ') || '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {d.ruta && <button onClick={() => window.electronAPI?.openFile(d.ruta!)} style={openBtn}>Abrir</button>}
                  <button onClick={() => handleDelete(d.id)} style={delBtn}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
      }

      <h3 style={{ ...subTitle, marginTop: 16 }}>Mencionado en</h3>
      {mencionada.length === 0
        ? <p style={empty}>No aparece mencionado en otros documentos.</p>
        : <ul style={list}>
            {mencionada.map(d => (
              <li key={d.id} style={listItem}>
                <div>
                  <code style={did}>{d.did}</code>
                  <span style={{ fontWeight: 500 }}>{d.titulo}</span>
                  <span style={tag}>{d.tipo}</span>
                  {d.doc_anio && <span style={yearStyle}>{d.doc_anio}</span>}
                  <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 2 }}>
                    Principal: {d.personas.filter(p => p.rol === 'principal').map(p => p.persona_nombre).join(', ')}
                  </div>
                </div>
                {d.ruta && <button onClick={() => window.electronAPI?.openFile(d.ruta!)} style={openBtn}>Abrir</button>}
              </li>
            ))}
          </ul>
      }
    </section>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 0 };
const subTitle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 };
const empty: React.CSSProperties = { color: '#bbb', fontSize: '0.88rem', marginBottom: 8 };
const list: React.CSSProperties = { listStyle: 'none', padding: 0, marginBottom: 8 };
const listItem: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #f2f2f2' };
const did: React.CSSProperties = { color: '#888', fontSize: '0.78em', marginRight: 8 };
const tag: React.CSSProperties = { background: '#f0f0f0', padding: '1px 6px', borderRadius: 3, fontSize: '0.75rem', marginLeft: 8, color: '#555' };
const yearStyle: React.CSSProperties = { color: '#999', fontSize: '0.8rem', marginLeft: 6 };
const delBtn: React.CSSProperties = { border: 'none', background: 'none', color: '#bbb', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' };
const openBtn: React.CSSProperties = { border: '1px solid #ccc', background: 'transparent', color: '#0070f3', cursor: 'pointer', fontSize: '0.82rem', padding: '3px 10px', borderRadius: 4, whiteSpace: 'nowrap' };
const btnSmall: React.CSSProperties = { border: '1px solid #ccc', background: 'transparent', padding: '5px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' };

import { useState, useEffect, useCallback } from 'react';
import { personasApi, relacionesApi } from '../api/client';
import type { Persona, PersonaListItem } from '../types';
import PersonaList from '../components/PersonaList/PersonaList';
import PersonaForm from '../components/PersonaForm/PersonaForm';
import PersonaSearchInput from '../components/PersonaSearchInput/PersonaSearchInput';

export default function HomePage() {
  const [personas, setPersonas] = useState<PersonaListItem[]>([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [sortKey, setSortKey] = useState<'apellido' | 'nac_anio' | 'pid'>('pid');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [version, setVersion] = useState<string>('');
  const [padre, setPadre] = useState<PersonaListItem | null>(null);
  const [madre, setMadre] = useState<PersonaListItem | null>(null);
  const [conyuge, setConyuge] = useState<PersonaListItem | null>(null);

  const load = useCallback(async () => {
    const data = await personasApi.list(search || undefined);
    setPersonas(data);
  }, [search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    window.electronAPI?.getVersion().then(v => setVersion(v));
  }, []);

  const sorted = [...personas].sort((a, b) => {
    const va = sortKey === 'pid' ? a.id : sortKey === 'nac_anio' ? (a.nac_anio ?? 9999) : a.apellido.toLowerCase();
    const vb = sortKey === 'pid' ? b.id : sortKey === 'nac_anio' ? (b.nac_anio ?? 9999) : b.apellido.toLowerCase();
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function closeCreate() {
    setShowCreate(false);
    setPadre(null);
    setMadre(null);
    setConyuge(null);
  }

  async function handleCreate(data: Partial<Persona>) {
    const created = await personasApi.create(data);
    if (padre) await relacionesApi.add({ persona_origen_id: created.id, tipo_relacion_id: 1, persona_destino_id: padre.id });
    if (madre) await relacionesApi.add({ persona_origen_id: created.id, tipo_relacion_id: 2, persona_destino_id: madre.id });
    if (conyuge) await relacionesApi.add({ persona_origen_id: created.id, tipo_relacion_id: 5, persona_destino_id: conyuge.id });
    closeCreate();
    load();
  }

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 4 }}>Archivo Genealógico Familiar</h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>{personas.length} personas registradas</p>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <input
          type="search" placeholder="Buscar..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 140px', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.95rem' }}
        />
        <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ Nueva</button>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['apellido', 'nac_anio', 'pid'] as const).map(k => (
            <button key={k} onClick={() => toggleSort(k)} style={{
              ...btnSmall,
              background: sortKey === k ? '#1a1a1a' : '#eee',
              color: sortKey === k ? '#fff' : '#333',
            }}>
              {k === 'apellido' ? 'Apellido' : k === 'nac_anio' ? 'Año' : 'ID'}
              {sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
            </button>
          ))}
        </div>
      </div>

      <PersonaList personas={sorted} />

      {version && (
        <p style={{ color: '#ccc', fontSize: '0.75rem', marginTop: 32, textAlign: 'right' }}>v{version}</p>
      )}

      {showCreate && (
        <Modal title="Nueva Persona" onClose={closeCreate}>
          <PersonaForm
            onSave={handleCreate}
            onCancel={closeCreate}
            extraSlot={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={rowStyle}>
                  <label style={labelStyle}>Padre</label>
                  {padre
                    ? <div style={selectedStyle}>{padre.apellido}, {padre.nombre}<button onClick={() => setPadre(null)} style={clearBtn}>×</button></div>
                    : <PersonaSearchInput defaultSexo="M" onSelect={setPadre} placeholder="Buscar o crear padre..." />
                  }
                </div>
                <div style={rowStyle}>
                  <label style={labelStyle}>Madre</label>
                  {madre
                    ? <div style={selectedStyle}>{madre.apellido}, {madre.nombre}<button onClick={() => setMadre(null)} style={clearBtn}>×</button></div>
                    : <PersonaSearchInput defaultSexo="F" onSelect={setMadre} placeholder="Buscar o crear madre..." />
                  }
                </div>
                <div style={rowStyle}>
                  <label style={labelStyle}>Cónyuge</label>
                  {conyuge
                    ? <div style={selectedStyle}>{conyuge.apellido}, {conyuge.nombre}<button onClick={() => setConyuge(null)} style={clearBtn}>×</button></div>
                    : <PersonaSearchInput onSelect={setConyuge} placeholder="Buscar o crear cónyuge..." />
                  }
                </div>
              </div>
            }
          />
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={overlay}>
      <div style={dialog}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.1rem' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const dialog: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' };
const btnPrimary: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' };
const btnSmall: React.CSSProperties = { border: 'none', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' };
const rowStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
const labelStyle: React.CSSProperties = { fontSize: '0.85rem', color: '#555', fontWeight: 600 };
const selectedStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f0f9ff', borderRadius: 4, fontSize: '0.9rem' };
const clearBtn: React.CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', color: '#c00', fontSize: '1rem', lineHeight: 1 };

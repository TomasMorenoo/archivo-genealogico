import { useState, useEffect, useCallback } from 'react';
import { personasApi } from '../api/client';
import type { Persona, PersonaListItem } from '../types';
import PersonaList from '../components/PersonaList/PersonaList';
import PersonaForm from '../components/PersonaForm/PersonaForm';

export default function HomePage() {
  const [personas, setPersonas] = useState<PersonaListItem[]>([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [sortKey, setSortKey] = useState<'apellido' | 'nac_anio' | 'pid'>('apellido');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const load = useCallback(async () => {
    const data = await personasApi.list(search || undefined);
    setPersonas(data);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...personas].sort((a, b) => {
    const va = sortKey === 'pid' ? a.id : sortKey === 'nac_anio' ? (a.nac_anio ?? 9999) : a.apellido.toLowerCase();
    const vb = sortKey === 'pid' ? b.id : sortKey === 'nac_anio' ? (b.nac_anio ?? 9999) : b.apellido.toLowerCase();
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  async function handleCreate(data: Partial<Persona>) {
    await personasApi.create(data);
    setShowCreate(false);
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

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="search" placeholder="Buscar por nombre o apellido..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.95rem' }}
        />
        <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ Nueva persona</button>
        <div style={{ display: 'flex', gap: 6 }}>
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

      {showCreate && (
        <Modal title="Nueva Persona" onClose={() => setShowCreate(false)}>
          <PersonaForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
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

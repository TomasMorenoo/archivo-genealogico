import { useState, useEffect, useRef } from 'react';
import { lugaresApi } from '../../api/client';
import type { Lugar } from '../../types';

interface Props {
  value: Lugar | null;
  onChange: (lugar: Lugar | null) => void;
  placeholder?: string;
}

function formatLugar(l: Lugar) {
  return [l.ciudad, l.provincia, l.pais].filter(Boolean).join(', ');
}

export default function LugarInput({ value, onChange, placeholder = 'Ciudad, provincia, país...' }: Props) {
  const [text, setText] = useState('');
  const [results, setResults] = useState<Lugar[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newCiudad, setNewCiudad] = useState('');
  const [newProvincia, setNewProvincia] = useState('');
  const [newPais, setNewPais] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(value ? formatLugar(value) : '');
  }, [value]);

  useEffect(() => {
    if (text.length < 2 || value) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setResults(await lugaresApi.search(text));
    }, 250);
  }, [text, value]);

  async function handleCreateLugar() {
    const l = await lugaresApi.create({
      ciudad: newCiudad || '',
      provincia: newProvincia || undefined,
      pais: newPais,
    });
    onChange(l);
    setShowNew(false);
    setResults([]);
    setNewCiudad('');
    setNewProvincia('');
    setNewPais('');
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={value ? formatLugar(value) : text}
          onChange={e => { onChange(null); setText(e.target.value); }}
          placeholder={placeholder}
          style={inp}
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(null); setText(''); }}
            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#999', fontSize: '1rem' }}>
            ×
          </button>
        )}
      </div>

      {!value && results.length > 0 && (
        <div style={dropdown}>
          {results.map(l => (
            <div key={l.id} style={item} onClick={() => { onChange(l); setResults([]); }}>
              {formatLugar(l)}
            </div>
          ))}
          <div style={{ ...item, color: '#0070f3' }} onClick={() => { setNewCiudad(text); setShowNew(true); setResults([]); }}>
            + Agregar lugar nuevo
          </div>
        </div>
      )}

      {!value && text.length >= 2 && results.length === 0 && !showNew && (
        <div style={dropdown}>
          <div style={{ ...item, color: '#0070f3' }} onClick={() => { setNewCiudad(text); setShowNew(true); }}>
            + Agregar lugar nuevo "{text}"
          </div>
        </div>
      )}

      {showNew && (
        <div style={{ marginTop: 8, padding: 12, background: '#f9f9f9', borderRadius: 6, border: '1px solid #ddd' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input type="text" placeholder="Ciudad / Localidad" value={newCiudad} onChange={e => setNewCiudad(e.target.value)} style={inp} />
            <input type="text" placeholder="Provincia *" value={newProvincia} onChange={e => setNewProvincia(e.target.value)} style={inp} />
            <input type="text" placeholder="País *" value={newPais} onChange={e => setNewPais(e.target.value)} style={inp} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={handleCreateLugar}
                disabled={!newProvincia || !newPais}
                style={{ ...btnPrimary, fontSize: '0.85rem', padding: '5px 12px' }}>
                Guardar lugar
              </button>
              <button type="button" onClick={() => setShowNew(false)}
                style={{ border: '1px solid #ccc', background: 'none', borderRadius: 4, padding: '5px 10px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = { padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem', width: '100%' };
const dropdown: React.CSSProperties = {
  position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
  border: '1px solid #ccc', borderRadius: 4, zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};
const item: React.CSSProperties = { padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '0.9rem' };
const btnPrimary: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };

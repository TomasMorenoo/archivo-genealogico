import { useState, useEffect, useRef } from 'react';
import { lugaresApi, NominatimResult } from '../../api/client';
import type { Lugar } from '../../types';

interface Props {
  value: Lugar | null;
  onChange: (lugar: Lugar | null) => void;
  placeholder?: string;
}

function formatLugar(l: Lugar) {
  return [l.ciudad, l.provincia, l.pais].filter(Boolean).join(', ');
}

export default function LugarInput({ value, onChange, placeholder = 'Buscar ciudad, provincia, país...' }: Props) {
  const [text, setText] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value) setText('');
  }, [value]);

  useEffect(() => {
    if (value || text.length < 3) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await lugaresApi.nominatim(text));
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [text, value]);

  async function handleSelect(r: NominatimResult) {
    setResults([]);
    setText('');
    const lugar = await lugaresApi.create({ ciudad: r.ciudad, provincia: r.provincia, pais: r.pais, latitud: r.lat, longitud: r.lon });
    onChange(lugar);
  }

  if (value) {
    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 0, width: '100%' }}>
        <div style={{ ...inp, flex: 1, color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{formatLugar(value)}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', fontSize: '1rem', padding: '0 2px', lineHeight: 1 }}>
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        style={inp}
      />
      {loading && (
        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#999' }}>
          Buscando...
        </span>
      )}
      {!loading && results.length > 0 && (
        <div style={dropdown}>
          {results.map((r, i) => (
            <div key={i} style={item} onClick={() => handleSelect(r)}>
              {r.display}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = { padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' };
const dropdown: React.CSSProperties = {
  position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
  border: '1px solid #ccc', borderRadius: 4, zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};
const item: React.CSSProperties = { padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '0.9rem' };

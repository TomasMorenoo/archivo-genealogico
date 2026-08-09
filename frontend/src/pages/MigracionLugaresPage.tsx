import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { lugaresApi } from '../api/client';
import type { NominatimResult } from '../api/client';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });

interface PropuestoData {
  ciudad: string;
  provincia: string | null;
  pais: string;
  lat: number;
  lon: number;
}

interface MigracionItem {
  id: number;
  actual: { ciudad: string; provincia: string | null; pais: string };
  propuesto: PropuestoData | null;
  cambia: boolean;
}

function fmtLugar(l: { ciudad: string; provincia: string | null; pais: string } | null) {
  if (!l) return '—';
  return [l.ciudad, l.provincia, l.pais].filter(Boolean).join(', ');
}

function InlineSearch({ onSelect, onCancel }: {
  onSelect: (r: PropuestoData) => void;
  onCancel: () => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (q.length < 3) { setResults([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await lugaresApi.nominatim(q));
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [q]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar lugar..."
          style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.83rem', width: 200 }}
        />
        <button onClick={onCancel} style={iconBtn} title="Cancelar">✕</button>
      </div>
      {loading && <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 2 }}>Buscando...</div>}
      {results.length > 0 && (
        <div style={searchDropdown}>
          {results.map((r, i) => (
            <div key={i}
              onClick={() => onSelect({ ciudad: r.ciudad, provincia: r.provincia, pais: r.pais, lat: r.lat, lon: r.lon })}
              style={searchItem}
            >
              {r.display}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MigracionLugaresPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MigracionItem[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [overrides, setOverrides] = useState<Record<number, PropuestoData>>({});
  const [editing, setEditing] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);

  async function analizar() {
    setLoading(true);
    setDone(false);
    setItems(null);
    setSelected(new Set());
    setOverrides({});
    setEditing(new Set());
    try {
      const res = await api.get<MigracionItem[]>('/lugares/migrate');
      setItems(res.data);
      setSelected(new Set(res.data.filter(i => i.cambia).map(i => i.id)));
    } finally {
      setLoading(false);
    }
  }

  async function aplicar() {
    if (!items) return;
    setApplying(true);
    try {
      const payload = Array.from(selected).map(id => {
        const override = overrides[id];
        if (override) return { id, ...override };
        const item = items.find(i => i.id === id)!;
        return { id, ...item.propuesto! };
      });
      await api.post('/lugares/migrate', { items: payload });
      setDone(true);
    } finally {
      setApplying(false);
    }
  }

  function getEffectivePropuesto(item: MigracionItem): PropuestoData | null {
    return overrides[item.id] ?? item.propuesto;
  }

  function dismissPropuesto(id: number) {
    setEditing(prev => { const n = new Set(prev); n.add(id); return n; });
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  function applyOverride(id: number, data: PropuestoData) {
    setOverrides(prev => ({ ...prev, [id]: data }));
    setEditing(prev => { const n = new Set(prev); n.delete(id); return n; });
    setSelected(prev => { const n = new Set(prev); n.add(id); return n; });
  }

  function cancelEdit(id: number, item: MigracionItem) {
    setEditing(prev => { const n = new Set(prev); n.delete(id); return n; });
    if (overrides[id] || item.propuesto) {
      setSelected(prev => { const n = new Set(prev); n.add(id); return n; });
    }
  }

  const allChanges = items?.filter(i => getEffectivePropuesto(i) !== null) ?? [];
  const allSelected = allChanges.length > 0 && allChanges.every(i => selected.has(i.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allChanges.map(i => i.id)));
  }

  function toggleItem(id: number) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button type="button" onClick={() => navigate('/')} style={btnSecondary}>← Volver</button>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Normalizar lugares existentes</h1>
      </div>

      <p style={{ color: '#555', marginBottom: 16, fontSize: '0.9rem' }}>
        Consulta Nominatim para normalizar los lugares almacenados. Podés rechazar una propuesta con ✕ y buscar un lugar alternativo.
      </p>

      <button type="button" onClick={analizar} disabled={loading} style={btnPrimary}>
        {loading ? 'Analizando...' : 'Analizar'}
      </button>

      {loading && (
        <div style={{ marginTop: 20, color: '#555', fontSize: '0.9rem' }}>
          Consultando Nominatim, esto puede tardar unos minutos...
        </div>
      )}

      {items && !loading && (
        <>
          <div style={{ marginTop: 24, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={th}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} title="Seleccionar todos" />
                  </th>
                  <th style={th}>Actual</th>
                  <th style={th}>Propuesto</th>
                  <th style={th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const effective = getEffectivePropuesto(item);
                  const isEditing = editing.has(item.id);
                  const hasOverride = !!overrides[item.id];
                  const cambia = effective !== null && (
                    effective.ciudad !== item.actual.ciudad ||
                    effective.provincia !== item.actual.provincia ||
                    effective.pais !== item.actual.pais
                  );
                  const estado = isEditing
                    ? { label: 'Eligiendo...', color: '#92400e', bg: '#fef3c7' }
                    : effective === null
                      ? { label: 'No encontrado', color: '#b45309', bg: '#fef3c7' }
                      : cambia
                        ? { label: hasOverride ? 'Cambio manual' : 'Cambio sugerido', color: '#1d4ed8', bg: hasOverride ? '#ede9fe' : '#dbeafe' }
                        : { label: 'Sin cambios', color: '#6b7280', bg: '#f3f4f6' };

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ ...td, textAlign: 'center' }}>
                        {!isEditing && effective && (
                          <input
                            type="checkbox"
                            checked={selected.has(item.id)}
                            onChange={() => toggleItem(item.id)}
                          />
                        )}
                      </td>
                      <td style={td}>{fmtLugar(item.actual)}</td>
                      <td style={{ ...td, minWidth: 220 }}>
                        {isEditing ? (
                          <InlineSearch
                            onSelect={r => applyOverride(item.id, r)}
                            onCancel={() => cancelEdit(item.id, item)}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{fmtLugar(effective)}</span>
                            {effective && (
                              <button
                                onClick={() => dismissPropuesto(item.id)}
                                style={dismissBtn}
                                title="Elegir otro lugar"
                              >✕</button>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={td}>
                        <span style={{ padding: '2px 8px', borderRadius: 10, background: estado.bg, color: estado.color, fontWeight: 600, fontSize: '0.8rem' }}>
                          {estado.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16 }}>
            {done ? (
              <div style={{ padding: '10px 14px', background: '#e6f4ea', border: '1px solid #b7dfbf', borderRadius: 6, color: '#2d6a3f', fontWeight: 600 }}>
                Listo — cambios aplicados.
              </div>
            ) : selected.size > 0 ? (
              <button type="button" onClick={aplicar} disabled={applying} style={btnPrimary}>
                {applying ? 'Aplicando...' : `Aplicar seleccionados (${selected.size})`}
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' };
const btnSecondary: React.CSSProperties = { background: 'none', color: '#333', border: '1px solid #ccc', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: '0.9rem' };
const th: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' };
const td: React.CSSProperties = { padding: '8px 12px', verticalAlign: 'middle' };
const dismissBtn: React.CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', color: '#bbb', fontSize: '0.8rem', padding: '1px 4px', lineHeight: 1, flexShrink: 0 };
const iconBtn: React.CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', color: '#999', fontSize: '0.85rem', padding: '2px 4px' };
const searchDropdown: React.CSSProperties = {
  position: 'absolute', top: '100%', left: 0, zIndex: 30,
  background: '#fff', border: '1px solid #ddd', borderRadius: 4,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: 340, maxHeight: 220, overflowY: 'auto',
};
const searchItem: React.CSSProperties = { padding: '7px 10px', cursor: 'pointer', fontSize: '0.83rem', borderBottom: '1px solid #f0f0f0' };

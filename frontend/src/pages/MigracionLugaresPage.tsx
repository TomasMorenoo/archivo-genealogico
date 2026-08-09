import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });

interface MigracionItem {
  id: number;
  actual: { ciudad: string; provincia: string | null; pais: string };
  propuesto: { ciudad: string; provincia: string | null; pais: string; lat: number; lon: number } | null;
  cambia: boolean;
}

function fmtLugar(l: { ciudad: string; provincia: string | null; pais: string } | null) {
  if (!l) return '—';
  return [l.ciudad, l.provincia, l.pais].filter(Boolean).join(', ');
}

export default function MigracionLugaresPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MigracionItem[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);

  async function analizar() {
    setLoading(true);
    setDone(false);
    setItems(null);
    setSelected(new Set());
    try {
      const res = await api.get<MigracionItem[]>('/lugares/migrate');
      setItems(res.data);
      const cambios = new Set(res.data.filter(i => i.cambia).map(i => i.id));
      setSelected(cambios);
    } finally {
      setLoading(false);
    }
  }

  async function aplicar() {
    setApplying(true);
    try {
      await api.post('/lugares/migrate', { ids: Array.from(selected) });
      setDone(true);
    } finally {
      setApplying(false);
    }
  }

  const allChanges = items?.filter(i => i.propuesto) ?? [];
  const allSelected = allChanges.length > 0 && allChanges.every(i => selected.has(i.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allChanges.map(i => i.id)));
    }
  }

  function toggleItem(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button type="button" onClick={() => navigate('/')} style={btnSecondary}>
          ← Volver
        </button>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Normalizar lugares existentes</h1>
      </div>

      <p style={{ color: '#555', marginBottom: 16, fontSize: '0.9rem' }}>
        Consulta Nominatim para normalizar los lugares almacenados en la base de datos.
      </p>

      <button type="button" onClick={analizar} disabled={loading} style={btnPrimary}>
        {loading ? 'Analizando...' : 'Analizar'}
      </button>

      {loading && (
        <div style={{ marginTop: 20, color: '#555', fontSize: '0.9rem' }}>
          Consultando Nominatim, esto puede tardar unos minutos...
        </div>
      )}

      {done && (
        <div style={{ marginTop: 16, padding: '10px 14px', background: '#e6f4ea', border: '1px solid #b7dfbf', borderRadius: 6, color: '#2d6a3f', fontWeight: 600 }}>
          Listo — cambios aplicados.
        </div>
      )}

      {items && !loading && (
        <>
          <div style={{ marginTop: 24, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={th}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      title="Seleccionar todos los cambios"
                    />
                  </th>
                  <th style={th}>Actual</th>
                  <th style={th}>Propuesto</th>
                  <th style={th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const estado = item.propuesto === null
                    ? { label: 'No encontrado', color: '#b45309', bg: '#fef3c7' }
                    : item.cambia
                      ? { label: 'Cambio sugerido', color: '#1d4ed8', bg: '#dbeafe' }
                      : { label: 'Sin cambios', color: '#6b7280', bg: '#f3f4f6' };
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ ...td, textAlign: 'center' }}>
                        {item.propuesto && (
                          <input
                            type="checkbox"
                            checked={selected.has(item.id)}
                            onChange={() => toggleItem(item.id)}
                          />
                        )}
                      </td>
                      <td style={td}>{fmtLugar(item.actual)}</td>
                      <td style={td}>{fmtLugar(item.propuesto)}</td>
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

          {selected.size > 0 && (
            <div style={{ marginTop: 16 }}>
              <button type="button" onClick={aplicar} disabled={applying} style={btnPrimary}>
                {applying ? 'Aplicando...' : `Aplicar seleccionados (${selected.size})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' };
const btnSecondary: React.CSSProperties = { background: 'none', color: '#333', border: '1px solid #ccc', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: '0.9rem' };
const th: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' };
const td: React.CSSProperties = { padding: '8px 12px', verticalAlign: 'middle' };

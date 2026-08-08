import { useState, useEffect, useRef } from 'react';
import { personasApi } from '../../api/client';
import type { PersonaListItem, Persona } from '../../types';
import PersonaForm from '../PersonaForm/PersonaForm';

interface Props {
  label?: string;
  excludeIds?: number[];
  onSelect: (p: PersonaListItem) => void;
  placeholder?: string;
  defaultSexo?: 'M' | 'F' | 'otro';
  maxNacAnio?: number | null;
}

export default function PersonaSearchInput({ label, excludeIds = [], onSelect, placeholder = 'Buscar persona...', defaultSexo, maxNacAnio }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<PersonaListItem[]>([]);
  const [creandoNueva, setCreandoNueva] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (busqueda.length < 2) { setResultados([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const r = await personasApi.list(busqueda, maxNacAnio ?? undefined);
      setResultados(r.filter(p => !excludeIds.includes(p.id)));
    }, 200);
  }, [busqueda, excludeIds, maxNacAnio]);

  async function handleCrearNueva(data: Partial<Persona>) {
    const nueva = await personasApi.create(data);
    onSelect({ id: nueva.id, pid: nueva.pid, nombre: nueva.nombre, apellido: nueva.apellido,
      nac_dia: nueva.nac_dia, nac_mes: nueva.nac_mes, nac_anio: nueva.nac_anio, nac_tipo: nueva.nac_tipo,
      def_dia: nueva.def_dia, def_mes: nueva.def_mes, def_anio: nueva.def_anio, def_tipo: nueva.def_tipo,
      fallecida: nueva.fallecida });
    setCreandoNueva(false);
    setBusqueda('');
  }

  if (creandoNueva) {
    return (
      <div style={{ padding: 12, background: '#f9f9f9', borderRadius: 6, border: '1px solid #ddd' }}>
        <p style={{ marginBottom: 10, fontSize: '0.85rem', color: '#666' }}>Crear nueva persona</p>
        <PersonaForm asDiv initial={{ sexo: defaultSexo ?? 'M' }} onSave={handleCrearNueva} onCancel={() => setCreandoNueva(false)} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {label && <label style={{ fontSize: '0.85rem', color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>}
      <input
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder={placeholder}
        style={inp}
      />
      {busqueda.length >= 2 && (
        <div style={dropdown}>
          {resultados.map(p => (
            <div key={p.id} style={item} onClick={() => { onSelect(p); setBusqueda(''); setResultados([]); }}>
              <code style={{ color: '#888', fontSize: '0.78em' }}>{p.pid}</code>{' '}
              {p.apellido}, {p.nombre}{p.nac_anio ? ` (${p.nac_anio})` : ''}
            </div>
          ))}
          <div style={{ ...item, color: '#0070f3', fontWeight: 600 }} onClick={() => setCreandoNueva(true)}>
            + Crear nueva persona
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

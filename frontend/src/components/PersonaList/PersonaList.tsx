import { useNavigate } from 'react-router-dom';
import type { PersonaListItem } from '../../types';

interface Props {
  personas: PersonaListItem[];
}

function formatFechaCorta(dia: number | null, mes: number | null, anio: number | null, tipo: string): string {
  if (tipo === 'aproximada' && anio) return `aprox. ${anio}`;
  if (tipo === 'desconocida') return '—';
  if (dia && mes && anio) return `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${anio}`;
  if (anio) return String(anio);
  return '—';
}

export default function PersonaList({ personas }: Props) {
  const navigate = useNavigate();
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
          <th style={thStyle}>ID</th>
          <th style={thStyle}>Apellido, Nombre</th>
          <th style={thStyle}>Nacimiento</th>
          <th style={thStyle}>Estado</th>
        </tr>
      </thead>
      <tbody>
        {personas.map(p => (
          <tr
            key={p.id}
            onClick={() => navigate(`/persona/${p.id}`)}
            style={rowStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#eee')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <td style={tdStyle}>
              <code style={{ color: '#666', fontSize: '0.85em' }}>{p.pid}</code>
            </td>
            <td style={tdStyle}><strong>{p.apellido}</strong>, {p.nombre}</td>
            <td style={tdStyle}>{formatFechaCorta(p.nac_dia, p.nac_mes, p.nac_anio, p.nac_tipo)}</td>
            <td style={tdStyle}>
              {p.fallecida
                ? <span style={{ color: '#666' }}>{formatFechaCorta(p.def_dia, p.def_mes, p.def_anio, p.def_tipo)}</span>
                : <span style={{ color: '#2a9d2a', fontWeight: 500 }}>Vivo/a</span>
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const thStyle: React.CSSProperties = { padding: '8px 12px', fontWeight: 600, color: '#555' };
const tdStyle: React.CSSProperties = { padding: '8px 12px', borderBottom: '1px solid #e0e0e0' };
const rowStyle: React.CSSProperties = { cursor: 'pointer', transition: 'background 0.1s' };

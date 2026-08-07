import { useNavigate } from 'react-router-dom';
import type { PersonaListItem } from '../../types';

interface Props {
  personas: PersonaListItem[];
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
            <td style={tdStyle}>{p.nac_anio ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const thStyle: React.CSSProperties = { padding: '8px 12px', fontWeight: 600, color: '#555' };
const tdStyle: React.CSSProperties = { padding: '8px 12px', borderBottom: '1px solid #e0e0e0' };
const rowStyle: React.CSSProperties = { cursor: 'pointer', transition: 'background 0.1s' };

import { CHANGELOG } from '../../data/changelog';

interface Props {
  lastSeenId: number;
  onClose: () => void;
}

export default function WhatsNew({ lastSeenId, onClose }: Props) {
  const entries = lastSeenId === 0
    ? CHANGELOG
    : CHANGELOG.filter(e => e.id > lastSeenId);

  if (entries.length === 0) return null;

  const allSections = entries.flatMap(e => e.sections);

  return (
    <div style={overlay}>
      <div style={dialog}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: 4 }}>
            {lastSeenId === 0 ? 'Historial de novedades' : 'Actualización instalada'}
          </p>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Novedades</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {allSections.map((s, i) => (
            <div key={i}>
              <p style={{ fontWeight: 600, marginBottom: 6, color: '#333' }}>{s.title}</p>
              <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {s.items.map((item, j) => (
                  <li key={j} style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.5 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={btn}>Entendido</button>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
};
const dialog: React.CSSProperties = {
  background: '#fff', borderRadius: 10, padding: 28, width: '100%', maxWidth: 460,
  maxHeight: '85vh', overflowY: 'auto',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
};
const btn: React.CSSProperties = {
  marginTop: 24, width: '100%', background: '#1a1a1a', color: '#fff',
  border: 'none', padding: '10px 0', borderRadius: 5, cursor: 'pointer',
  fontWeight: 600, fontSize: '0.95rem',
};

import { useState } from 'react';
import { CHANGELOG } from '../../data/changelog';

interface Props {
  lastSeenId: number; // 0 = show all (from menu)
  onClose: () => void;
}

export default function WhatsNew({ lastSeenId, onClose }: Props) {
  const entries = lastSeenId === 0
    ? [...CHANGELOG].reverse()
    : [...CHANGELOG].filter(e => e.id > lastSeenId).reverse();

  const [idx, setIdx] = useState(0); // 0 = most recent

  if (entries.length === 0) return null;

  const entry = entries[idx];
  const isFirst = idx === 0;
  const isLast = idx === entries.length - 1;

  return (
    <div style={overlay}>
      <div style={dialog}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: 4 }}>
            {lastSeenId === 0 ? 'Historial de novedades' : 'Actualización instalada'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, flex: 1 }}>
              Novedades · {entry.label}
            </h2>
            {entries.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => setIdx(i => i + 1)}
                  disabled={isLast}
                  style={{ ...navBtn, opacity: isLast ? 0.3 : 1 }}
                  title="Versión anterior"
                >←</button>
                <span style={{ fontSize: '0.75rem', color: '#aaa', minWidth: 36, textAlign: 'center' }}>
                  {idx + 1}/{entries.length}
                </span>
                <button
                  onClick={() => setIdx(i => i - 1)}
                  disabled={isFirst}
                  style={{ ...navBtn, opacity: isFirst ? 0.3 : 1 }}
                  title="Versión siguiente"
                >→</button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {entry.sections.map((s, i) => (
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

        <button onClick={onClose} style={btn}>
          {isFirst ? 'Entendido' : 'Cerrar'}
        </button>
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
const navBtn: React.CSSProperties = {
  border: '1px solid #ddd', background: '#f5f5f5', borderRadius: 4,
  padding: '3px 10px', cursor: 'pointer', fontSize: '0.9rem', color: '#444',
};

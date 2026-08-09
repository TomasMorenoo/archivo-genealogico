interface Entry {
  title: string;
  items: string[];
}

const CHANGELOG: Record<string, Entry[]> = {
  // Agregá acá las novedades de cada versión. La clave es el número de versión exacto.
  'default': [
    {
      title: 'Mejoras generales',
      items: ['Correcciones de errores y mejoras de rendimiento.'],
    },
  ],
};

function getEntries(version: string): Entry[] {
  return CHANGELOG[version] ?? CHANGELOG['default'];
}

interface Props {
  version: string;
  onClose: () => void;
}

export default function WhatsNew({ version, onClose }: Props) {
  const entries = getEntries(version);

  return (
    <div style={overlay}>
      <div style={dialog}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: 4 }}>Actualización instalada</p>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Novedades en v{version}</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {entries.map((e, i) => (
            <div key={i}>
              <p style={{ fontWeight: 600, marginBottom: 6, color: '#333' }}>{e.title}</p>
              <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {e.items.map((item, j) => (
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
  background: '#fff', borderRadius: 10, padding: 28, width: '100%', maxWidth: 440,
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
};
const btn: React.CSSProperties = {
  marginTop: 24, width: '100%', background: '#1a1a1a', color: '#fff',
  border: 'none', padding: '10px 0', borderRadius: 5, cursor: 'pointer',
  fontWeight: 600, fontSize: '0.95rem',
};

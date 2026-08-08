import { useState } from 'react';

interface Props {
  onSetup: () => void;
}

export default function SetupPage({ onSetup }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect() {
    if (!window.electronAPI) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.selectArchivoRoot();
      if (!result) {
        setError('No se seleccionó ninguna carpeta.');
        setLoading(false);
        return;
      }
      // If result is set, app.relaunch() fires — no further action needed here.
    } catch {
      setError('Error al seleccionar la carpeta.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '24px',
      fontFamily: 'system-ui, sans-serif',
      background: '#f9f9f9',
    }}>
      <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Archivo Genealógico Familiar</h1>
      <p style={{ margin: 0, color: '#555', maxWidth: 420, textAlign: 'center' }}>
        Elegí la carpeta donde se guardará tu archivo genealógico.
        Se creará automáticamente la estructura <code>Personas/</code> y <code>BaseDeDatos/</code> dentro de ella.
      </p>
      <button
        onClick={handleSelect}
        disabled={loading}
        style={{
          padding: '12px 28px',
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
        }}
      >
        {loading ? 'Seleccionando…' : 'Elegir carpeta'}
      </button>
      {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
    </div>
  );
}

interface Entry {
  title: string;
  items: string[];
}

const CHANGELOG: Record<string, Entry[]> = {
  // Clave = versión exacta que muestra el CI (ej. '1.0.42'). 'default' se usa si no hay entrada específica.
  'default': [
    {
      title: 'Documentos',
      items: [
        'Nuevo diseño de sección de documentos: tarjetas colapsables con flechita desplegable.',
        'Previsualización de PDF e imágenes directamente en el perfil.',
        'El formulario ahora pide el Tipo como campo principal; el Título solo aparece si elegís "Otro".',
        'Las personas mencionadas en un documento pueden abrirlo desde su propio perfil.',
        'La persona del perfil aparece pre-seleccionada como principal al crear un documento.',
      ],
    },
    {
      title: 'Relaciones',
      items: [
        'Soporte para múltiples cónyuges.',
        'Cónyuge siempre visible en la sección de relaciones del perfil.',
        'Al buscar padre/madre, se filtra automáticamente por personas nacidas antes que la persona que estás cargando.',
        'Los hijos se ordenan por año de nacimiento (mayor arriba) y se muestra el año junto al nombre.',
        'Se crea automáticamente la relación de hermano/hermana cuando dos personas comparten un padre.',
      ],
    },
    {
      title: 'Personas',
      items: [
        'Al eliminar una persona, su carpeta de Windows también se elimina y las demás se renumeran.',
        'Si una persona está fallecida pero sin fecha, el índice muestra "Fallecido/a".',
        'Solo el país es obligatorio al cargar un lugar.',
      ],
    },
    {
      title: 'Mejoras generales',
      items: [
        'La app ahora cierra correctamente al instalar actualizaciones (ya no quedan procesos en segundo plano).',
        'Diseño responsive: la ventana puede achicarse hasta 400px de ancho.',
        'Textos y etiquetas con mejor contraste para pantallas HD.',
        'Menú Ayuda → Novedades para ver este cartel cuando quieras.',
      ],
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
  background: '#fff', borderRadius: 10, padding: 28, width: '100%', maxWidth: 460,
  maxHeight: '85vh', overflowY: 'auto',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
};
const btn: React.CSSProperties = {
  marginTop: 24, width: '100%', background: '#1a1a1a', color: '#fff',
  border: 'none', padding: '10px 0', borderRadius: 5, cursor: 'pointer',
  fontWeight: 600, fontSize: '0.95rem',
};

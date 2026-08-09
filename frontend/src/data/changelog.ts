export interface ChangelogSection {
  title: string;
  items: string[];
}

export interface ChangelogEntry {
  id: number;
  label: string; // short label shown in nav, e.g. "v1.0.35" or "Ago 2026"
  sections: ChangelogSection[];
}

// One entry per meaningful release. Each entry = ONLY what changed in that update.
// Never accumulate old entries — add a NEW entry each time.
// Bump CURRENT_CHANGELOG_ID in main.ts to match the last id here.
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: 1,
    label: 'v1.0.35',
    sections: [
      {
        title: 'Documentos',
        items: [
          'Nuevo diseño de sección: tarjetas colapsables con flechita desplegable.',
          'Previsualización de PDF e imágenes directamente en el perfil.',
          'Tipo como campo principal; Título aparece solo si elegís "Otro".',
          'Personas mencionadas pueden abrir el documento desde su propio perfil.',
          'Persona del perfil pre-seleccionada como principal al crear un documento.',
        ],
      },
      {
        title: 'Relaciones',
        items: [
          'Soporte para múltiples cónyuges.',
          'Cónyuge siempre visible en el perfil.',
          'Al buscar padre/madre se filtra por personas nacidas antes.',
          'Hijos y hermanos ordenados por año de nacimiento.',
          'Relación de hermano/hermana creada automáticamente al compartir padre.',
        ],
      },
      {
        title: 'Personas',
        items: [
          'Al eliminar una persona su carpeta Windows se elimina y las demás se renumeran.',
          'Fallecida sin fecha muestra "Fallecido/a" en el índice.',
          'Solo el país es obligatorio al cargar un lugar.',
          'Nuevo campo DNI en el perfil.',
        ],
      },
      {
        title: 'Mejoras generales',
        items: [
          'La app cierra correctamente al instalar actualizaciones.',
          'Buscador de lugares con autocompletado via Nominatim.',
          'Herramienta para normalizar lugares existentes (Ayuda → Normalizar lugares).',
        ],
      },
    ],
  },
  {
    id: 2,
    label: 'v1.0.40',
    sections: [
      {
        title: 'Normalización de lugares',
        items: [
          'Podés rechazar la propuesta de Nominatim con ✕ y buscar un lugar alternativo vos mismo.',
          'Aplicar cambios es ahora instantáneo — ya no re-consulta Nominatim al guardar.',
        ],
      },
      {
        title: 'Novedades',
        items: [
          'Este cartel ahora es dinámico: cada actualización muestra exactamente qué cambió.',
          'Flechitas ← → para navegar entre versiones anteriores sin perderte nada.',
        ],
      },
    ],
  },
];

export const CURRENT_CHANGELOG_ID = CHANGELOG[CHANGELOG.length - 1].id;

export interface ChangelogSection {
  title: string;
  items: string[];
}

export interface ChangelogEntry {
  id: number;
  label: string; // short label shown in nav, e.g. "v1.0.35" or "Ago 2026"
  channel?: 'stable' | 'beta'; // default = 'stable'
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
  {
    id: 3,
    label: 'Beta – Árbol v1.1',
    channel: 'beta',
    sections: [
      {
        title: 'Árbol genealógico',
        items: [
          'Nueva sección: árbol de ancestros hasta 5 generaciones.',
          'Vista vertical (de abajo para arriba) y horizontal.',
          'Alternás entre árbol biológico y adoptivo.',
          'Tarjetas con nombre, apellido y fechas de vida.',
          'La raíz seleccionada y las preferencias de vista se recuerdan entre sesiones.',
        ],
      },
    ],
  },
  {
    id: 4,
    label: 'Beta – Árbol v1.2',
    channel: 'beta',
    sections: [
      {
        title: 'Árbol genealógico',
        items: [
          'Guardar como PDF: exportá el árbol en alta definición (calidad vectorial para imprimir).',
          'Elegí el tamaño de hoja (A4 a A0), orientación y márgenes antes de guardar.',
          'Vista previa del árbol dentro de la hoja con indicador de escala.',
        ],
      },
      {
        title: 'Instalación',
        items: [
          'La beta y la oficial ahora pueden convivir instaladas al mismo tiempo sin pisarse.',
        ],
      },
    ],
  },
];

export const CURRENT_CHANGELOG_ID = CHANGELOG[CHANGELOG.length - 1].id;

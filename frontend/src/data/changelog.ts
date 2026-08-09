export interface ChangelogSection {
  title: string;
  items: string[];
}

export interface ChangelogEntry {
  id: number;
  sections: ChangelogSection[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: 1,
    sections: [
      {
        title: 'Documentos',
        items: [
          'Nuevo diseño de sección: tarjetas colapsables con flechita desplegable.',
          'Previsualización de PDF e imágenes directamente en el perfil.',
          'El formulario ahora pide el Tipo como campo principal; el Título solo aparece si elegís "Otro".',
          'Las personas mencionadas pueden abrir el documento desde su propio perfil.',
          'La persona del perfil aparece pre-seleccionada como principal al crear un documento.',
        ],
      },
      {
        title: 'Relaciones',
        items: [
          'Soporte para múltiples cónyuges.',
          'Cónyuge siempre visible en el perfil.',
          'Al buscar padre/madre se filtra automáticamente por personas nacidas antes.',
          'Los hijos y hermanos se ordenan por año de nacimiento y se muestra el año.',
          'Se crea automáticamente la relación de hermano/hermana al compartir un padre.',
        ],
      },
      {
        title: 'Personas',
        items: [
          'Al eliminar una persona su carpeta Windows también se elimina y las demás se renumeran.',
          'Si está fallecida sin fecha, el índice muestra "Fallecido/a".',
          'Solo el país es obligatorio al cargar un lugar.',
          'Nuevo campo DNI en el perfil.',
        ],
      },
      {
        title: 'Mejoras generales',
        items: [
          'La app cierra correctamente al instalar actualizaciones.',
          'Menú Ayuda → Novedades para ver este cartel cuando quieras.',
          'Buscador de lugares con autocompletado via Nominatim (OpenStreetMap).',
          'Herramienta para normalizar lugares existentes en la base de datos.',
        ],
      },
    ],
  },
  {
    id: 2,
    sections: [
      {
        title: 'Árbol genealógico',
        items: [
          'Nueva vista Árbol: pedigree horizontal hasta 5 generaciones hacia arriba.',
          'Accedé desde el botón "Árbol →" en el índice.',
          'Cada tarjeta es clickeable para ir directamente al perfil de esa persona.',
        ],
      },
      {
        title: 'Normalización de lugares',
        items: [
          'Al revisar propuestas de Nominatim podés rechazar la sugerencia con ✕ y buscar un lugar alternativo vos mismo.',
          'Aplicar cambios ahora es instantáneo (ya no re-consulta Nominatim al guardar).',
        ],
      },
    ],
  },
];

export const CURRENT_CHANGELOG_ID = CHANGELOG[CHANGELOG.length - 1].id;

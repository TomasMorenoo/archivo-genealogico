export type Sexo = 'M' | 'F' | 'otro';
export type FechaTipo = 'exacta' | 'solo_anio' | 'aproximada' | 'desconocida';

export interface Lugar {
  id: number;
  ciudad: string;
  provincia: string | null;
  pais: string;
}

export interface FechaInput {
  dia: number | null;
  mes: number | null;
  anio: number | null;
  tipo: FechaTipo;
}

export interface PersonaListItem {
  id: number;
  pid: string;
  nombre: string;
  apellido: string;
  nac_dia: number | null;
  nac_mes: number | null;
  nac_anio: number | null;
  nac_tipo: string;
  def_dia: number | null;
  def_mes: number | null;
  def_anio: number | null;
  def_tipo: string;
  fallecida: boolean;
}

export interface Persona {
  id: number;
  pid: string;
  nombre: string;
  apellido: string;
  sexo: Sexo;
  nac_dia: number | null;
  nac_mes: number | null;
  nac_anio: number | null;
  nac_tipo: FechaTipo;
  nac_lugar: Lugar | null;
  nac_lugar_id?: number | null;
  def_dia: number | null;
  def_mes: number | null;
  def_anio: number | null;
  def_tipo: FechaTipo;
  def_lugar: Lugar | null;
  def_lugar_id?: number | null;
  historia: string;
  fallecida: boolean;
  foto_ruta: string | null;
  dni: string | null;
}

export interface TipoRelacion {
  id: number;
  nombre: string;
  inverso_id: number | null;
}

export interface Relacion {
  id: number;
  tipo_relacion_id: number;
  tipo_relacion_nombre: string;
  persona_destino_id: number;
  persona_destino_pid: string;
  persona_destino_nombre: string;
  persona_destino_nac_anio: number | null;
}

export interface DocumentoPersona {
  persona_id: number;
  persona_pid: string;
  persona_nombre: string;
  rol: 'principal' | 'mencionada';
}

export interface Documento {
  id: number;
  did: string;
  titulo: string;
  tipo: string;
  doc_dia: number | null;
  doc_mes: number | null;
  doc_anio: number | null;
  doc_fecha_tipo: FechaTipo;
  descripcion: string;
  ruta: string | null;
  nombre_original: string | null;
  creado_en: string;
  personas: DocumentoPersona[];
}

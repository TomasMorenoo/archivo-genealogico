import axios from 'axios';
import type { PersonaListItem, Persona, Relacion, TipoRelacion, Documento, Lugar, AncestorNode } from '../types';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });

export const personasApi = {
  list: (q?: string, maxNacAnio?: number) =>
    api.get<PersonaListItem[]>('/personas', { params: { ...(q ? { q } : {}), ...(maxNacAnio ? { max_nac_anio: maxNacAnio } : {}) } }).then(r => r.data),
  get: (id: number) =>
    api.get<Persona>(`/personas/${id}`).then(r => r.data),
  create: (data: Partial<Persona>) =>
    api.post<Persona>('/personas', data).then(r => r.data),
  update: (id: number, data: Partial<Persona>) =>
    api.put<Persona>(`/personas/${id}`, data).then(r => r.data),
  delete: (id: number) =>
    api.delete(`/personas/${id}`),
  ancestros: (id: number, generaciones = 5, view: 'bio' | 'adoptivo' = 'bio') =>
    api.get<AncestorNode>(`/personas/${id}/ancestros`, { params: { generaciones, view } }).then(r => r.data),
  descendientes: (id: number) =>
    api.get<{ pareja?: import('../types').SiblingNode; hijos: import('../types').SiblingNode[] }>(`/personas/${id}/descendientes`).then(r => r.data),
};

export const relacionesApi = {
  tipos: () =>
    api.get<TipoRelacion[]>('/relaciones/tipos').then(r => r.data),
  dePersona: (id: number) =>
    api.get<Relacion[]>(`/relaciones/persona/${id}`).then(r => r.data),
  add: (data: { persona_origen_id: number; tipo_relacion_id: number; persona_destino_id: number }) =>
    api.post('/relaciones', data),
  delete: (id: number) =>
    api.delete(`/relaciones/${id}`),
};

export const documentosApi = {
  dePersona: (personaId: number) =>
    api.get<{ principales: Documento[]; mencionada: Documento[] }>(
      `/documentos/persona/${personaId}`
    ).then(r => r.data),
  get: (id: number) =>
    api.get<Documento>(`/documentos/${id}`).then(r => r.data),
  create: (data: {
    titulo: string;
    tipo: string;
    doc_dia?: number | null;
    doc_mes?: number | null;
    doc_anio?: number | null;
    doc_fecha_tipo?: string;
    descripcion?: string;
    personasPrincipales: number[];
    personasMencionadas?: number[];
  }) => api.post<Documento>('/documentos', data).then(r => r.data),
  uploadArchivo: (docId: number, file: File) => {
    const fd = new FormData();
    fd.append('archivo', file);
    return api.post<Documento>(`/documentos/${docId}/archivo`, fd).then(r => r.data);
  },
  update: (id: number, data: Partial<{
    titulo: string; tipo: string; descripcion: string;
    personasPrincipales: number[]; personasMencionadas: number[];
  }>) => api.put<Documento>(`/documentos/${id}`, data).then(r => r.data),
  delete: (id: number) =>
    api.delete(`/documentos/${id}`),
};

export interface NominatimResult {
  ciudad: string;
  provincia: string | null;
  pais: string;
  lat: number;
  lon: number;
  display: string;
}

export const configApi = {
  get: (clave: string) =>
    api.get<string | null>(`/config/${clave}`).then(r => r.data),
  set: (clave: string, valor: string | null) =>
    api.put(`/config/${clave}`, { valor }),
};

export const lugaresApi = {
  search: (q: string) =>
    api.get<Lugar[]>('/lugares/search', { params: { q } }).then(r => r.data),
  create: (data: { ciudad: string; provincia?: string | null; pais: string; latitud?: number; longitud?: number }) =>
    api.post<Lugar>('/lugares', data).then(r => r.data),
  nominatim: (q: string) =>
    api.get<NominatimResult[]>('/lugares/nominatim', { params: { q } }).then(r => r.data),
};

import fs from 'fs';
import path from 'path';
import type { Persona, Relacion, Documento } from '../types';

export function getDataRoot(): string {
  const root = process.env.ARCHIVO_ROOT;
  if (!root) {
    return path.join(process.cwd(), '..', 'Archivo_Genealogico');
  }
  return root;
}

export function formatDid(id: number): string {
  return `D${String(id).padStart(5, '0')}`;
}

function sanitizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function personaFolderName(persona: { id: number; nombre: string; apellido: string }): string {
  const pid = `P${String(persona.id).padStart(5, '0')}`;
  return `${pid}_${sanitizeName(persona.apellido)}_${sanitizeName(persona.nombre)}`;
}

export function personaFolderPath(persona: { id: number; nombre: string; apellido: string }): string {
  return path.join(getDataRoot(), 'Personas', personaFolderName(persona));
}

export function ensurePersonaFolder(persona: { id: number; nombre: string; apellido: string }): string {
  const folderPath = personaFolderPath(persona);
  fs.mkdirSync(path.join(folderPath, 'Documentos'), { recursive: true });
  fs.mkdirSync(path.join(folderPath, 'Fotos'), { recursive: true });
  return folderPath;
}

export function documentoFileName(docId: number, titulo: string, originalExt: string): string {
  const did = formatDid(docId);
  const safe = sanitizeName(titulo).slice(0, 40);
  return `${did}_${safe}${originalExt}`;
}

function formatFecha(dia: number | null, mes: number | null, anio: number | null, tipo: string): string {
  if (tipo === 'desconocida') return 'Desconocida';
  if (tipo === 'aproximada' && anio) return `aprox. ${anio}`;
  if (tipo === 'solo_anio' && anio) return String(anio);
  if (dia && mes && anio) return `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${anio}`;
  if (anio) return String(anio);
  return 'Desconocida';
}

function formatLugar(lugar: { ciudad: string; provincia: string | null; pais: string } | null | undefined): string {
  if (!lugar) return '';
  return [lugar.ciudad, lugar.provincia, lugar.pais].filter(Boolean).join(', ');
}

export function generatePersonaMd(
  persona: Persona,
  relaciones: Relacion[],
  docsPrincipales: Documento[],
  docsMencionada: Documento[]
): string {
  const pid = `P${String(persona.id).padStart(5, '0')}`;
  const nacimiento = formatFecha(persona.nac_dia, persona.nac_mes, persona.nac_anio, persona.nac_tipo);
  const defuncion = formatFecha(persona.def_dia, persona.def_mes, persona.def_anio, persona.def_tipo);
  const sexoLabel = persona.sexo === 'M' ? 'Masculino' : persona.sexo === 'F' ? 'Femenino' : 'Otro';

  const relacionesMd = relaciones.length > 0
    ? relaciones.map(r => `- **${r.tipo_relacion_nombre}:** [${r.persona_destino_pid}] ${r.persona_destino_nombre}`).join('\n')
    : '_Sin relaciones registradas._';

  const principalesMd = docsPrincipales.length > 0
    ? docsPrincipales.map(d => `- **${formatDid(d.id)}** — ${d.titulo} (${d.tipo})`).join('\n')
    : '_Sin documentos principales._';

  const mencionadaMd = docsMencionada.length > 0
    ? docsMencionada.map(d => `- **${formatDid(d.id)}** — ${d.titulo} (${d.tipo})`).join('\n')
    : '_Sin menciones en otros documentos._';

  return `# ${persona.apellido}, ${persona.nombre}

**ID:** ${pid}
**Actualizado:** ${persona.actualizado_en}

---

## Datos Personales

| Campo | Valor |
|-------|-------|
| Nombre | ${persona.nombre} |
| Apellido | ${persona.apellido} |
| Sexo | ${sexoLabel} |
| Fecha de nacimiento | ${nacimiento} |
| Lugar de nacimiento | ${formatLugar(persona.nac_lugar)} |
| Fecha de defunción | ${defuncion} |
| Lugar de defunción | ${formatLugar(persona.def_lugar)} |

---

## Historia Personal

${persona.historia || '_Sin historia registrada._'}

---

## Relaciones

${relacionesMd}

---

## Documentos Principales

${principalesMd}

---

## Mencionado En

${mencionadaMd}
`;
}

export function writePersonaMd(
  persona: Persona,
  relaciones: Relacion[],
  docsPrincipales: Documento[],
  docsMencionada: Documento[]
): void {
  const folderPath = ensurePersonaFolder(persona);
  const content = generatePersonaMd(persona, relaciones, docsPrincipales, docsMencionada);
  fs.writeFileSync(path.join(folderPath, 'persona.md'), content, 'utf-8');
}

export function getDocumentosPath(persona: { id: number; nombre: string; apellido: string }): string {
  return path.join(personaFolderPath(persona), 'Documentos');
}

export function deletePersonaFolder(persona: { id: number; nombre: string; apellido: string }): void {
  const folderPath = personaFolderPath(persona);
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
  }
}

export function renumberPersonaFolders(fromId: number): void {
  const personasDir = path.join(getDataRoot(), 'Personas');
  if (!fs.existsSync(personasDir)) return;

  const entries = fs.readdirSync(personasDir);
  // Find folders with id > fromId, sort ascending so we rename P(n+1)→Pn without conflicts
  const toRename: { oldPath: string; newPath: string }[] = [];
  for (const entry of entries) {
    const match = entry.match(/^P(\d+)_(.+)$/);
    if (!match) continue;
    const folderId = Number(match[1]);
    if (folderId > fromId) {
      const newName = `P${String(folderId - 1).padStart(5, '0')}_${match[2]}`;
      toRename.push({
        oldPath: path.join(personasDir, entry),
        newPath: path.join(personasDir, newName),
      });
    }
  }
  toRename.sort((a, b) => a.oldPath.localeCompare(b.oldPath));
  for (const { oldPath, newPath } of toRename) {
    if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath);
  }
}

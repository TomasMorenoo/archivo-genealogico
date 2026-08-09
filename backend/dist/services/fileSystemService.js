"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataRoot = getDataRoot;
exports.formatDid = formatDid;
exports.personaFolderName = personaFolderName;
exports.personaFolderPath = personaFolderPath;
exports.ensurePersonaFolder = ensurePersonaFolder;
exports.documentoFileName = documentoFileName;
exports.generatePersonaMd = generatePersonaMd;
exports.writePersonaMd = writePersonaMd;
exports.getDocumentosPath = getDocumentosPath;
exports.deletePersonaFolder = deletePersonaFolder;
exports.renumberPersonaFolders = renumberPersonaFolders;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getDataRoot() {
    const root = process.env.ARCHIVO_ROOT;
    if (!root) {
        return path_1.default.join(process.cwd(), '..', 'Archivo_Genealogico');
    }
    return root;
}
function formatDid(id) {
    return `D${String(id).padStart(5, '0')}`;
}
function sanitizeName(name) {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}
function personaFolderName(persona) {
    const pid = `P${String(persona.id).padStart(5, '0')}`;
    return `${pid}_${sanitizeName(persona.apellido)}_${sanitizeName(persona.nombre)}`;
}
function personaFolderPath(persona) {
    return path_1.default.join(getDataRoot(), 'Personas', personaFolderName(persona));
}
function ensurePersonaFolder(persona) {
    const folderPath = personaFolderPath(persona);
    fs_1.default.mkdirSync(path_1.default.join(folderPath, 'Documentos'), { recursive: true });
    fs_1.default.mkdirSync(path_1.default.join(folderPath, 'Fotos'), { recursive: true });
    return folderPath;
}
function documentoFileName(docId, titulo, originalExt) {
    const did = formatDid(docId);
    const safe = sanitizeName(titulo).slice(0, 40);
    return `${did}_${safe}${originalExt}`;
}
function formatFecha(dia, mes, anio, tipo) {
    if (tipo === 'desconocida')
        return 'Desconocida';
    if (tipo === 'aproximada' && anio)
        return `aprox. ${anio}`;
    if (tipo === 'solo_anio' && anio)
        return String(anio);
    if (dia && mes && anio)
        return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
    if (anio)
        return String(anio);
    return 'Desconocida';
}
function formatLugar(lugar) {
    if (!lugar)
        return '';
    return [lugar.ciudad, lugar.provincia, lugar.pais].filter(Boolean).join(', ');
}
function generatePersonaMd(persona, relaciones, docsPrincipales, docsMencionada) {
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
function writePersonaMd(persona, relaciones, docsPrincipales, docsMencionada) {
    const folderPath = ensurePersonaFolder(persona);
    const content = generatePersonaMd(persona, relaciones, docsPrincipales, docsMencionada);
    fs_1.default.writeFileSync(path_1.default.join(folderPath, 'persona.md'), content, 'utf-8');
}
function getDocumentosPath(persona) {
    return path_1.default.join(personaFolderPath(persona), 'Documentos');
}
function deletePersonaFolder(persona) {
    const folderPath = personaFolderPath(persona);
    if (fs_1.default.existsSync(folderPath)) {
        fs_1.default.rmSync(folderPath, { recursive: true, force: true });
    }
}
function renumberPersonaFolders(fromId) {
    const personasDir = path_1.default.join(getDataRoot(), 'Personas');
    if (!fs_1.default.existsSync(personasDir))
        return;
    const entries = fs_1.default.readdirSync(personasDir);
    // Find folders with id > fromId, sort ascending so we rename P(n+1)→Pn without conflicts
    const toRename = [];
    for (const entry of entries) {
        const match = entry.match(/^P(\d+)_(.+)$/);
        if (!match)
            continue;
        const folderId = Number(match[1]);
        if (folderId > fromId) {
            const newName = `P${String(folderId - 1).padStart(5, '0')}_${match[2]}`;
            toRename.push({
                oldPath: path_1.default.join(personasDir, entry),
                newPath: path_1.default.join(personasDir, newName),
            });
        }
    }
    toRename.sort((a, b) => a.oldPath.localeCompare(b.oldPath));
    for (const { oldPath, newPath } of toRename) {
        if (fs_1.default.existsSync(oldPath))
            fs_1.default.renameSync(oldPath, newPath);
    }
}

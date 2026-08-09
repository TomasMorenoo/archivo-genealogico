import { useState } from 'react';
import { documentosApi } from '../../api/client';
import type { PersonaListItem, Documento } from '../../types';
import PersonaSearchInput from '../PersonaSearchInput/PersonaSearchInput';

const TIPOS_DOCUMENTO = [
  'Partida de nacimiento', 'Partida de matrimonio', 'Partida de defunción',
  'DNI', 'Foto', 'Censo', 'Registro histórico', 'Otro',
];

interface Props {
  defaultPersona?: { id: number; nombre: string; apellido: string; pid: string };
  onSaved: (doc: Documento) => void;
  onCancel: () => void;
}

export default function DocumentoForm({ defaultPersona, onSaved, onCancel }: Props) {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState(TIPOS_DOCUMENTO[0]);
  const [anio, setAnio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [principales, setPrincipales] = useState<PersonaListItem[]>([]);
  const [mencionadas, setMencionadas] = useState<PersonaListItem[]>([]);
  const [saving, setSaving] = useState(false);

  const defaultPersonaId = defaultPersona?.id;
  const allSelectedIds = [...principales, ...mencionadas].map(p => p.id);
  if (defaultPersonaId && !allSelectedIds.includes(defaultPersonaId)) {
    allSelectedIds.push(defaultPersonaId);
  }

  function removeFrom(list: PersonaListItem[], id: number): PersonaListItem[] {
    return list.filter(p => p.id !== id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const effectivePrincipales = principales.length > 0
      ? principales.map(p => p.id)
      : defaultPersonaId ? [defaultPersonaId] : [];
    if (!titulo || effectivePrincipales.length === 0) return;
    setSaving(true);
    try {
      const doc = await documentosApi.create({
        titulo, tipo,
        doc_anio: anio ? Number(anio) : null,
        doc_fecha_tipo: anio ? 'solo_anio' : 'desconocida',
        descripcion,
        personasPrincipales: effectivePrincipales,
        personasMencionadas: mencionadas.map(p => p.id),
      });
      if (file) await documentosApi.uploadArchivo(doc.id, file);
      onSaved(doc);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={f}><label>Título *</label>
        <input required value={titulo} onChange={e => setTitulo(e.target.value)} style={inp} placeholder="Partida de nacimiento de..." />
      </div>
      <div style={f}><label>Tipo *</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)} style={inp}>
          {TIPOS_DOCUMENTO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={f}><label>Año</label>
        <input type="number" placeholder="ej. 1978" value={anio} onChange={e => setAnio(e.target.value)} style={inp} />
      </div>
      <div style={f}><label>Descripción</label>
        <textarea rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)} style={{ ...inp, resize: 'vertical' }} />
      </div>

      <div style={f}>
        <label style={{ fontWeight: 600 }}>Persona(s) principal(es) {!defaultPersona ? '*' : ''}</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          {defaultPersona && (
            <span style={{ ...chip, background: '#dbeafe' }}>
              <code style={{ fontSize: '0.75em' }}>{defaultPersona.pid}</code> {defaultPersona.apellido}, {defaultPersona.nombre}
            </span>
          )}
          {principales.map(p => (
            <span key={p.id} style={chip}>
              <code style={{ fontSize: '0.75em' }}>{p.pid}</code> {p.apellido}, {p.nombre}
              <button type="button" onClick={() => setPrincipales(l => removeFrom(l, p.id))} style={chipX}>×</button>
            </span>
          ))}
        </div>
        <PersonaSearchInput excludeIds={allSelectedIds} onSelect={p => setPrincipales(l => [...l, p])} placeholder="Buscar persona principal..." />
      </div>

      <div style={f}>
        <label>Personas mencionadas</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          {mencionadas.map(p => (
            <span key={p.id} style={{ ...chip, background: '#f0f0ff' }}>
              <code style={{ fontSize: '0.75em' }}>{p.pid}</code> {p.apellido}, {p.nombre}
              <button type="button" onClick={() => setMencionadas(l => removeFrom(l, p.id))} style={chipX}>×</button>
            </span>
          ))}
        </div>
        <PersonaSearchInput excludeIds={allSelectedIds} onSelect={p => setMencionadas(l => [...l, p])} placeholder="Buscar persona mencionada..." />
      </div>

      <div style={f}><label>Archivo (opcional)</label>
        <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ fontSize: '0.9rem' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={btnSecondary}>Cancelar</button>
        <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Guardando...' : 'Crear documento'}</button>
      </div>
    </form>
  );
}

const f: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
const inp: React.CSSProperties = { padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem', width: '100%' };
const chip: React.CSSProperties = { background: '#e8f5e9', padding: '3px 8px', borderRadius: 20, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 4 };
const chipX: React.CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', color: '#888', fontSize: '1rem', lineHeight: 1 };
const btnPrimary: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };
const btnSecondary: React.CSSProperties = { background: 'transparent', border: '1px solid #ccc', padding: '8px 14px', borderRadius: 4, cursor: 'pointer' };

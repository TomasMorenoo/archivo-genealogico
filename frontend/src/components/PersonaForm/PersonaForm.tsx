import { useState } from 'react';
import type { Persona } from '../../types';

interface Props {
  initial?: Partial<Persona>;
  onSave: (data: Partial<Persona>) => void;
  onCancel: () => void;
  compact?: boolean;
}

export default function PersonaForm({ initial = {}, onSave, onCancel, compact = false }: Props) {
  const [form, setForm] = useState({
    nombre: initial.nombre ?? '',
    apellido: initial.apellido ?? '',
    sexo: initial.sexo ?? 'M',
    nac_anio: initial.nac_anio ?? '',
    nac_dia: initial.nac_dia ?? '',
    nac_mes: initial.nac_mes ?? '',
    nac_tipo: initial.nac_tipo ?? 'desconocida',
    historia: initial.historia ?? '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      nombre: form.nombre,
      apellido: form.apellido,
      sexo: form.sexo as 'M' | 'F' | 'otro',
      nac_anio: form.nac_anio ? Number(form.nac_anio) : null,
      nac_dia: form.nac_dia ? Number(form.nac_dia) : null,
      nac_mes: form.nac_mes ? Number(form.nac_mes) : null,
      nac_tipo: form.nac_tipo as any,
      historia: compact ? undefined : form.historia,
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={rowStyle}>
        <label>Nombre *</label>
        <input required value={form.nombre} onChange={e => set('nombre', e.target.value)} style={inputStyle} />
      </div>
      <div style={rowStyle}>
        <label>Apellido *</label>
        <input required value={form.apellido} onChange={e => set('apellido', e.target.value)} style={inputStyle} />
      </div>
      <div style={rowStyle}>
        <label>Sexo *</label>
        <select value={form.sexo} onChange={e => set('sexo', e.target.value)} style={inputStyle}>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <div style={rowStyle}>
        <label>Año nacimiento</label>
        <input type="number" placeholder="ej. 1978" value={form.nac_anio} onChange={e => set('nac_anio', e.target.value)} style={inputStyle} />
      </div>
      {!compact && (
        <>
          <div style={rowStyle}>
            <label>Fecha tipo</label>
            <select value={form.nac_tipo} onChange={e => set('nac_tipo', e.target.value)} style={inputStyle}>
              <option value="desconocida">Desconocida</option>
              <option value="solo_anio">Solo año</option>
              <option value="aproximada">Aproximada</option>
              <option value="exacta">Exacta</option>
            </select>
          </div>
          {form.nac_tipo === 'exacta' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" placeholder="Día" min={1} max={31} value={form.nac_dia} onChange={e => set('nac_dia', e.target.value)} style={{ ...inputStyle, width: 80 }} />
              <input type="number" placeholder="Mes" min={1} max={12} value={form.nac_mes} onChange={e => set('nac_mes', e.target.value)} style={{ ...inputStyle, width: 80 }} />
            </div>
          )}
          <div style={rowStyle}>
            <label>Historia</label>
            <textarea rows={6} value={form.historia} onChange={e => set('historia', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={btnSecondary}>Cancelar</button>
        <button type="submit" style={btnPrimary}>Guardar</button>
      </div>
    </form>
  );
}

const rowStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
const inputStyle: React.CSSProperties = { padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.95rem', width: '100%' };
const btnPrimary: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };
const btnSecondary: React.CSSProperties = { background: 'transparent', border: '1px solid #ccc', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' };

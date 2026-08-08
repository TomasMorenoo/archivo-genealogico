import { useState } from 'react';
import type { Persona } from '../../types';
import type { Lugar } from '../../types';
import LugarInput from '../LugarInput/LugarInput';

interface Props {
  initial?: Partial<Persona>;
  onSave: (data: Partial<Persona>) => void;
  onCancel: () => void;
  compact?: boolean;
  extraSlot?: (nacAnio: number | null) => React.ReactNode;
}

function deriveTipo(dia: string, mes: string, anio: string, aprox: boolean): string {
  if (aprox) return 'aproximada';
  if (dia || mes) return 'exacta';
  if (anio) return 'solo_anio';
  return 'desconocida';
}

export default function PersonaForm({ initial = {}, onSave, onCancel, compact = false, extraSlot }: Props) {
  const [nacLugar, setNacLugar] = useState<Lugar | null>(initial.nac_lugar ?? null);
  const [defLugar, setDefLugar] = useState<Lugar | null>(initial.def_lugar ?? null);
  const [fallecida, setFallecida] = useState<boolean>(initial.fallecida ?? false);
  const [nacAprox, setNacAprox] = useState(initial.nac_tipo === 'aproximada');
  const [defAprox, setDefAprox] = useState(initial.def_tipo === 'aproximada');

  const [form, setForm] = useState({
    nombre: initial.nombre ?? '',
    apellido: initial.apellido ?? '',
    sexo: initial.sexo ?? 'M',
    nac_dia: initial.nac_dia ? String(initial.nac_dia) : '',
    nac_mes: initial.nac_mes ? String(initial.nac_mes) : '',
    nac_anio: initial.nac_anio ? String(initial.nac_anio) : '',
    def_dia: initial.def_dia ? String(initial.def_dia) : '',
    def_mes: initial.def_mes ? String(initial.def_mes) : '',
    def_anio: initial.def_anio ? String(initial.def_anio) : '',
    historia: initial.historia ?? '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      nombre: form.nombre,
      apellido: form.apellido,
      sexo: form.sexo as 'M' | 'F' | 'otro',
      nac_dia: form.nac_dia ? Number(form.nac_dia) : null,
      nac_mes: form.nac_mes ? Number(form.nac_mes) : null,
      nac_anio: form.nac_anio ? Number(form.nac_anio) : null,
      nac_tipo: deriveTipo(form.nac_dia, form.nac_mes, form.nac_anio, nacAprox) as any,
      nac_lugar_id: nacLugar?.id ?? null,
      fallecida,
      def_dia: fallecida && form.def_dia ? Number(form.def_dia) : null,
      def_mes: fallecida && form.def_mes ? Number(form.def_mes) : null,
      def_anio: fallecida && form.def_anio ? Number(form.def_anio) : null,
      def_tipo: fallecida ? deriveTipo(form.def_dia, form.def_mes, form.def_anio, defAprox) as any : 'desconocida',
      def_lugar_id: fallecida ? (defLugar?.id ?? null) : null,
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

      {!compact && (
        <>
          <div style={rowStyle}>
            <label>Estado</label>
            <div style={{ display: 'flex', gap: 16, paddingTop: 4 }}>
              <label style={radioLabel}>
                <input type="radio" checked={!fallecida} onChange={() => setFallecida(false)} />
                Vivo/a
              </label>
              <label style={radioLabel}>
                <input type="radio" checked={fallecida} onChange={() => setFallecida(true)} />
                Fallecido/a
              </label>
            </div>
          </div>

          <div style={rowStyle}>
            <label>Fecha de nacimiento</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="number" placeholder="Día" min={1} max={31} value={form.nac_dia}
                onChange={e => set('nac_dia', e.target.value)} style={{ ...inputStyle, width: 70 }} />
              <input type="number" placeholder="Mes" min={1} max={12} value={form.nac_mes}
                onChange={e => set('nac_mes', e.target.value)} style={{ ...inputStyle, width: 70 }} />
              <input type="number" placeholder="Año" value={form.nac_anio}
                onChange={e => set('nac_anio', e.target.value)} style={{ ...inputStyle, width: 100 }} />
              <label style={radioLabel}>
                <input type="checkbox" checked={nacAprox} onChange={e => setNacAprox(e.target.checked)} />
                aprox.
              </label>
            </div>
          </div>

          <div style={rowStyle}>
            <label>Lugar de nacimiento</label>
            <LugarInput value={nacLugar} onChange={setNacLugar} />
          </div>

          {fallecida && (
            <>
              <div style={rowStyle}>
                <label>Fecha de defunción</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="number" placeholder="Día" min={1} max={31} value={form.def_dia}
                    onChange={e => set('def_dia', e.target.value)} style={{ ...inputStyle, width: 70 }} />
                  <input type="number" placeholder="Mes" min={1} max={12} value={form.def_mes}
                    onChange={e => set('def_mes', e.target.value)} style={{ ...inputStyle, width: 70 }} />
                  <input type="number" placeholder="Año" value={form.def_anio}
                    onChange={e => set('def_anio', e.target.value)} style={{ ...inputStyle, width: 100 }} />
                  <label style={radioLabel}>
                    <input type="checkbox" checked={defAprox} onChange={e => setDefAprox(e.target.checked)} />
                    aprox.
                  </label>
                </div>
              </div>

              <div style={rowStyle}>
                <label>Lugar de defunción</label>
                <LugarInput value={defLugar} onChange={setDefLugar} placeholder="Ciudad, provincia, país..." />
              </div>
            </>
          )}

          {extraSlot?.(form.nac_anio ? Number(form.nac_anio) : null)}

          <div style={rowStyle}>
            <label>Historia</label>
            <textarea rows={6} value={form.historia} onChange={e => set('historia', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }} />
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
const radioLabel: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' };
const btnPrimary: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };
const btnSecondary: React.CSSProperties = { background: 'transparent', border: '1px solid #ccc', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' };

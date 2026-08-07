import { useState, useEffect } from 'react';
import { relacionesApi } from '../../api/client';
import type { TipoRelacion, PersonaListItem } from '../../types';
import PersonaSearchInput from '../PersonaSearchInput/PersonaSearchInput';

interface Props {
  personaId: number;
  onSaved: () => void;
  onCancel: () => void;
}

export default function RelacionForm({ personaId, onSaved, onCancel }: Props) {
  const [tipos, setTipos] = useState<TipoRelacion[]>([]);
  const [tipoId, setTipoId] = useState('');
  const [seleccionada, setSeleccionada] = useState<PersonaListItem | null>(null);

  useEffect(() => {
    relacionesApi.tipos().then(t => {
      setTipos(t);
      if (t.length > 0) setTipoId(String(t[0].id));
    });
  }, []);

  async function handleGuardar() {
    if (!tipoId || !seleccionada) return;
    await relacionesApi.add({
      persona_origen_id: personaId,
      tipo_relacion_id: Number(tipoId),
      persona_destino_id: seleccionada.id,
    });
    onSaved();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: '0.85rem', color: '#555' }}>Tipo de relación</label>
        <select value={tipoId} onChange={e => setTipoId(e.target.value)} style={inp}>
          {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
      </div>

      <PersonaSearchInput
        label="Persona relacionada"
        excludeIds={[personaId]}
        onSelect={setSeleccionada}
      />

      {seleccionada && (
        <div style={{ padding: '7px 12px', background: '#f0f9ff', borderRadius: 4, fontSize: '0.9rem' }}>
          <strong>{seleccionada.apellido}, {seleccionada.nombre}</strong>
          {' '}<span style={{ color: '#888' }}>({seleccionada.pid})</span>
          <button onClick={() => setSeleccionada(null)}
            style={{ marginLeft: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#c00' }}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={btnSecondary}>Cancelar</button>
        <button onClick={handleGuardar} disabled={!seleccionada} style={btnPrimary}>Agregar relación</button>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.95rem' };
const btnPrimary: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };
const btnSecondary: React.CSSProperties = { background: 'transparent', border: '1px solid #ccc', padding: '8px 14px', borderRadius: 4, cursor: 'pointer' };

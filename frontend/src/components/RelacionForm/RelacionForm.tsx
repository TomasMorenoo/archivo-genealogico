import { useState, useEffect } from 'react';
import { relacionesApi } from '../../api/client';
import type { TipoRelacion, PersonaListItem } from '../../types';
import PersonaSearchInput from '../PersonaSearchInput/PersonaSearchInput';

const TIPO_SEXO: Record<string, 'M' | 'F'> = {
  'Padre': 'M', 'Padre biológico': 'M', 'Padre adoptivo': 'M', 'Abuelo': 'M', 'Bisabuelo': 'M',
  'Hermano': 'M', 'Hermano medio': 'M', 'Hijo': 'M',
  'Madre': 'F', 'Madre biológica': 'F', 'Madre adoptiva': 'F', 'Abuela': 'F', 'Bisabuela': 'F',
  'Hermana': 'F', 'Hija': 'F',
};

function calcDefaultSexo(nombreTipo: string, personaSexo: 'M' | 'F' | 'otro'): 'M' | 'F' | 'otro' {
  if (nombreTipo === 'Cónyuge') {
    return personaSexo === 'M' ? 'F' : personaSexo === 'F' ? 'M' : 'M';
  }
  return TIPO_SEXO[nombreTipo] ?? 'M';
}

interface Props {
  personaId: number;
  personaSexo: 'M' | 'F' | 'otro';
  onSaved: () => void;
  onCancel: () => void;
}

export default function RelacionForm({ personaId, personaSexo, onSaved, onCancel }: Props) {
  const [tipos, setTipos] = useState<TipoRelacion[]>([]);
  const [tipoId, setTipoId] = useState('');
  const [seleccionada, setSeleccionada] = useState<PersonaListItem | null>(null);
  const [defaultSexo, setDefaultSexo] = useState<'M' | 'F' | 'otro'>('M');

  useEffect(() => {
    relacionesApi.tipos().then(t => {
      setTipos(t);
      if (t.length > 0) {
        setTipoId(String(t[0].id));
        setDefaultSexo(calcDefaultSexo(t[0].nombre, personaSexo));
      }
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
        <select value={tipoId} onChange={e => {
          const id = e.target.value;
          setTipoId(id);
          const tipo = tipos.find(t => String(t.id) === id);
          if (tipo) setDefaultSexo(calcDefaultSexo(tipo.nombre, personaSexo));
        }} style={inp}>
          {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
      </div>

      <PersonaSearchInput
        label="Persona relacionada"
        excludeIds={[personaId]}
        onSelect={async p => {
          await relacionesApi.add({
            persona_origen_id: personaId,
            tipo_relacion_id: Number(tipoId),
            persona_destino_id: p.id,
          });
          onSaved();
        }}
        defaultSexo={defaultSexo}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={btnSecondary}>Cancelar</button>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.95rem' };
const btnPrimary: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };
const btnSecondary: React.CSSProperties = { background: 'transparent', border: '1px solid #ccc', padding: '8px 14px', borderRadius: 4, cursor: 'pointer' };

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { personasApi, relacionesApi, documentosApi } from '../api/client';
import type { Persona, Relacion, Documento } from '../types';
import PersonaForm from '../components/PersonaForm/PersonaForm';
import RelacionForm from '../components/RelacionForm/RelacionForm';
import DocumentoSection from '../components/DocumentoSection/DocumentoSection';
import PersonaSearchInput from '../components/PersonaSearchInput/PersonaSearchInput';

export default function PersonaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numId = Number(id);

  const [persona, setPersona] = useState<Persona | null>(null);
  const [relaciones, setRelaciones] = useState<Relacion[]>([]);
  const [docsPrincipales, setDocsPrincipales] = useState<Documento[]>([]);
  const [docsMencionada, setDocsMencionada] = useState<Documento[]>([]);
  const [editing, setEditing] = useState(false);
  const [editingHistoria, setEditingHistoria] = useState(false);
  const [historiaText, setHistoriaText] = useState('');
  const [addingRelacion, setAddingRelacion] = useState(false);

  const loadRelaciones = useCallback(() =>
    relacionesApi.dePersona(numId).then(setRelaciones), [numId]);

  const loadDocumentos = useCallback(async () => {
    const { principales, mencionada } = await documentosApi.dePersona(numId);
    setDocsPrincipales(principales);
    setDocsMencionada(mencionada);
  }, [numId]);

  useEffect(() => {
    personasApi.get(numId).then(p => { setPersona(p); setHistoriaText(p.historia ?? ''); }).catch(() => navigate('/'));
    loadRelaciones();
    loadDocumentos();
  }, [numId, navigate, loadRelaciones, loadDocumentos]);

  async function handleSave(data: Partial<Persona>) {
    const updated = await personasApi.update(numId, data);
    setPersona(updated);
    setHistoriaText(updated.historia ?? '');
    setEditing(false);
  }

  async function handleSaveHistoria() {
    const updated = await personasApi.update(numId, { historia: historiaText });
    setPersona(updated);
    setEditingHistoria(false);
  }

  async function handleDeleteRelacion(relId: number) {
    await relacionesApi.delete(relId);
    loadRelaciones();
  }

  async function handleAddRelacion(tipoId: number, personaDestinoId: number) {
    await relacionesApi.add({ persona_origen_id: numId, tipo_relacion_id: tipoId, persona_destino_id: personaDestinoId });
    loadRelaciones();
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar a ${persona?.apellido}, ${persona?.nombre}?`)) return;
    await personasApi.delete(numId);
    navigate('/');
  }

  if (!persona) return <div style={{ padding: 32, color: '#666' }}>Cargando...</div>;

  const nacimiento = formatFecha(persona.nac_dia, persona.nac_mes, persona.nac_anio, persona.nac_tipo);
  const defuncion = formatFecha(persona.def_dia, persona.def_mes, persona.def_anio, persona.def_tipo);
  const edad = persona.fallecida ? calcEdad(persona.nac_dia, persona.nac_mes, persona.nac_anio, persona.def_dia, persona.def_mes, persona.def_anio) : null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
      <nav style={{ marginBottom: 24, color: '#666', fontSize: '0.9rem' }}>
        <Link to="/" style={{ color: '#0070f3' }}>← Índice</Link>
      </nav>

      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ wordBreak: 'break-word', minWidth: 0, flex: '1 1 200px' }}>
            <code style={{ color: '#555', fontSize: '0.85rem' }}>{persona.pid}</code>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginTop: 2 }}>
              {persona.apellido}, {persona.nombre}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditing(true)} style={btnSecondary}>Editar</button>
            <button onClick={handleDelete} style={btnDanger}>Eliminar</button>
          </div>
        </div>
      </header>

      {editing ? (
        <section style={card}>
          <h2 style={sectionTitle}>Editar datos</h2>
          <PersonaForm initial={persona} onSave={handleSave} onCancel={() => setEditing(false)} />
        </section>
      ) : (
        <section style={card}>
          <h2 style={sectionTitle}>Datos Personales</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {([
                ['Nombre', persona.nombre],
                ['Apellido', persona.apellido],
                ['Sexo', { M: 'Masculino', F: 'Femenino', otro: 'Otro' }[persona.sexo]],
                ['Estado', persona.fallecida ? 'Fallecido/a' : 'Vivo/a'],
                ['Nacimiento', nacimiento],
                ['Lugar nacimiento', persona.nac_lugar
                  ? [persona.nac_lugar.ciudad, persona.nac_lugar.provincia, persona.nac_lugar.pais].filter(Boolean).join(', ')
                  : '—'],
                ...(persona.fallecida ? [
                  ['Defunción', defuncion + (edad ? ` (${edad})` : '')],
                  ['Lugar defunción', persona.def_lugar
                    ? [persona.def_lugar.ciudad, persona.def_lugar.provincia, persona.def_lugar.pais].filter(Boolean).join(', ')
                    : '—'],
                ] : []),
              ] as [string, string][]).map(([label, val]) => (
                <tr key={label}>
                  <td style={labelCell}>{label}</td>
                  <td style={valueCell}>{val || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ ...sectionTitle, marginBottom: 0 }}>Relaciones</h2>
          <button onClick={() => setAddingRelacion(true)} style={btnSmall}>+ Agregar</button>
        </div>

        {(() => {
          const padreRel = relaciones.find(r => r.tipo_relacion_nombre === 'Padre');
          const madreRel = relaciones.find(r => r.tipo_relacion_nombre === 'Madre');
          const otras = relaciones.filter(r => r.tipo_relacion_nombre !== 'Padre' && r.tipo_relacion_nombre !== 'Madre');
          return (
            <>
              <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(['Padre', 'Madre'] as const).map(label => {
                  const rel = label === 'Padre' ? padreRel : madreRel;
                  const tipoId = label === 'Padre' ? 1 : 2;
                  const sexo = label === 'Padre' ? 'M' as const : 'F' as const;
                  return (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ ...relTag, minWidth: 50 }}>{label}</span>
                      {rel ? (
                        <>
                          <Link to={`/persona/${rel.persona_destino_id}`} style={{ color: '#0070f3', flex: 1 }}>
                            {rel.persona_destino_nombre}
                          </Link>
                          <span style={{ color: '#666', fontSize: '0.82rem' }}>({rel.persona_destino_pid})</span>
                          <button onClick={() => handleDeleteRelacion(rel.id)} style={delBtn}>×</button>
                        </>
                      ) : (
                        <div style={{ flex: 1 }}>
                          <PersonaSearchInput
                            defaultSexo={sexo}
                            excludeIds={[numId]}
                            onSelect={p => handleAddRelacion(tipoId, p.id)}
                            placeholder={`Buscar o crear ${label.toLowerCase()}...`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {addingRelacion && (
                <div style={{ marginBottom: 16, padding: 16, background: '#f9f9f9', borderRadius: 6 }}>
                  <RelacionForm
                    personaId={numId}
                    personaSexo={persona.sexo}
                    onSaved={() => { setAddingRelacion(false); loadRelaciones(); }}
                    onCancel={() => setAddingRelacion(false)}
                  />
                </div>
              )}

              {otras.length > 0 && (
                <ul style={{ padding: 0, listStyle: 'none', borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 4 }}>
                  {otras.map(r => (
                    <li key={r.id} style={relItem}>
                      <div>
                        <span style={relTag}>{r.tipo_relacion_nombre}</span>
                        <Link to={`/persona/${r.persona_destino_id}`} style={{ color: '#0070f3' }}>
                          {r.persona_destino_nombre}
                        </Link>
                        <span style={{ color: '#666', marginLeft: 6, fontSize: '0.82rem' }}>
                          ({r.persona_destino_pid})
                        </span>
                      </div>
                      <button onClick={() => handleDeleteRelacion(r.id)} style={delBtn}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          );
        })()}
      </section>

      {!editing && (
        <section style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ ...sectionTitle, marginBottom: 0 }}>Historia Personal</h2>
            {!editingHistoria && (
              <button onClick={() => setEditingHistoria(true)} style={btnSmall}>Editar</button>
            )}
          </div>
          {editingHistoria ? (
            <div>
              <textarea
                value={historiaText}
                onChange={e => setHistoriaText(e.target.value)}
                rows={10}
                style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, fontSize: '0.95rem', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={handleSaveHistoria} style={btnPrimary}>Guardar</button>
                <button onClick={() => { setEditingHistoria(false); setHistoriaText(persona.historia ?? ''); }} style={btnSecondary}>Cancelar</button>
              </div>
            </div>
          ) : (
            persona.historia
              ? <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{persona.historia}</p>
              : <p style={{ color: '#666' }}>Sin historia registrada.{' '}
                  <button onClick={() => setEditingHistoria(true)} style={{ border: 'none', background: 'none', color: '#0070f3', cursor: 'pointer' }}>Agregar</button>
                </p>
          )}
        </section>
      )}

      <section style={card}>
        <DocumentoSection
          personaId={numId}
          principales={docsPrincipales}
          mencionada={docsMencionada}
          onUpdate={loadDocumentos}
        />
      </section>
    </div>
  );
}

function formatFecha(dia: number | null, mes: number | null, anio: number | null, tipo: string): string {
  if (tipo === 'desconocida') return '—';
  if (tipo === 'aproximada' && anio) return `aprox. ${anio}`;
  if (dia && mes && anio) return `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${anio}`;
  if (anio) return String(anio);
  return '—';
}

function calcEdad(
  nacDia: number | null, nacMes: number | null, nacAnio: number | null,
  defDia: number | null, defMes: number | null, defAnio: number | null
): string | null {
  if (!nacAnio || !defAnio) return null;
  if (nacDia && nacMes && defDia && defMes) {
    let years = defAnio - nacAnio;
    if (defMes < nacMes || (defMes === nacMes && defDia < nacDia)) years--;
    if (years < 1) {
      let months = (defAnio - nacAnio) * 12 + (defMes - nacMes);
      if (defDia < nacDia) months--;
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return `${years} años`;
  }
  const diff = defAnio - nacAnio;
  return `${diff} años`;
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, border: '1px solid #e8e8e8' };
const sectionTitle: React.CSSProperties = { fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#444', marginBottom: 12 };
const labelCell: React.CSSProperties = { padding: '6px 0', width: 160, color: '#666', fontSize: '0.9rem', verticalAlign: 'top' };
const valueCell: React.CSSProperties = { padding: '6px 0', fontWeight: 500 };
const relItem: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f2f2f2' };
const relTag: React.CSSProperties = { background: '#f0f0f0', padding: '2px 8px', borderRadius: 3, fontSize: '0.78rem', marginRight: 10, color: '#555' };
const delBtn: React.CSSProperties = { border: 'none', background: 'none', color: '#888', cursor: 'pointer', fontSize: '1rem' };
const btnPrimary: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };
const btnSecondary: React.CSSProperties = { border: '1px solid #ccc', background: 'transparent', padding: '7px 14px', borderRadius: 4, cursor: 'pointer' };
const btnDanger: React.CSSProperties = { border: '1px solid #fcc', background: '#fff5f5', color: '#c00', padding: '7px 14px', borderRadius: 4, cursor: 'pointer' };
const btnSmall: React.CSSProperties = { border: '1px solid #ccc', background: 'transparent', padding: '5px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' };

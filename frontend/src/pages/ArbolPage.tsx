import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { personasApi } from '../api/client';
import type { AncestorNode } from '../types';
import PersonaSearchInput from '../components/PersonaSearchInput/PersonaSearchInput';
import type { PersonaListItem } from '../types';

const MAX_GENS = 5;

function PersonCard({ node, onClick }: { node: AncestorNode; onClick: () => void }) {
  return (
    <div onClick={onClick} style={cardStyle}>
      <div style={cardName}>{node.apellido}, {node.nombre}</div>
      {node.nac_anio ? <div style={cardYear}>n. {node.nac_anio}</div> : null}
    </div>
  );
}

function Branch({ node, gen, navigate }: { node: AncestorNode; gen: number; navigate: (id: number) => void }) {
  const padre = gen < MAX_GENS ? node.padre : undefined;
  const madre = gen < MAX_GENS ? node.madre : undefined;
  const hasParents = !!(padre || madre);

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <PersonCard node={node} onClick={() => navigate(node.id)} />
      {hasParents && (
        <>
          <div style={{ width: 20, height: 2, background: '#d8d8d8', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ width: 10, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              {padre && madre ? (
                <>
                  <div style={{ flex: 1, borderRight: '2px solid #d8d8d8', borderBottom: '2px solid #d8d8d8' }} />
                  <div style={{ flex: 1, borderRight: '2px solid #d8d8d8', borderTop: '2px solid #d8d8d8' }} />
                </>
              ) : (
                <div style={{ flex: 1, borderRight: '2px solid #d8d8d8' }} />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {padre && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 2, background: '#d8d8d8', flexShrink: 0 }} />
                  <Branch node={padre} gen={gen + 1} navigate={navigate} />
                </div>
              )}
              {madre && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 2, background: '#d8d8d8', flexShrink: 0 }} />
                  <Branch node={madre} gen={gen + 1} navigate={navigate} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ArbolPage() {
  const navigate = useNavigate();
  const [root, setRoot] = useState<AncestorNode | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSelect(p: PersonaListItem) {
    setLoading(true);
    try {
      const tree = await personasApi.ancestros(p.id, MAX_GENS);
      setRoot(tree);
    } finally {
      setLoading(false);
    }
  }

  function goTo(id: number) {
    navigate(`/persona/${id}`);
  }

  return (
    <div style={{ padding: '24px 20px', minHeight: '100vh', background: '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate('/')} style={backBtn}>← Índice</button>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Árbol Genealógico</h1>
      </div>

      {!root && (
        <div style={searchCard}>
          <p style={{ color: '#555', marginBottom: 12, fontSize: '0.9rem' }}>
            Buscá una persona para ver su árbol de ancestros (hasta 5 generaciones).
          </p>
          <PersonaSearchInput
            placeholder="Buscar persona raíz..."
            onSelect={handleSelect}
            allowCreate={false}
          />
          {loading && <p style={{ color: '#999', fontSize: '0.85rem', marginTop: 8 }}>Cargando...</p>}
        </div>
      )}

      {root && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: '0.9rem', color: '#555' }}>
              Árbol de <strong>{root.apellido}, {root.nombre}</strong>
            </span>
            <button onClick={() => setRoot(null)} style={changeBtn}>Cambiar</button>
          </div>
          <div style={{ overflowX: 'auto', overflowY: 'auto', paddingBottom: 24 }}>
            <div style={{ display: 'inline-block', padding: '16px 8px' }}>
              <Branch node={root} gen={1} navigate={goTo} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #e4e4e4',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
  minWidth: 148,
  width: 148,
  flexShrink: 0,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  transition: 'border-color 0.15s',
};

const cardName: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.82rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: '#1a1a1a',
};

const cardYear: React.CSSProperties = {
  fontSize: '0.72rem',
  color: '#aaa',
  marginTop: 2,
};

const searchCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e4e4e4',
  borderRadius: 8,
  padding: 20,
  maxWidth: 420,
};

const backBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid #ddd',
  borderRadius: 4,
  padding: '5px 12px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  color: '#555',
};

const changeBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid #ccc',
  borderRadius: 4,
  padding: '3px 10px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  color: '#666',
};

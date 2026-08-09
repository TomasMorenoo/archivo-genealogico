import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { personasApi, configApi } from '../api/client';
import type { AncestorNode } from '../types';
import PersonaSearchInput from '../components/PersonaSearchInput/PersonaSearchInput';
import type { PersonaListItem } from '../types';

const MAX_GENS = 5;
const CFG_ROOT = 'arbol_raiz_id';
const CFG_ROOT_NAME = 'arbol_raiz_nombre';

type Orientation = 'horizontal' | 'vertical';
type View = 'bio' | 'adoptivo';

// ── Card ───────────────────────────────────────────────────────────────────
function PersonCard({ node, onClick }: { node: AncestorNode; onClick: () => void }) {
  return (
    <div onClick={onClick} style={cardStyle}>
      <div style={cardName}>{node.apellido}, {node.nombre}</div>
      {node.nac_anio ? <div style={cardYear}>n. {node.nac_anio}</div> : null}
    </div>
  );
}

// ── Horizontal branch (left → right) ───────────────────────────────────────
function HBranch({ node, gen, navigate }: { node: AncestorNode; gen: number; navigate: (id: number) => void }) {
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
                  <HBranch node={padre} gen={gen + 1} navigate={navigate} />
                </div>
              )}
              {madre && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 2, background: '#d8d8d8', flexShrink: 0 }} />
                  <HBranch node={madre} gen={gen + 1} navigate={navigate} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Vertical branch (top → down) ───────────────────────────────────────────
function VBranch({ node, gen, navigate }: { node: AncestorNode; gen: number; navigate: (id: number) => void }) {
  const padre = gen < MAX_GENS ? node.padre : undefined;
  const madre = gen < MAX_GENS ? node.madre : undefined;
  const hasParents = !!(padre || madre);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <PersonCard node={node} onClick={() => navigate(node.id)} />
      {hasParents && (
        <>
          <div style={{ width: 2, height: 16, background: '#d8d8d8', flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: 16, borderTop: '2px solid #d8d8d8', paddingTop: 0 }}>
            {padre && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 16, background: '#d8d8d8' }} />
                <VBranch node={padre} gen={gen + 1} navigate={navigate} />
              </div>
            )}
            {madre && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 16, background: '#d8d8d8' }} />
                <VBranch node={madre} gen={gen + 1} navigate={navigate} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function ArbolPage() {
  const navigate = useNavigate();
  const [rootId, setRootId] = useState<number | null>(null);
  const [rootName, setRootName] = useState<string>('');
  const [root, setRoot] = useState<AncestorNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [view, setView] = useState<View>('bio');

  async function loadTree(id: number, v: View) {
    setLoading(true);
    try {
      const tree = await personasApi.ancestros(id, MAX_GENS, v);
      setRoot(tree);
    } finally {
      setLoading(false);
    }
  }

  // Load persisted root on mount
  useEffect(() => {
    configApi.get(CFG_ROOT).then(val => {
      if (!val) return;
      const id = Number(val);
      setRootId(id);
      configApi.get(CFG_ROOT_NAME).then(n => setRootName(n ?? ''));
      loadTree(id, 'bio');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when view changes (if already has a root)
  useEffect(() => {
    if (rootId && root) loadTree(rootId, view);
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelect(p: PersonaListItem) {
    const name = `${p.apellido}, ${p.nombre}`;
    setRootId(p.id);
    setRootName(name);
    await configApi.set(CFG_ROOT, String(p.id));
    await configApi.set(CFG_ROOT_NAME, name);
    await loadTree(p.id, view);
  }

  async function handleCambiar() {
    setRoot(null);
    setRootId(null);
    setRootName('');
    await configApi.set(CFG_ROOT, null);
    await configApi.set(CFG_ROOT_NAME, null);
  }

  function goTo(id: number) {
    navigate(`/persona/${id}`);
  }

  return (
    <div style={{ padding: '24px 20px', minHeight: '100vh', background: '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/')} style={backBtn}>← Índice</button>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Árbol Genealógico</h1>
        {root && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* View toggle: bio / adoptivo */}
            <div style={toggleGroup}>
              <button
                style={{ ...toggleBtn, ...(view === 'bio' ? toggleActive : {}) }}
                onClick={() => setView('bio')}
              >Biológico</button>
              <button
                style={{ ...toggleBtn, ...(view === 'adoptivo' ? toggleActive : {}) }}
                onClick={() => setView('adoptivo')}
              >Adoptivo</button>
            </div>
            {/* Orientation toggle */}
            <div style={toggleGroup}>
              <button
                style={{ ...toggleBtn, ...(orientation === 'horizontal' ? toggleActive : {}) }}
                onClick={() => setOrientation('horizontal')}
                title="Horizontal"
              >↔</button>
              <button
                style={{ ...toggleBtn, ...(orientation === 'vertical' ? toggleActive : {}) }}
                onClick={() => setOrientation('vertical')}
                title="Vertical"
              >↕</button>
            </div>
          </div>
        )}
      </div>

      {!root && !loading && (
        <div style={searchCard}>
          <p style={{ color: '#555', marginBottom: 12, fontSize: '0.9rem' }}>
            Buscá una persona para ver su árbol de ancestros (hasta 5 generaciones).
          </p>
          <PersonaSearchInput
            placeholder="Buscar persona raíz..."
            onSelect={handleSelect}
            allowCreate={false}
          />
        </div>
      )}

      {loading && (
        <div style={{ color: '#999', fontSize: '0.9rem', marginTop: 8 }}>Cargando...</div>
      )}

      {root && !loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: '0.9rem', color: '#555' }}>
              Árbol de <strong>{rootName || `${root.apellido}, ${root.nombre}`}</strong>
            </span>
            <button onClick={handleCambiar} style={changeBtn}>Cambiar</button>
          </div>
          <div style={{ overflowX: 'auto', overflowY: 'auto', paddingBottom: 24 }}>
            <div style={{ display: 'inline-block', padding: '16px 8px' }}>
              {orientation === 'horizontal'
                ? <HBranch node={root} gen={1} navigate={goTo} />
                : <VBranch node={root} gen={1} navigate={goTo} />
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
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
};
const cardName: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.82rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: '#1a1a1a',
};
const cardYear: React.CSSProperties = { fontSize: '0.72rem', color: '#aaa', marginTop: 2 };
const searchCard: React.CSSProperties = {
  background: '#fff', border: '1px solid #e4e4e4', borderRadius: 8, padding: 20, maxWidth: 420,
};
const backBtn: React.CSSProperties = {
  background: 'none', border: '1px solid #ddd', borderRadius: 4,
  padding: '5px 12px', cursor: 'pointer', fontSize: '0.85rem', color: '#555',
};
const changeBtn: React.CSSProperties = {
  background: 'none', border: '1px solid #ccc', borderRadius: 4,
  padding: '3px 10px', cursor: 'pointer', fontSize: '0.8rem', color: '#666',
};
const toggleGroup: React.CSSProperties = {
  display: 'flex', border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden',
};
const toggleBtn: React.CSSProperties = {
  border: 'none', background: '#f5f5f5', cursor: 'pointer',
  padding: '5px 11px', fontSize: '0.82rem', color: '#555',
};
const toggleActive: React.CSSProperties = {
  background: '#1a1a1a', color: '#fff',
};

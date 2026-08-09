import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { personasApi, configApi } from '../api/client';
import type { AncestorNode } from '../types';
import PersonaSearchInput from '../components/PersonaSearchInput/PersonaSearchInput';
import type { PersonaListItem } from '../types';

const MAX_GENS = 5;
const CFG_ROOT = 'arbol_raiz_id';
const CFG_ROOT_NAME = 'arbol_raiz_nombre';
const CFG_ORIENTATION = 'arbol_orientation';
const CFG_VIEW = 'arbol_view';

type Orientation = 'horizontal' | 'vertical';
type View = 'bio' | 'adoptivo';

const PAPER_SIZES = [
  { label: 'A4  (210 × 297 mm)',  w: 210,  h: 297,  css: 'A4'  },
  { label: 'A3  (297 × 420 mm)',  w: 297,  h: 420,  css: 'A3'  },
  { label: 'A2  (420 × 594 mm)',  w: 420,  h: 594,  css: 'A2'  },
  { label: 'A1  (594 × 841 mm)',  w: 594,  h: 841,  css: 'A1'  },
  { label: 'A0  (841 × 1189 mm)', w: 841,  h: 1189, css: 'A0'  },
] as const;

function printTree(wMm: number, hMm: number, cssSize: string) {
  const el = document.getElementById('arbol-tree-content');
  if (!el) return;

  const treeW = el.scrollWidth;
  const treeH = el.scrollHeight;
  const margin = 15; // mm
  const mmToPx = 96 / 25.4;

  const fit = (pw: number, ph: number) =>
    Math.min((pw - 2 * margin) * mmToPx / treeW, (ph - 2 * margin) * mmToPx / treeH);

  const scalePortrait  = fit(wMm, hMm);
  const scaleLandscape = fit(hMm, wMm);
  const useLandscape   = scaleLandscape > scalePortrait;
  const scale          = useLandscape ? scaleLandscape : scalePortrait;
  const orient         = useLandscape ? 'landscape' : 'portrait';

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  @page { size: ${cssSize} ${orient}; margin: ${margin}mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrap { transform: scale(${scale}); transform-origin: top left;
          width: ${treeW}px; height: ${treeH}px; display: inline-block; }
</style></head><body>
<div class="wrap">${el.innerHTML}</div>
<script>window.onload=function(){window.print();window.close();}<\/script>
</body></html>`);
  win.document.close();
}

function fmtDate(dia: number | null, mes: number | null, anio: number | null, tipo: string): string {
  if (tipo === 'desconocida') return '';
  if (tipo === 'aproximada' && anio) return `≈${anio}`;
  if (dia && mes && anio) return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
  if (anio) return String(anio);
  return '';
}

function fmtLife(node: AncestorNode): string {
  const birth = fmtDate(node.nac_dia, node.nac_mes, node.nac_anio, node.nac_tipo);
  let status: string;
  if (node.fallecida) {
    const death = fmtDate(node.def_dia, node.def_mes, node.def_anio, node.def_tipo);
    status = death || 'Fallecido';
  } else {
    status = 'Vive';
  }
  return birth ? `${birth} – ${status}` : status;
}

function PersonCard({ node, onClick }: { node: AncestorNode; onClick: () => void }) {
  return (
    <div onClick={onClick} style={cardStyle}>
      <div style={cardNombre}>{node.nombre}</div>
      <div style={cardApellido}>{node.apellido}</div>
      <div style={cardLife}>{fmtLife(node)}</div>
    </div>
  );
}

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

// Bottom-to-top: current person at bottom, ancestors above
function VBranch({ node, gen, navigate }: { node: AncestorNode; gen: number; navigate: (id: number) => void }) {
  const padre = gen < MAX_GENS ? node.padre : undefined;
  const madre = gen < MAX_GENS ? node.madre : undefined;
  const hasParents = !!(padre || madre);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {hasParents && (
        <>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', borderBottom: '2px solid #d8d8d8' }}>
            {padre && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <VBranch node={padre} gen={gen + 1} navigate={navigate} />
                <div style={{ width: 2, height: 16, background: '#d8d8d8' }} />
              </div>
            )}
            {madre && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <VBranch node={madre} gen={gen + 1} navigate={navigate} />
                <div style={{ width: 2, height: 16, background: '#d8d8d8' }} />
              </div>
            )}
          </div>
          <div style={{ width: 2, height: 16, background: '#d8d8d8', flexShrink: 0 }} />
        </>
      )}
      <PersonCard node={node} onClick={() => navigate(node.id)} />
    </div>
  );
}

export default function ArbolPage() {
  const navigate = useNavigate();
  const [rootId, setRootId] = useState<number | null>(null);
  const [rootName, setRootName] = useState<string>('');
  const [root, setRoot] = useState<AncestorNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>('vertical');
  const [view, setView] = useState<View>('bio');
  const [showPrint, setShowPrint] = useState(false);

  async function loadTree(id: number, v: View) {
    setLoading(true);
    try {
      const tree = await personasApi.ancestros(id, MAX_GENS, v);
      setRoot(tree);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([
      configApi.get(CFG_ROOT),
      configApi.get(CFG_ROOT_NAME),
      configApi.get(CFG_ORIENTATION),
      configApi.get(CFG_VIEW),
    ]).then(([id, name, orient, v]) => {
      const savedOrientation = (orient as Orientation) || 'vertical';
      const savedView = (v as View) || 'bio';
      setOrientation(savedOrientation);
      setView(savedView);
      if (!id) return;
      const numId = Number(id);
      setRootId(numId);
      setRootName(name ?? '');
      loadTree(numId, savedView);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function changeOrientation(o: Orientation) {
    setOrientation(o);
    await configApi.set(CFG_ORIENTATION, o);
  }

  async function changeView(v: View) {
    setView(v);
    await configApi.set(CFG_VIEW, v);
    if (rootId) loadTree(rootId, v);
  }

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
            <div style={toggleGroup}>
              <button style={{ ...toggleBtn, ...(view === 'bio' ? toggleActive : {}) }} onClick={() => changeView('bio')}>Biológico</button>
              <button style={{ ...toggleBtn, ...(view === 'adoptivo' ? toggleActive : {}) }} onClick={() => changeView('adoptivo')}>Adoptivo</button>
            </div>
            <div style={toggleGroup}>
              <button style={{ ...toggleBtn, ...(orientation === 'horizontal' ? toggleActive : {}) }} onClick={() => changeOrientation('horizontal')} title="Horizontal">↔</button>
              <button style={{ ...toggleBtn, ...(orientation === 'vertical' ? toggleActive : {}) }} onClick={() => changeOrientation('vertical')} title="Vertical">↕</button>
            </div>
            <div style={{ position: 'relative' }}>
              <button style={printBtn} onClick={() => setShowPrint(s => !s)}>Imprimir</button>
              {showPrint && (
                <div style={printDropdown}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#888', fontWeight: 600 }}>Tamaño de hoja</p>
                  {PAPER_SIZES.map(p => (
                    <button key={p.css} style={printOption}
                      onClick={() => { setShowPrint(false); printTree(p.w, p.h, p.css); }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!root && !loading && (
        <div style={searchCard}>
          <p style={{ color: '#555', marginBottom: 12, fontSize: '0.9rem' }}>
            Buscá una persona para ver su árbol de ancestros (hasta 5 generaciones).
          </p>
          <PersonaSearchInput placeholder="Buscar persona raíz..." onSelect={handleSelect} allowCreate={false} />
        </div>
      )}

      {loading && <div style={{ color: '#999', fontSize: '0.9rem', marginTop: 8 }}>Cargando...</div>}

      {root && !loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: '0.9rem', color: '#555' }}>
              Árbol de <strong>{rootName || `${root.apellido}, ${root.nombre}`}</strong>
            </span>
            <button onClick={handleCambiar} style={changeBtn}>Cambiar</button>
          </div>
          <div style={{ overflowX: 'auto', overflowY: 'auto', paddingBottom: 24 }}>
            <div id="arbol-tree-content" style={{ display: 'inline-block', padding: '16px 8px' }}>
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

const cardStyle: React.CSSProperties = {
  width: 148, height: 76, flexShrink: 0,
  border: '1px solid #e4e4e4', borderRadius: 6, background: '#fff',
  cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: '6px 8px', boxSizing: 'border-box', gap: 1,
};
const cardNombre: React.CSSProperties = { fontWeight: 700, fontSize: '0.82rem', color: '#1a1a1a', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const cardApellido: React.CSSProperties = { fontWeight: 400, fontSize: '0.82rem', color: '#444', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const cardLife: React.CSSProperties = { fontSize: '0.68rem', color: '#aaa', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 3 };
const searchCard: React.CSSProperties = { background: '#fff', border: '1px solid #e4e4e4', borderRadius: 8, padding: 20, maxWidth: 420 };
const backBtn: React.CSSProperties = { background: 'none', border: '1px solid #ddd', borderRadius: 4, padding: '5px 12px', cursor: 'pointer', fontSize: '0.85rem', color: '#555' };
const changeBtn: React.CSSProperties = { background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: '0.8rem', color: '#666' };
const toggleGroup: React.CSSProperties = { display: 'flex', border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' };
const toggleBtn: React.CSSProperties = { border: 'none', background: '#f5f5f5', cursor: 'pointer', padding: '5px 11px', fontSize: '0.82rem', color: '#555' };
const toggleActive: React.CSSProperties = { background: '#1a1a1a', color: '#fff' };
const printBtn: React.CSSProperties = { border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer', padding: '5px 11px', borderRadius: 4, fontSize: '0.82rem', color: '#555' };
const printDropdown: React.CSSProperties = {
  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
  background: '#fff', border: '1px solid #ddd', borderRadius: 6,
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '10px 12px',
  display: 'flex', flexDirection: 'column', gap: 4, minWidth: 210,
};
const printOption: React.CSSProperties = {
  border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
  padding: '6px 8px', borderRadius: 4, fontSize: '0.82rem', color: '#333',
  fontFamily: 'monospace',
};

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { personasApi, configApi } from '../api/client';
import type { AncestorNode, SiblingNode } from '../types';
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

const MARGIN_OPTIONS = [5, 10, 15, 20, 25] as const;

type PersonBase = Pick<AncestorNode, 'id' | 'nombre' | 'apellido' | 'sexo' | 'fallecida' | 'nac_dia' | 'nac_mes' | 'nac_anio' | 'nac_tipo' | 'def_dia' | 'def_mes' | 'def_anio' | 'def_tipo'>;

function fmtDate(dia: number | null, mes: number | null, anio: number | null, tipo: string): string {
  if (tipo === 'desconocida') return '';
  if (tipo === 'aproximada' && anio) return `≈${anio}`;
  if (dia && mes && anio) return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
  if (anio) return String(anio);
  return '';
}

function fmtYears(node: PersonBase): string {
  const b = node.nac_anio && node.nac_tipo !== 'desconocida'
    ? (node.nac_tipo === 'aproximada' ? `≈${node.nac_anio}` : String(node.nac_anio))
    : '';
  const d = node.fallecida
    ? (node.def_anio && node.def_tipo !== 'desconocida'
      ? (node.def_tipo === 'aproximada' ? `≈${node.def_anio}` : String(node.def_anio))
      : '')
    : '';
  if (b && node.fallecida) return `${b} – ${d || '?'}`;
  if (b) return `n. ${b}`;
  if (node.fallecida && d) return `† ${d}`;
  return node.fallecida ? 'Fallecido' : 'Vive';
}

function PersonAvatar({ sexo }: { sexo: string }) {
  const isMale = sexo === 'M';
  const isFemale = sexo === 'F';
  const bg = isMale ? '#dbeafe' : isFemale ? '#fce7f3' : '#f3f4f6';
  const fill = isMale ? '#2563eb' : isFemale ? '#be185d' : '#9ca3af';
  return (
    <div style={{ width: 48, height: 48, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill={fill}>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21c0-4.4 3.58-8 8-8s8 3.6 8 8" />
      </svg>
    </div>
  );
}

function PersonCard({ node, onClick, isRoot }: { node: PersonBase; onClick: () => void; isRoot?: boolean }) {
  return (
    <div onClick={onClick} style={{ ...cardStyle, ...(isRoot ? cardRootHighlight : {}) }}>
      <PersonAvatar sexo={node.sexo} />
      <div style={cardNombre}>{node.nombre}</div>
      <div style={cardApellido}>{node.apellido}</div>
      <div style={cardLife}>{fmtYears(node)}</div>
    </div>
  );
}

type SlotProps = {
  navigate: (id: number) => void;
  expandedIds: Set<number>;
  lazyData: Map<number, { pareja?: SiblingNode; hijos: SiblingNode[] }>;
  loadingIds: Set<number>;
  onToggle: (id: number, hasPreloaded: boolean) => void;
};

// PersonSlot: renders one person card + their partner + expandable children
// excludeChildId: child already shown in the ancestor chain — excluded from the hijos expand
// hidePareja: suppress pareja display (ancestor nodes — partner is shown as a separate branch)
// hideChildren: suppress ↓ expand button (ancestor nodes — expansion creates wrong generation level)
function PersonSlot({ node, isRoot, excludeChildId, hidePareja, hideChildren, navigate, expandedIds, lazyData, loadingIds, onToggle }: {
  node: SiblingNode; isRoot?: boolean; excludeChildId?: number; hidePareja?: boolean; hideChildren?: boolean;
} & SlotProps) {
  const lazy = lazyData.get(node.id);
  const pareja = hidePareja ? undefined : (lazy?.pareja ?? node.pareja);
  const rawHijos = lazy?.hijos ?? node.hijos ?? [];
  const hijos = excludeChildId != null ? rawHijos.filter(h => h.id !== excludeChildId) : rawHijos;
  const hijosLoaded = lazy != null || node.hijos != null;
  const hasChildren = !hideChildren && (hijos.length > 0 || (!hijosLoaded && (node.hasHijos ?? false)));
  const expanded = expandedIds.has(node.id);
  const loading = loadingIds.has(node.id);
  const hasPreloaded = hijosLoaded;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <PersonCard node={node as PersonBase} onClick={() => navigate(node.id)} isRoot={isRoot} />
        {pareja && (
          <>
            <div style={{ width: 10, height: 2, background: '#d8d8d8' }} />
            <PersonCard node={pareja as PersonBase} onClick={() => navigate(pareja.id)} />
          </>
        )}
      </div>
      {hasChildren && (
        <button
          onClick={() => onToggle(node.id, hasPreloaded)}
          disabled={loading}
          style={expandDownBtn}
        >
          {loading ? '…' : expanded ? '▲' : '▼'}
        </button>
      )}
      {expanded && !hideChildren && hijos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 2, height: 8, background: '#d8d8d8' }} />
          <div style={{ display: 'flex', gap: 8, borderTop: '2px solid #d8d8d8', alignItems: 'flex-start' }}>
            {hijos.map(child => (
              <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 8, background: '#d8d8d8' }} />
                <PersonSlot
                  node={child} navigate={navigate}
                  expandedIds={expandedIds} lazyData={lazyData}
                  loadingIds={loadingIds} onToggle={onToggle}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HBranch (horizontal mode: tree grows right, siblings stack above/below) ──

function HBranch({ node, gen, siblings, excludeChildId, sibsVisible, onToggleSibs,
  navigate, expandedIds, lazyData, loadingIds, onToggle }: {
  node: AncestorNode; gen: number; siblings?: SiblingNode[];
  excludeChildId?: number; sibsVisible?: boolean; onToggleSibs?: () => void;
} & SlotProps) {
  const padre = gen < MAX_GENS ? node.padre : undefined;
  const madre = gen < MAX_GENS ? node.madre : undefined;
  const hasParents = !!(padre || madre);
  const sibList = siblings ?? [];
  const hasSiblings = sibList.length > 0;
  const isMale = node.sexo !== 'F';
  const slotProps: SlotProps = { navigate, expandedIds, lazyData, loadingIds, onToggle };

  // In horizontal mode siblings stack vertically (above for M, below for F)
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        {/* Siblings above root (male) */}
        {hasSiblings && sibsVisible && isMale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            {sibList.map(s => <PersonSlot key={s.id} node={s} {...slotProps} />)}
          </div>
        )}
        {/* Toggle button above card (male) */}
        {hasSiblings && isMale && onToggleSibs && (
          <button onClick={onToggleSibs} style={sibToggleBtn} title={sibsVisible ? 'Ocultar hermanos' : 'Ver hermanos'}>
            {sibsVisible ? '▼' : '▲'}
          </button>
        )}

        <PersonSlot
          node={node as unknown as SiblingNode}
          isRoot={gen === 1}
          excludeChildId={excludeChildId}
          hidePareja={gen > 1}
          hideChildren={gen > 1}
          {...slotProps}
        />

        {/* Toggle button below card (female) */}
        {hasSiblings && !isMale && onToggleSibs && (
          <button onClick={onToggleSibs} style={sibToggleBtn} title={sibsVisible ? 'Ocultar hermanos' : 'Ver hermanos'}>
            {sibsVisible ? '▲' : '▼'}
          </button>
        )}
        {/* Siblings below root (female) */}
        {hasSiblings && sibsVisible && !isMale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            {sibList.map(s => <PersonSlot key={s.id} node={s} {...slotProps} />)}
          </div>
        )}
      </div>

      {hasParents && (
        <>
          <div style={{ width: 8, height: 2, background: '#d8d8d8', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ width: 8, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              {padre && madre ? (
                <>
                  <div style={{ flex: 1, borderRight: '2px solid #d8d8d8', borderBottom: '2px solid #d8d8d8', borderBottomRightRadius: 6 }} />
                  <div style={{ flex: 1, borderRight: '2px solid #d8d8d8', borderTop: '2px solid #d8d8d8', borderTopRightRadius: 6 }} />
                </>
              ) : (
                <div style={{ flex: 1, borderRight: '2px solid #d8d8d8' }} />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {padre && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 8, height: 2, background: '#d8d8d8', flexShrink: 0 }} />
                  <HBranch node={padre} gen={gen + 1} excludeChildId={node.id} {...slotProps} />
                </div>
              )}
              {madre && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 8, height: 2, background: '#d8d8d8', flexShrink: 0 }} />
                  <HBranch node={madre} gen={gen + 1} excludeChildId={node.id} {...slotProps} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── VBranch (vertical mode: tree grows up, siblings go left/right) ──────────

function VBranch({ node, gen, siblings, excludeChildId, sibsVisible, onToggleSibs,
  navigate, expandedIds, lazyData, loadingIds, onToggle }: {
  node: AncestorNode; gen: number; siblings?: SiblingNode[];
  excludeChildId?: number; sibsVisible?: boolean; onToggleSibs?: () => void;
} & SlotProps) {
  const padre = gen < MAX_GENS ? node.padre : undefined;
  const madre = gen < MAX_GENS ? node.madre : undefined;
  const hasParents = !!(padre || madre);
  const sibList = siblings ?? [];
  const hasSiblings = sibList.length > 0;
  const isMale = node.sexo !== 'F';
  const slotProps: SlotProps = { navigate, expandedIds, lazyData, loadingIds, onToggle };

  // In vertical mode siblings go left (M) or right (F) of root card
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {hasParents && (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', borderBottom: '2px solid #d8d8d8' }}>
            {padre && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <VBranch node={padre} gen={gen + 1} excludeChildId={node.id} {...slotProps} />
                <div style={{ width: 2, height: 10, background: '#d8d8d8' }} />
              </div>
            )}
            {madre && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <VBranch node={madre} gen={gen + 1} excludeChildId={node.id} {...slotProps} />
                <div style={{ width: 2, height: 10, background: '#d8d8d8' }} />
              </div>
            )}
          </div>
          <div style={{ width: 2, height: 10, background: '#d8d8d8', flexShrink: 0 }} />
        </>
      )}

      {/* Root row with optional siblings on sides */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* Siblings left + connector (male) */}
        {hasSiblings && sibsVisible && isMale && (
          <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              {sibList.map(s => <PersonSlot key={s.id} node={s} {...slotProps} />)}
            </div>
            <div style={{ width: 8, height: 2, background: '#d8d8d8', marginTop: 74 }} />
          </>
        )}
        {/* Left arrow button (male) */}
        {hasSiblings && isMale && onToggleSibs && (
          <button onClick={onToggleSibs} style={{ ...sibToggleBtn, marginTop: 62 }} title={sibsVisible ? 'Ocultar hermanos' : 'Ver hermanos'}>
            {sibsVisible ? '▶' : '◀'}
          </button>
        )}

        <PersonSlot
          node={node as unknown as SiblingNode}
          isRoot={gen === 1}
          excludeChildId={excludeChildId}
          hidePareja={gen > 1}
          hideChildren={gen > 1}
          {...slotProps}
        />

        {/* Right arrow button (female) */}
        {hasSiblings && !isMale && onToggleSibs && (
          <button onClick={onToggleSibs} style={{ ...sibToggleBtn, marginTop: 62 }} title={sibsVisible ? 'Ocultar hermanos' : 'Ver hermanos'}>
            {sibsVisible ? '◀' : '▶'}
          </button>
        )}
        {/* Siblings right + connector (female) */}
        {hasSiblings && sibsVisible && !isMale && (
          <>
            <div style={{ width: 8, height: 2, background: '#d8d8d8', marginTop: 74 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              {sibList.map(s => <PersonSlot key={s.id} node={s} {...slotProps} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PDF Export Modal ────────────────────────────────────────────────────────

function PdfExportModal({ root, orientation, onClose }: {
  root: AncestorNode;
  orientation: Orientation;
  onClose: () => void;
}) {
  const [paperIdx, setPaperIdx] = useState(1); // default A3
  const [orientMode, setOrientMode] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [marginsMm, setMarginsMm] = useState(15);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const treeRef = useRef<HTMLDivElement>(null);

  const paper = PAPER_SIZES[paperIdx];

  const treeEl = document.getElementById('arbol-tree-content');
  const treeW = treeEl?.scrollWidth ?? 600;
  const treeH = treeEl?.scrollHeight ?? 400;

  const autoLandscape = treeW > treeH;
  const effectiveLandscape = orientMode === 'auto' ? autoLandscape
    : orientMode === 'landscape';

  const pageW = effectiveLandscape ? paper.h : paper.w;
  const pageH = effectiveLandscape ? paper.w : paper.h;

  const mmToPx = 96 / 25.4;
  const pdfScale = Math.min(
    (pageW - 2 * marginsMm) * mmToPx / treeW,
    (pageH - 2 * marginsMm) * mmToPx / treeH
  );
  const scalePercent = Math.round(pdfScale * 100);

  const PREV_MAX_W = 440;
  const PREV_MAX_H = 340;
  const paperRatio = Math.min(PREV_MAX_W / pageW, PREV_MAX_H / pageH);
  const prevPaperW = pageW * paperRatio;
  const prevPaperH = pageH * paperRatio;

  const prevTreeScale = Math.min(
    (pageW - 2 * marginsMm) * paperRatio / treeW,
    (pageH - 2 * marginsMm) * paperRatio / treeH
  );
  const prevMarginPx = marginsMm * paperRatio;

  async function handleSave() {
    setSaving(true);
    setError('');
    const treeHtml = treeRef.current?.innerHTML ?? '';
    const result = await window.electronAPI?.saveTreePdf({
      treeHtml, treeW, treeH,
      pageSize: paper.css,
      landscape: effectiveLandscape,
      marginsMm,
    });
    setSaving(false);
    if (result?.ok) {
      onClose();
    } else if (result && !result.canceled) {
      setError(result.error ?? 'Error al guardar');
    }
  }

  const noopToggle = () => {};
  const emptySet = new Set<number>();
  const emptyMap = new Map<number, { pareja?: SiblingNode; hijos: SiblingNode[] }>();

  return (
    <div style={pdfOverlay}>
      <div style={pdfDialog}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Guardar como PDF</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#888' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 180 }}>
            <div style={settingRow}>
              <label style={settingLabel}>Tamaño</label>
              <select value={paperIdx} onChange={e => setPaperIdx(Number(e.target.value))} style={selectStyle}>
                {PAPER_SIZES.map((p, i) => (
                  <option key={i} value={i}>{p.label}</option>
                ))}
              </select>
            </div>

            <div style={settingRow}>
              <label style={settingLabel}>Orientación</label>
              <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
                {(['auto', 'portrait', 'landscape'] as const).map(m => (
                  <button key={m} onClick={() => setOrientMode(m)}
                    style={{ ...miniToggle, ...(orientMode === m ? miniToggleActive : {}) }}>
                    {m === 'auto' ? 'Auto' : m === 'portrait' ? '↕' : '↔'}
                  </button>
                ))}
              </div>
            </div>

            <div style={settingRow}>
              <label style={settingLabel}>Márgenes</label>
              <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
                {MARGIN_OPTIONS.map(m => (
                  <button key={m} onClick={() => setMarginsMm(m)}
                    style={{ ...miniToggle, ...(marginsMm === m ? miniToggleActive : {}) }}>
                    {m}mm
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#888', paddingTop: 4 }}>
              <div>Hoja: {pageW} × {pageH} mm</div>
              <div>Escala: <strong style={{ color: scalePercent < 30 ? '#c00' : '#333' }}>{scalePercent}%</strong></div>
              {scalePercent < 30 && (
                <div style={{ color: '#c00', marginTop: 4, fontSize: '0.75rem' }}>
                  El árbol es muy grande para esta hoja. Probá A1 o A0.
                </div>
              )}
            </div>

            {error && <div style={{ color: '#c00', fontSize: '0.82rem' }}>{error}</div>}

            <button onClick={handleSave} disabled={saving} style={savePdfBtn}>
              {saving ? 'Guardando...' : 'Guardar PDF'}
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#aaa' }}>Vista previa</p>
            <div style={{
              width: prevPaperW, height: prevPaperH,
              background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
              position: 'relative', overflow: 'hidden', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute',
                top: prevMarginPx, left: prevMarginPx,
                width: prevPaperW - 2 * prevMarginPx,
                height: prevPaperH - 2 * prevMarginPx,
                border: '1px dashed #e0e0e0',
                overflow: 'hidden',
              }}>
                <div style={{
                  transformOrigin: 'top left',
                  transform: `scale(${prevTreeScale})`,
                  display: 'inline-block',
                }}>
                  <div ref={treeRef}>
                    {orientation === 'horizontal'
                      ? <HBranch node={root} gen={1} navigate={() => {}} siblings={root.hermanos}
                          expandedIds={emptySet} lazyData={emptyMap} loadingIds={emptySet} onToggle={noopToggle} />
                      : <VBranch node={root} gen={1} navigate={() => {}} siblings={root.hermanos}
                          expandedIds={emptySet} lazyData={emptyMap} loadingIds={emptySet} onToggle={noopToggle} />
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ArbolPage() {
  const navigate = useNavigate();
  const [rootId, setRootId] = useState<number | null>(null);
  const [rootName, setRootName] = useState<string>('');
  const [root, setRoot] = useState<AncestorNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>('vertical');
  const [view, setView] = useState<View>('bio');
  const [showPdf, setShowPdf] = useState(false);

  const [sibsVisible, setSibsVisible] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [lazyData, setLazyData] = useState<Map<number, { pareja?: SiblingNode; hijos: SiblingNode[] }>>(new Map());
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  async function handleToggle(id: number, hasPreloaded: boolean) {
    if (expandedIds.has(id)) {
      setExpandedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      return;
    }
    if (!hasPreloaded && !lazyData.has(id)) {
      setLoadingIds(prev => new Set([...prev, id]));
      try {
        const data = await personasApi.descendientes(id);
        setLazyData(prev => new Map([...prev, [id, data]]));
      } finally {
        setLoadingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      }
    }
    setExpandedIds(prev => new Set([...prev, id]));
  }

  async function loadTree(id: number, v: View) {
    setLoading(true);
    setExpandedIds(new Set());
    setLazyData(new Map());
    setSibsVisible(false);
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
    setSibsVisible(false);
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

  const branchProps: SlotProps = {
    navigate: goTo,
    expandedIds,
    lazyData,
    loadingIds,
    onToggle: handleToggle,
  };

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
            <button style={pdfBtn} onClick={() => setShowPdf(true)}>Guardar PDF</button>
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
                ? <HBranch
                    node={root} gen={1}
                    siblings={root.hermanos}
                    sibsVisible={sibsVisible}
                    onToggleSibs={() => setSibsVisible(v => !v)}
                    {...branchProps}
                  />
                : <VBranch
                    node={root} gen={1}
                    siblings={root.hermanos}
                    sibsVisible={sibsVisible}
                    onToggleSibs={() => setSibsVisible(v => !v)}
                    {...branchProps}
                  />
              }
            </div>
          </div>
        </>
      )}

      {showPdf && root && (
        <PdfExportModal root={root} orientation={orientation} onClose={() => setShowPdf(false)} />
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const cardRootHighlight: React.CSSProperties = { border: '2px solid #1a1a1a', boxShadow: '0 2px 8px rgba(0,0,0,0.13)' };
const cardStyle: React.CSSProperties = {
  width: 115, height: 148, flexShrink: 0,
  border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff',
  cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '14px 8px 10px', boxSizing: 'border-box', gap: 4,
};
const cardNombre: React.CSSProperties = {
  fontWeight: 700, fontSize: '0.78rem', color: '#1a1a1a', textAlign: 'center', width: '100%',
  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.25',
};
const cardApellido: React.CSSProperties = { fontWeight: 400, fontSize: '0.75rem', color: '#555', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const cardLife: React.CSSProperties = { fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 };
const searchCard: React.CSSProperties = { background: '#fff', border: '1px solid #e4e4e4', borderRadius: 8, padding: 20, maxWidth: 420 };
const backBtn: React.CSSProperties = { background: 'none', border: '1px solid #ddd', borderRadius: 4, padding: '5px 12px', cursor: 'pointer', fontSize: '0.85rem', color: '#555' };
const changeBtn: React.CSSProperties = { background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: '0.8rem', color: '#666' };
const toggleGroup: React.CSSProperties = { display: 'flex', border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' };
const toggleBtn: React.CSSProperties = { border: 'none', background: '#f5f5f5', cursor: 'pointer', padding: '5px 11px', fontSize: '0.82rem', color: '#555' };
const toggleActive: React.CSSProperties = { background: '#1a1a1a', color: '#fff' };
const pdfBtn: React.CSSProperties = { border: '1px solid #1a1a1a', background: '#1a1a1a', color: '#fff', cursor: 'pointer', padding: '5px 12px', borderRadius: 4, fontSize: '0.82rem', fontWeight: 600 };

const expandDownBtn: React.CSSProperties = {
  background: 'none', border: '1px solid #ddd', borderRadius: 10,
  cursor: 'pointer', fontSize: '0.62rem', color: '#999',
  padding: '1px 8px', marginTop: 5, lineHeight: 1.5,
};
const sibToggleBtn: React.CSSProperties = {
  background: '#fff', border: '1px solid #d0d0d0', borderRadius: '50%',
  width: 22, height: 22, minWidth: 22,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', fontSize: '0.6rem', color: '#aaa', padding: 0,
  flexShrink: 0, lineHeight: 1,
};

const pdfOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
};
const pdfDialog: React.CSSProperties = {
  background: '#fafafa', borderRadius: 10, padding: 28,
  width: '90vw', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
};
const settingRow: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5 };
const settingLabel: React.CSSProperties = { fontSize: '0.78rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' };
const selectStyle: React.CSSProperties = { padding: '5px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.85rem', background: '#fff' };
const miniToggle: React.CSSProperties = { border: 'none', background: '#f5f5f5', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', color: '#555' };
const miniToggleActive: React.CSSProperties = { background: '#1a1a1a', color: '#fff' };
const savePdfBtn: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '10px 0', borderRadius: 5, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', marginTop: 8 };

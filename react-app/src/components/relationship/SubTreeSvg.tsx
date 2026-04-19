// react-app/src/components/relationship/SubTreeSvg.tsx
import { useEffect, useMemo, useRef, useState, useCallback, type PointerEvent, type WheelEvent } from 'react';
import type { Member } from '../../lib/types';
import type { Relation } from '../../lib/parenteSonghay';
import { useParenteLabels } from '../../hooks/useParenteLabels';

interface Props {
  relation: Relation;
  personA: Member;
  personB: Member;
  ancestor: Member;
  getMember: (id: string) => Member | undefined;
}

interface NodeBox {
  id: string;
  name: string;
  role: 'A' | 'B' | 'LCA' | 'mid';
  sex: 'M' | 'F';
  x: number;
  y: number;
  term?: string;
  gloss?: string;
}

interface EdgeLine {
  x1: number; y1: number; x2: number; y2: number;
  label: 'P' | 'M';
  mx: number; my: number;
}

const NODE_W = 150;
const NODE_H = 72;
const V_GAP = 100;   // espace vertical entre générations
const H_SIDE_OFFSET = 110; // décalage horizontal gauche/droite depuis le centre

function gloss(term: string, L: Record<string, string>): string | undefined {
  // Cherche une clé gloss.X dont le term.X correspond au terme donné (pour les termes atomiques).
  for (const k of Object.keys(L)) {
    if (k.startsWith('term.') && L[k] === term) {
      const glossKey = k.replace('term.', 'gloss.');
      if (L[glossKey]) return L[glossKey];
    }
  }
  return undefined;
}

export default function SubTreeSvg({ relation, personA, personB, ancestor, getMember }: Props) {
  const { labels } = useParenteLabels();
  const { boxes, edges, width, height } = useMemo(() => layout(relation, personA, personB, ancestor, getMember, labels),
    [relation, personA, personB, ancestor, getMember, labels]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ startX: number; startY: number; startPan: { x: number; y: number } } | null>(null);

  const resetView = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = viewportRef.current;
      const vw = el?.clientWidth || 800;
      const vh = el?.clientHeight || 440;
      const sx = vw / (width + 40);
      const sy = vh / (height + 40);
      const z = Math.max(0.3, Math.min(3, Math.min(sx, sy)));
      setZoom(z);
      setPan({ x: (vw - width * z) / 2, y: 20 });
    }));
  }, [width, height]);

  useEffect(() => { resetView(); }, [resetView]);

  const onPointerDown = (e: PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging({ startX: e.clientX, startY: e.clientY, startPan: pan });
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    setPan({ x: dragging.startPan.x + (e.clientX - dragging.startX), y: dragging.startPan.y + (e.clientY - dragging.startY) });
  };
  const onPointerUp = () => setDragging(null);

  const onWheel = (e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setZoom((z) => Math.max(0.3, Math.min(3, z * delta)));
  };

  return (
    <div className="parente-subtree-wrap">
      <div
        ref={viewportRef}
        className={`parente-subtree-viewport${dragging ? ' dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className="parente-subtree-inner"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width, height }}
        >
          <svg width={width} height={height} className="parente-subtree-svg">
            {edges.map((e, i) => (
              <g key={`edge-${i}`}>
                <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} className="parente-edge" />
                <g transform={`translate(${e.mx - 10}, ${e.my - 9})`}>
                  <rect width="20" height="18" rx="4" className="parente-edge-pm-bg" />
                  <text x="10" y="13" textAnchor="middle" className="parente-edge-pm-text">{e.label}</text>
                </g>
              </g>
            ))}
          </svg>
          {boxes.map((b) => (
            <div
              key={b.id}
              className={`parente-node role-${b.role} sex-${b.sex}`}
              style={{ left: b.x, top: b.y, width: NODE_W, height: NODE_H }}
              role="button"
              aria-label={`${b.name}, ${b.sex === 'F' ? 'femme' : 'homme'}`}
            >
              <div className="parente-node-name">{b.name}</div>
              {b.role !== 'mid' && (
                <div className="parente-node-tag">{b.role}</div>
              )}
              {b.term && (
                <div className="parente-node-term">
                  <em lang="son">« {b.term} »</em>
                  {b.gloss && <div className="parente-node-gloss">{b.gloss}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="parente-zoom-controls">
        <button onClick={() => setZoom((z) => Math.max(0.3, z / 1.15))} aria-label="Dézoomer">−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(3, z * 1.15))} aria-label="Zoomer">+</button>
        <button onClick={resetView} aria-label="Réinitialiser">⟲</button>
      </div>

      <div className="parente-legend">
        <span className="legend-item"><span className="dot a" /> Personne A</span>
        <span className="legend-item"><span className="dot b" /> Personne B</span>
        <span className="legend-item"><span className="dot lca" /> Ancêtre commun</span>
        <span className="legend-item"><span className="dot-pm">P</span> chaîne paternelle</span>
        <span className="legend-item"><span className="dot-pm">M</span> chaîne maternelle</span>
      </div>
    </div>
  );
}

function layout(
  r: Relation, A: Member, B: Member, lca: Member,
  getMember: (id: string) => Member | undefined,
  L: Record<string, string>,
): { boxes: NodeBox[]; edges: EdgeLine[]; width: number; height: number } {
  // La branche A remonte depuis A (bas-gauche) vers LCA (haut-centre).
  // pathA contient les hops (P ou M) de A vers LCA. Longueur = dA.
  // Ancêtres intermédiaires sont A.fatherId/motherId puis de proche en proche.
  const chainA: Member[] = [A];
  let cursor: Member | undefined = A;
  for (const hop of r.pathA) {
    if (!cursor) break;
    const nextId: string | null = hop === 'P' ? cursor.father_id : cursor.mother_ref;
    const next: Member | undefined = nextId ? getMember(nextId) ?? undefined : undefined;
    if (!next) break;
    chainA.push(next);
    cursor = next;
  }
  const chainB: Member[] = [B];
  cursor = B;
  for (const hop of r.pathB) {
    if (!cursor) break;
    const nextId: string | null = hop === 'P' ? cursor.father_id : cursor.mother_ref;
    const next: Member | undefined = nextId ? getMember(nextId) ?? undefined : undefined;
    if (!next) break;
    chainB.push(next);
    cursor = next;
  }

  // LCA est le dernier élément de chainA (et de chainB).
  const dA = r.distanceA;
  const dB = r.distanceB;
  const depth = Math.max(dA, dB);

  // LCA en haut centre. On prend un centre horizontal à x=H_SIDE_OFFSET + NODE_W/2
  const centerX = H_SIDE_OFFSET;
  const width = 2 * H_SIDE_OFFSET + NODE_W;
  const height = (depth + 1) * V_GAP + NODE_H;

  const boxes: NodeBox[] = [];
  const edges: EdgeLine[] = [];

  // Place LCA
  const lcaBox: NodeBox = {
    id: lca.id, name: lca.name, role: 'LCA', sex: lca.gender,
    x: centerX, y: 20,
  };
  if (dA === 0) lcaBox.role = 'A';
  else if (dB === 0) lcaBox.role = 'B';
  boxes.push(lcaBox);

  // Chaîne A (gauche) : du LCA descendant vers A
  // chainA[0] = A (niveau depth), chainA[dA] = LCA (niveau 0)
  for (let i = 1; i <= dA; i++) {
    const member = chainA[dA - i]; // descend
    const isA = i === dA;
    const finalX = centerX - H_SIDE_OFFSET;
    const y = 20 + i * V_GAP;
    const termA = isA ? r.termForA : undefined;
    boxes.push({
      id: member.id, name: member.name,
      role: isA ? 'A' : 'mid', sex: member.gender,
      x: finalX, y,
      term: termA,
      gloss: termA ? gloss(termA, L) : undefined,
    });
    // Arête depuis parent (niveau i-1) vers ce nœud (niveau i)
    const parentX = i === 1 ? lcaBox.x : finalX;
    const parentY = i === 1 ? lcaBox.y : 20 + (i - 1) * V_GAP;
    const hop = r.pathA[dA - i]; // hop entre parent et child
    edges.push({
      x1: parentX + NODE_W / 2, y1: parentY + NODE_H,
      x2: finalX + NODE_W / 2,  y2: y,
      label: hop,
      mx: (parentX + finalX) / 2 + NODE_W / 2,
      my: (parentY + NODE_H + y) / 2,
    });
  }

  // Chaîne B (droite)
  for (let i = 1; i <= dB; i++) {
    const member = chainB[dB - i];
    const isB = i === dB;
    const finalX = centerX + H_SIDE_OFFSET;
    const y = 20 + i * V_GAP;
    const termB = isB ? r.termForB : undefined;
    boxes.push({
      id: member.id, name: member.name,
      role: isB ? 'B' : 'mid', sex: member.gender,
      x: finalX, y,
      term: termB,
      gloss: termB ? gloss(termB, L) : undefined,
    });
    const parentX = i === 1 ? lcaBox.x : finalX;
    const parentY = i === 1 ? lcaBox.y : 20 + (i - 1) * V_GAP;
    const hop = r.pathB[dB - i];
    edges.push({
      x1: parentX + NODE_W / 2, y1: parentY + NODE_H,
      x2: finalX + NODE_W / 2,  y2: y,
      label: hop,
      mx: (parentX + finalX) / 2 + NODE_W / 2,
      my: (parentY + NODE_H + y) / 2,
    });
  }

  return { boxes, edges, width, height };
}

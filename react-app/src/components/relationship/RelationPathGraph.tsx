import { useState, useRef } from 'react';
import type { Member } from '../../lib/types';

interface Props {
  pathA: Member[];
  pathB: Member[];
  ancestor: Member;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const ZOOM_LEVELS = [0.6, 0.75, 0.9, 1, 1.15, 1.3];
const DEFAULT_ZOOM_INDEX = 3; // 100%

export default function RelationPathGraph({ pathA, pathB }: Props) {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const zoom = ZOOM_LEVELS[zoomIndex];

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setZoomIndex(DEFAULT_ZOOM_INDEX);
  };

  // pathA = [personA, ..., ancestor] (person going up to ancestor)
  // pathB = [personB, ..., ancestor] (person going up to ancestor)
  // Linear horizontal path: personA → ... → ancestor → ... → personB
  const afterAncestor = [...pathB].slice(0, -1).reverse();
  const linearPath = [...pathA, ...afterAncestor];
  const ancestorIndex = pathA.length - 1;

  if (linearPath.length < 2) return null;

  const elements: React.ReactNode[] = [];

  linearPath.forEach((m, i) => {
    const isSource = i === 0;
    const isTarget = i === linearPath.length - 1;
    const isAncestor = i === ancestorIndex;

    let nodeClass = 'parente-nd';
    if (isSource) nodeClass += ' src';
    if (isTarget) nodeClass += ' tgt';
    if (isAncestor) nodeClass += ' anc';

    if (i > 0) {
      elements.push(<div key={`co-${i}`} className="parente-co" />);
    }

    elements.push(
      <div key={`nd-${m.id}-${i}`} className={nodeClass}>
        <div className="parente-nc">{getInitials(m.name)}</div>
        <div className="parente-nn">
          {m.name}
          {m.alias && <span className="parente-alias">({m.alias})</span>}
        </div>
        <div className="parente-ng">
          {m.gender === 'F' ? '\u2640' : '\u2642'} G{m.generation}
        </div>
      </div>,
    );
  });

  const treeContent = (
    <>
      <div className="parente-hp-header">
        <div className="parente-hp-l">Chemin dans l&apos;arbre</div>
        <div className="parente-hp-controls">
          <button
            className="parente-zoom-btn"
            onClick={handleZoomOut}
            disabled={zoomIndex === 0}
            title="Dézoomer"
          >
            −
          </button>
          <button
            className="parente-zoom-btn parente-zoom-reset"
            onClick={handleReset}
            title="Réinitialiser"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            className="parente-zoom-btn"
            onClick={handleZoomIn}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            title="Zoomer"
          >
            +
          </button>
          <button
            className="parente-zoom-btn parente-fullscreen-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Réduire' : 'Agrandir'}
          >
            {isFullscreen ? '⤓' : '⤢'}
          </button>
        </div>
      </div>
      <div
        className="parente-hp-scroll"
        ref={containerRef}
      >
        <div
          className="parente-hp-t"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          {elements}
        </div>
      </div>
    </>
  );

  if (isFullscreen) {
    return (
      <div className="parente-hp-fullscreen-overlay" onClick={() => setIsFullscreen(false)}>
        <div className="parente-hp-fullscreen" onClick={(e) => e.stopPropagation()}>
          {treeContent}
        </div>
      </div>
    );
  }

  return <div className="parente-hp">{treeContent}</div>;
}

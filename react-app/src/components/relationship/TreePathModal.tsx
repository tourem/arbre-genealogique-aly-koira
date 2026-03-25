import { useState } from 'react';
import type { Member } from '../../lib/types';

interface Props {
  pathA: Member[];
  pathB: Member[];
  ancestor: Member;
  personAName: string;
  personBName: string;
  onClose: () => void;
}

const ZOOM_LEVELS = [0.5, 0.65, 0.8, 1, 1.2, 1.4];
const DEFAULT_ZOOM_INDEX = 3;

export default function TreePathModal({
  pathA,
  pathB,
  ancestor,
  personAName,
  personBName,
  onClose,
}: Props) {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const zoom = ZOOM_LEVELS[zoomIndex];

  // pathA = [personA, ..., ancestor] → reverse minus last to get ancestor→...→personA
  const branchA = [...pathA].reverse().slice(1);
  // pathB = [personB, ..., ancestor] → reverse minus last to get ancestor→...→personB
  const branchB = [...pathB].reverse().slice(1);

  const renderBranch = (steps: Member[], endpointName: string) => (
    <div className="relation-graph-branch">
      {steps.map((m, i) => (
        <div className="relation-graph-step" key={`${m.id}-${i}`}>
          <div className="relation-graph-vline-branch" />
          <div
            className={`relation-graph-node${i === steps.length - 1 ? ' endpoint' : ''}`}
          >
            <span className="relation-graph-icon">
              {m.gender === 'F' ? '\u2640' : '\u2642'}
            </span>
            <span className="relation-graph-name">
              {m.name}
              {m.alias && <span className="relation-graph-alias"> ({m.alias})</span>}
            </span>
          </div>
        </div>
      ))}
      {steps.length === 0 && (
        <div className="relation-graph-direct">
          {endpointName} (direct)
        </div>
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content tree-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Arbre g&eacute;n&eacute;alogique</h3>
          <div className="tree-modal-controls">
            <button
              className="tree-zoom-btn"
              onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
              disabled={zoomIndex === 0}
              title="Dézoomer"
            >
              −
            </button>
            <span className="tree-zoom-level">{Math.round(zoom * 100)}%</span>
            <button
              className="tree-zoom-btn"
              onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
              disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              title="Zoomer"
            >
              +
            </button>
          </div>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body tree-modal-body">
          <div className="tree-scroll-container">
            <div
              className="relation-graph"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            >
              {/* Ancestor at top */}
              <div className="relation-graph-ancestor">
                <div className="relation-graph-node ancestor-node">
                  <span className="relation-graph-icon">
                    {ancestor.gender === 'F' ? '\u2640' : '\u2642'}
                  </span>
                  <span className="relation-graph-name">
                    {ancestor.name}
                    {ancestor.alias && <span className="relation-graph-alias"> ({ancestor.alias})</span>}
                  </span>
                </div>
              </div>

              {/* Fork */}
              <div className="relation-graph-fork">
                <div className="relation-graph-vline" />
                <div className="relation-graph-hline" />
              </div>

              {/* Two descending branches */}
              <div className="relation-graph-branches">
                {renderBranch(branchA, personAName)}
                {renderBranch(branchB, personBName)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

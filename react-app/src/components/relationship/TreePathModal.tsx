import type { Member } from '../../lib/types';

interface Props {
  pathA: Member[];
  pathB: Member[];
  ancestor: Member;
  personAName: string;
  personBName: string;
  onClose: () => void;
}

export default function TreePathModal({
  pathA,
  pathB,
  ancestor,
  personAName,
  personBName,
  onClose,
}: Props) {
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
            <span className="relation-graph-name">{m.name}</span>
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
        className="modal-content"
        style={{ maxWidth: 600 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Arbre g&eacute;n&eacute;alogique</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="relation-graph">
            {/* Ancestor at top */}
            <div className="relation-graph-ancestor">
              <div className="relation-graph-node ancestor-node">
                <span className="relation-graph-icon">
                  {ancestor.gender === 'F' ? '\u2640' : '\u2642'}
                </span>
                <span className="relation-graph-name">{ancestor.name}</span>
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
  );
}

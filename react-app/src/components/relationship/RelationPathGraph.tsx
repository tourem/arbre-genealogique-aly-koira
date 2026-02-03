import type { Member } from '../../lib/types';

interface Props {
  pathA: Member[];
  pathB: Member[];
  ancestor: Member;
}

export default function RelationPathGraph({ pathA, pathB, ancestor }: Props) {
  // pathA goes from personA up to ancestor
  // pathB goes from personB up to ancestor
  const nodesA = [...pathA].reverse(); // ancestor first
  const nodesB = [...pathB].reverse();

  // Remove ancestor duplicate from branches (it's shown at the top)
  const branchA = nodesA.slice(1);
  const branchB = nodesB.slice(1);

  return (
    <div className="relation-graph">
      {/* Ancestor at top center */}
      <div className="relation-graph-ancestor">
        <div className="relation-graph-node ancestor-node">
          <span className="relation-graph-icon">
            {ancestor.gender === 'F' ? '\u2640' : '\u2642'}
          </span>
          <span className="relation-graph-name">{ancestor.name}</span>
        </div>
      </div>

      {/* Fork line */}
      {(branchA.length > 0 || branchB.length > 0) && (
        <div className="relation-graph-fork">
          <div className="relation-graph-vline" />
          <div className="relation-graph-hline" />
        </div>
      )}

      {/* Two branches */}
      <div className="relation-graph-branches">
        {/* Left branch (A) */}
        <div className="relation-graph-branch">
          {branchA.map((m, i) => (
            <div key={m.id} className="relation-graph-step">
              {i > 0 && <div className="relation-graph-vline-branch" />}
              <div
                className={`relation-graph-node${i === branchA.length - 1 ? ' endpoint' : ''}`}
              >
                <span className="relation-graph-icon">
                  {m.gender === 'F' ? '\u2640' : '\u2642'}
                </span>
                <span className="relation-graph-name">{m.name}</span>
              </div>
            </div>
          ))}
          {branchA.length === 0 && (
            <div className="relation-graph-step">
              <div className="relation-graph-node endpoint">
                <span className="relation-graph-name relation-graph-direct">
                  (direct)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right branch (B) */}
        <div className="relation-graph-branch">
          {branchB.map((m, i) => (
            <div key={m.id} className="relation-graph-step">
              {i > 0 && <div className="relation-graph-vline-branch" />}
              <div
                className={`relation-graph-node${i === branchB.length - 1 ? ' endpoint' : ''}`}
              >
                <span className="relation-graph-icon">
                  {m.gender === 'F' ? '\u2640' : '\u2642'}
                </span>
                <span className="relation-graph-name">{m.name}</span>
              </div>
            </div>
          ))}
          {branchB.length === 0 && (
            <div className="relation-graph-step">
              <div className="relation-graph-node endpoint">
                <span className="relation-graph-name relation-graph-direct">
                  (direct)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

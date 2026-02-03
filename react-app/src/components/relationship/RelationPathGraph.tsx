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

export default function RelationPathGraph({ pathA, pathB }: Props) {
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
        <div className="parente-nn">{m.name.split(/\s+/)[0]}</div>
        <div className="parente-ng">
          {m.gender === 'F' ? '\u2640' : '\u2642'} G{m.generation}
        </div>
      </div>,
    );
  });

  return (
    <div className="parente-hp">
      <div className="parente-hp-l">Chemin dans l&apos;arbre</div>
      <div className="parente-hp-t">{elements}</div>
    </div>
  );
}

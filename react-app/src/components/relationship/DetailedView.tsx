// react-app/src/components/relationship/DetailedView.tsx
import { useState, useEffect, useRef } from 'react';
import type { Relation } from '../../lib/parenteSonghay';
import type { Member } from '../../lib/types';
import ReciprocalStatements from './ReciprocalStatements';
import TechnicalDetails from './TechnicalDetails';
import PedagogicalExplanation from './PedagogicalExplanation';

interface Props {
  relations: Relation[];
  personA: Member;
  personB: Member;
  activeIndex: number;
  getMember: (id: string) => Member | undefined;
}

const DEFAULT_VISIBLE = 3;

export default function DetailedView({ relations, personA, personB, activeIndex, getMember }: Props) {
  const [expanded, setExpanded] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => { setExpanded(false); }, [relations]);
  useEffect(() => {
    if (activeIndex >= DEFAULT_VISIBLE) setExpanded(true);
    cardRefs.current[activeIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeIndex]);

  const visible = expanded ? relations : relations.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = relations.length - DEFAULT_VISIBLE;

  return (
    <div className="parente-detailed">
      {visible.map((r, i) => (
        <div
          key={`${r.via}-${i}`}
          ref={(el) => { cardRefs.current[i] = el; }}
          className={`parente-detailed-card${i === activeIndex ? ' active' : ''}`}
        >
          <div className="card-header">
            <span className="card-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="card-title">
              {i === 0 ? 'Lien principal' : `Lien ${String(i + 1).padStart(2, '0')}`}
            </span>
            <span className="card-via">via {r.viaName}</span>
          </div>
          <ReciprocalStatements relation={r} nameA={personA.name} nameB={personB.name} />
          <TechnicalDetails relation={r} personA={personA} personB={personB} getMember={getMember} />
          <PedagogicalExplanation relation={r} nameA={personA.name} nameB={personB.name} />
        </div>
      ))}
      {hiddenCount > 0 && !expanded && (
        <button className="parente-detailed-more" onClick={() => setExpanded(true)}>
          + Voir les {hiddenCount} autre{hiddenCount > 1 ? 's' : ''} relation{hiddenCount > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}

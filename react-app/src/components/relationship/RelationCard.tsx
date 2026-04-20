import { useState } from 'react';
import type { Relation } from '../../lib/parenteSonghay';
import type { Member } from '../../lib/types';
import SubTreeSvg from './SubTreeSvg';
import ReciprocalStatements from './ReciprocalStatements';
import PedagogicalExplanation from './PedagogicalExplanation';
import TechnicalDetails from './TechnicalDetails';

interface Props {
  index: number;
  relation: Relation;
  personA: Member;
  personB: Member;
  getMember: (id: string) => Member | undefined;
  defaultExpanded?: boolean;
}

export default function RelationCard({ index, relation, personA, personB, getMember, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showTech, setShowTech] = useState(false);
  const ancestor = getMember(relation.via);

  return (
    <article className={`parente-card ${expanded ? 'expanded' : 'collapsed'}`} aria-labelledby={`rel-${index}-title`}>
      <header
        className="parente-card-header"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((v) => !v); } }}
      >
        <span className="parente-card-num">{String(index + 1).padStart(2, '0')}</span>
        <div className="parente-card-title-block">
          <h3 id={`rel-${index}-title`} className="parente-card-title">
            <em lang="son">{relation.termForA}</em>
            <span className="sep">/</span>
            <em lang="son">{relation.termForB}</em>
          </h3>
          <p className="parente-card-subtitle">via {relation.viaName} · proximité {relation.proximityScore} · équilibre {relation.balanceScore}</p>
        </div>
        <span className="parente-card-chevron" aria-hidden="true">▸</span>
      </header>

      {expanded && (
        <>
          {ancestor && (
            <div className="parente-card-graphic">
              <SubTreeSvg
                relation={relation}
                personA={personA}
                personB={personB}
                ancestor={ancestor}
                getMember={getMember}
              />
            </div>
          )}
          <ReciprocalStatements relation={relation} nameA={personA.name} nameB={personB.name} />
          <PedagogicalExplanation relation={relation} nameA={personA.name} nameB={personB.name} />
          <button
            type="button"
            className="parente-card-tech-toggle"
            onClick={(e) => { e.stopPropagation(); setShowTech((v) => !v); }}
            aria-expanded={showTech}
          >
            {showTech ? '− Masquer les détails techniques' : '+ Afficher les détails techniques'}
          </button>
          {showTech && (
            <TechnicalDetails relation={relation} personA={personA} personB={personB} getMember={getMember} />
          )}
        </>
      )}
    </article>
  );
}

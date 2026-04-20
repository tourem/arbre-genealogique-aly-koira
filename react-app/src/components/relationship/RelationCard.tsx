import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Member } from '../../lib/types';
import type { RelationGroup } from './groupRelations';
import SubTreeSvg from './SubTreeSvg';
import ReciprocalStatements from './ReciprocalStatements';
import PedagogicalExplanation from './PedagogicalExplanation';
import TechnicalDetails from './TechnicalDetails';

interface Props {
  index: number;
  group: RelationGroup;
  personA: Member;
  personB: Member;
  getMember: (id: string) => Member | undefined;
  defaultExpanded?: boolean;
}

export default function RelationCard({ index, group, personA, personB, getMember, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [activePathIndex, setActivePathIndex] = useState(0);
  const [showTech, setShowTech] = useState(false);
  const navigate = useNavigate();
  const handleClickPersonA = () => navigate(`/?person=${personA.id}`);
  const handleClickPersonB = () => navigate(`/?person=${personB.id}`);

  const active = group.paths[activePathIndex] ?? group.paths[0];
  const ancestor = getMember(active.via);
  const multiPath = group.paths.length > 1;

  const collapsedSubtitle = multiPath
    ? `${group.paths.length} chemins distincts`
    : `via ${active.viaName}${active.viaSpouse ? ` & ${active.viaSpouse.name}` : ''}`;

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
            <em lang="son">{group.termForA}</em>
            <span className="sep">/</span>
            <em lang="son">{group.termForB}</em>
          </h3>
          <p className="parente-card-subtitle">
            {collapsedSubtitle}
            {expanded && ` · proximité ${active.proximityScore} · équilibre ${active.balanceScore}`}
          </p>
        </div>
        <span className="parente-card-chevron" aria-hidden="true">▸</span>
      </header>

      {expanded && (
        <>
          {multiPath && (
            <div className="parente-path-selector" role="tablist" aria-label="Chemins de cette relation">
              {group.paths.map((p, i) => (
                <button
                  key={`${p.via}-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === activePathIndex}
                  className={`parente-path-pill${i === activePathIndex ? ' active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setActivePathIndex(i); }}
                >
                  via {p.viaName}
                  {p.viaSpouse && <> &amp; {p.viaSpouse.name}</>}
                </button>
              ))}
            </div>
          )}

          {ancestor && (
            <div className="parente-card-graphic">
              <SubTreeSvg
                relation={active}
                personA={personA}
                personB={personB}
                ancestor={ancestor}
                getMember={getMember}
              />
            </div>
          )}
          <ReciprocalStatements
            relation={active}
            nameA={personA.name}
            nameB={personB.name}
            onClickA={handleClickPersonA}
            onClickB={handleClickPersonB}
          />
          <PedagogicalExplanation relation={active} nameA={personA.name} nameB={personB.name} />

          <button
            type="button"
            className="parente-card-tech-toggle"
            onClick={(e) => { e.stopPropagation(); setShowTech((v) => !v); }}
            aria-expanded={showTech}
          >
            {showTech ? '− Masquer les détails techniques' : '+ Afficher les détails techniques'}
          </button>
          {showTech && (
            <TechnicalDetails relation={active} personA={personA} personB={personB} getMember={getMember} />
          )}
        </>
      )}
    </article>
  );
}

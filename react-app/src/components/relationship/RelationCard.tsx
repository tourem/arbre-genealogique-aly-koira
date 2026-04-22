import { useState } from 'react';
import type { Member } from '../../lib/types';
import type { RelationGroup } from './groupRelations';
import SubTreeSvg from './SubTreeSvg';
import TechnicalDetails from './TechnicalDetails';
import MetricChips from './MetricChips';

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

  const active = group.paths[activePathIndex] ?? group.paths[0];
  const ancestor = getMember(active.via);
  const multiPath = group.paths.length > 1;

  const renderTitle = () => {
    if (group.groupTerm) {
      return (
        <h3 id={`rel-${index}-title`} className="parente-card-title">
          <em lang="son">{group.groupTerm}</em>
        </h3>
      );
    }
    return (
      <h3 id={`rel-${index}-title`} className="parente-card-title">
        <em lang="son">{group.termForA}</em>
        <span className="sep">/</span>
        <em lang="son">{group.termForB}</em>
      </h3>
    );
  };

  const renderSubtitle = () => (
    <p className="parente-card-subtitle">
      {group.groupTerm && (
        <span className="parente-card-individual-terms">
          <em lang="son">{group.termForA}</em>
          <span className="sep">/</span>
          <em lang="son">{group.termForB}</em>
        </span>
      )}
    </p>
  );

  return (
    <article className={`parente-card ${expanded ? 'expanded' : 'collapsed'}`} aria-labelledby={`rel-${index}-title`}>
      <header className="parente-card-header">
        <button
          type="button"
          className="parente-card-header-main"
          aria-expanded={expanded}
          aria-controls={`rel-${index}-body`}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="parente-card-num">{String(index + 1).padStart(2, '0')}</span>
          <div className="parente-card-title-block">
            {renderTitle()}
            {renderSubtitle()}
            <MetricChips group={group} />
          </div>
        </button>
        <button
          type="button"
          className="parente-card-collapse"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Replier le détail' : 'Afficher le détail'}
          title={expanded ? 'Replier le détail' : 'Afficher le détail'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </header>

      {expanded && (
        <div id={`rel-${index}-body`} className="parente-card-body">
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
        </div>
      )}
    </article>
  );
}

import { useState } from 'react';
import type { Member } from '../../lib/types';
import type { RelationGroup } from './groupRelations';
import { explainParagraphs } from '../../lib/parenteSonghay';
import { useParenteLabels } from '../../hooks/useParenteLabels';

interface Props {
  group: RelationGroup;
  personA: Member;
  personB: Member;
}

/**
 * Accordeon "Comprendre ce lien" — ferme par defaut, place sous le
 * dernier bloc resultat. Expose 3 paragraphes :
 *   1. Regle generale songhay
 *   2. Application au cas concret
 *   3. Encart savant (anthropologie)
 */
export default function ExplainAccordion({ group, personA, personB }: Props) {
  const { labels } = useParenteLabels();
  const [open, setOpen] = useState(false);
  const p = explainParagraphs(group, personA.name, personB.name, personA.gender, labels);

  return (
    <div className={`parente-explain-accordion${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="parente-explain-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="parente-explain-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        </span>
        <span className="parente-explain-title">Comprendre ce lien</span>
        <span className={`parente-explain-chevron${open ? ' is-open' : ''}`} aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="parente-explain-body">
          <p dangerouslySetInnerHTML={{ __html: p.rule }} />
          <p dangerouslySetInnerHTML={{ __html: p.application }} />
          <div className="parente-explain-savant" dangerouslySetInnerHTML={{ __html: p.savant }} />
        </div>
      )}
    </div>
  );
}

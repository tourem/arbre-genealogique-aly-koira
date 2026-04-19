// react-app/src/components/relationship/RelationSelector.tsx
import { useEffect, useState } from 'react';
import type { Relation } from '../../lib/parenteSonghay';

interface Props {
  relations: Relation[];
  activeIndex: number;
  onChange: (index: number) => void;
}

const DEFAULT_VISIBLE = 3;

export default function RelationSelector({ relations, activeIndex, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Si l'utilisateur navigue au clavier vers un index >= DEFAULT_VISIBLE, déplier automatiquement.
  useEffect(() => {
    if (activeIndex >= DEFAULT_VISIBLE) setExpanded(true);
  }, [activeIndex]);

  // Réinitialiser expanded si la liste change
  useEffect(() => { setExpanded(false); }, [relations]);

  if (relations.length <= 1) return null;

  const visible = expanded ? relations : relations.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = relations.length - DEFAULT_VISIBLE;

  return (
    <div className="parente-selector" role="tablist" aria-label="Relations trouvées">
      {visible.map((r, i) => (
        <button
          key={`${r.via}-${i}`}
          type="button"
          role="tab"
          aria-selected={i === activeIndex}
          className={`parente-selector-pill${i === activeIndex ? ' active' : ''}`}
          onClick={() => onChange(i)}
        >
          <span className="pill-num">{String(i + 1).padStart(2, '0')}</span>
          <span className="pill-terms">{r.termForA} / {r.termForB}</span>
          <span className="pill-via">via {r.viaName}</span>
        </button>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          className="parente-selector-more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? '− Masquer' : `+ Voir les ${hiddenCount} autre${hiddenCount > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}

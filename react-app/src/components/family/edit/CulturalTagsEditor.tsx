import { useState } from 'react';
import type { Member, MemberDict } from '../../../lib/types';
import { KNOWN_CULTURAL_TAGS, resolveTags } from '../../../lib/culturalTags';

interface Props {
  person: Member;
  members: MemberDict;
  /** Current tag set (confirmed / explicit). */
  tags: string[];
  /** Called with the new explicit tag list whenever the user promotes/removes a tag. */
  onChange: (next: string[]) => void;
}

/**
 * Visual editor for cultural_tags. Shows:
 * - Confirmed tags as solid ocre pills (click to remove after confirm()).
 * - Suggested tags (inferred by resolveTags) as dashed pills (click to promote).
 * - A "+ Ajouter un tag" button that opens an inline menu of KNOWN_CULTURAL_TAGS
 *   not already present.
 */
export default function CulturalTagsEditor({ person, members, tags, onChange }: Props) {
  const [addOpen, setAddOpen] = useState(false);

  // Compute suggested tags: resolveTags() returns both explicit and inferred
  // with priority to explicit. For the editor, we want to diff with current
  // `tags` state (which may include optimistic user actions) rather than
  // `person.cultural_tags`.
  const resolved = resolveTags(person, members);
  const suggested = resolved
    .filter((r) => r.source === 'inferred')
    .map((r) => r.tag)
    .filter((t) => !tags.includes(t));

  const available = KNOWN_CULTURAL_TAGS.filter(
    (t) => !tags.includes(t) && !suggested.includes(t),
  );

  const promote = (t: string) => {
    if (tags.includes(t)) return;
    onChange([...tags, t]);
  };

  const remove = (t: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Retirer ce tag ?')) return;
    onChange(tags.filter((x) => x !== t));
  };

  const addManual = (t: string) => {
    promote(t);
    setAddOpen(false);
  };

  return (
    <div className="edit-cultural-tags">
      <div className="edit-cultural-tags-wrap">
        {tags.map((t) => (
          <button
            key={`c-${t}`}
            type="button"
            className="edit-cultural-tag"
            onClick={() => remove(t)}
            title="Cliquez pour retirer ce tag"
          >
            <span className="edit-cultural-tag-dot" aria-hidden="true" />
            <span className="edit-cultural-tag-label">{t}</span>
            <span className="edit-cultural-tag-remove" aria-hidden="true">×</span>
          </button>
        ))}

        {suggested.map((t) => (
          <button
            key={`s-${t}`}
            type="button"
            className="edit-cultural-tag edit-cultural-tag--suggested"
            onClick={() => promote(t)}
            title="Tag suggéré — cliquez pour confirmer"
          >
            <span className="edit-cultural-tag-dot" aria-hidden="true" />
            <span className="edit-cultural-tag-label">{t}</span>
            <span className="edit-cultural-tag-hint">suggéré</span>
          </button>
        ))}

        {!addOpen && available.length > 0 && (
          <button
            type="button"
            className="edit-cultural-tag-add"
            onClick={() => setAddOpen(true)}
          >
            + Ajouter un tag
          </button>
        )}

        {addOpen && (
          <div className="edit-cultural-tag-menu" role="menu">
            {available.length === 0 ? (
              <span className="edit-cultural-tag-menu-empty">Aucun tag disponible</span>
            ) : (
              available.map((t) => (
                <button
                  key={`a-${t}`}
                  type="button"
                  className="edit-cultural-tag-menu-item"
                  role="menuitem"
                  onClick={() => addManual(t)}
                >
                  {t}
                </button>
              ))
            )}
            <button
              type="button"
              className="edit-cultural-tag-menu-close"
              onClick={() => setAddOpen(false)}
              aria-label="Annuler"
            >
              ×
            </button>
          </div>
        )}
      </div>
      <div className="edit-help">
        Les tags <em>suggérés</em> sont calculés automatiquement depuis la structure familiale.
        Cliquez pour les confirmer et les ajouter explicitement à la fiche.
      </div>
    </div>
  );
}

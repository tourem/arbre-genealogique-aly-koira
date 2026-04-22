import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Member } from '../../lib/types';
import { rankLabel, type Foyer } from '../../lib/foyers';
import Avatar from '../ui/Avatar';

interface Props {
  person: Member;
  foyers: Foyer[];
  onEdit: () => void;
  onAddSpouse: () => void;
  /** Called with a foyer's spouse ID (or null for "new foyer") when the user
   *  chooses a foyer for the new child. */
  onAddChild: (foyerSpouseId: string | null) => void;
  /** Called when "Compléter un parent" is picked. Visible only if at least
   *  one of father_id / mother_ref is null. */
  onAddParent: () => void;
  onViewTree: () => void;
  onShare: () => void;
  onDelete: () => void;
}

type MenuState = 'closed' | 'main' | 'foyer';

export default function FicheFAB({
  person,
  foyers,
  onEdit,
  onAddSpouse,
  onAddChild,
  onAddParent,
  onViewTree,
  onShare,
  onDelete,
}: Props) {
  const [state, setState] = useState<MenuState>('closed');
  const fabRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setState('closed');
    // Return focus to the FAB when closing
    requestAnimationFrame(() => fabRef.current?.focus());
  }, []);

  // Keyboard handlers
  useEffect(() => {
    if (state === 'closed') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (state === 'foyer') setState('main');
        else close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [state, close]);

  // Autofocus first item when menu opens
  useEffect(() => {
    if (state !== 'closed') {
      requestAnimationFrame(() => firstItemRef.current?.focus());
    }
  }, [state]);

  const isParentMissing = !person.father_id || !person.mother_ref;
  const hasFoyer = foyers.filter((f) => !f.orphan).length > 0;

  // If person has 0 foyers → "Ajouter un enfant" is disabled.
  // If 1 foyer → click adds directly with that foyer's spouse.
  // If ≥2 → opens submenu to pick.
  const handleAddChildClick = () => {
    if (!hasFoyer) return; // disabled
    const nonOrphan = foyers.filter((f) => !f.orphan);
    if (nonOrphan.length === 1) {
      onAddChild(nonOrphan[0].spouse?.id ?? null);
      close();
      return;
    }
    setState('foyer');
  };

  const toggle = () => setState((s) => (s === 'closed' ? 'main' : 'closed'));

  // Bundle the action + close into a single helper for clarity
  const act = (fn: () => void) => () => {
    fn();
    close();
  };

  const overlay = state !== 'closed' ? createPortal(
    <>
      <div className="fab-backdrop" onClick={close} aria-hidden="true" />

      {state === 'main' && (
        <div
          className="fab-menu"
          role="menu"
          aria-label="Actions sur la fiche"
        >
          <div className="fab-menu-header">Actions</div>

          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
            className="fab-menu-item"
            onClick={act(onEdit)}
          >
            <span className="fab-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              </svg>
            </span>
            <span className="fab-menu-label">Modifier la fiche</span>
            <span className="fab-menu-hint" aria-hidden="true">E</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="fab-menu-item"
            onClick={act(onAddSpouse)}
          >
            <span className="fab-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            </span>
            <span className="fab-menu-label">Ajouter {person.gender === 'M' ? 'une épouse' : 'un époux'}</span>
            <span className="fab-menu-hint" aria-hidden="true">Nouveau foyer</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={`fab-menu-item${!hasFoyer ? ' is-disabled' : ''}`}
            onClick={handleAddChildClick}
            disabled={!hasFoyer}
            aria-haspopup={hasFoyer && foyers.filter((f) => !f.orphan).length > 1 ? 'menu' : undefined}
            aria-expanded={undefined}
            title={!hasFoyer ? `Ajouter ${person.gender === 'M' ? 'une épouse' : 'un époux'} d'abord` : undefined}
          >
            <span className="fab-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <span className="fab-menu-label">Ajouter un enfant</span>
            <span className="fab-menu-hint" aria-hidden="true">
              {hasFoyer ? (foyers.filter((f) => !f.orphan).length > 1 ? 'Choisir le foyer' : '') : 'Aucun foyer'}
            </span>
            {hasFoyer && foyers.filter((f) => !f.orphan).length > 1 && (
              <span className="fab-menu-chev" aria-hidden="true">›</span>
            )}
          </button>

          {isParentMissing && (
            <button
              type="button"
              role="menuitem"
              className="fab-menu-item"
              onClick={act(onAddParent)}
            >
              <span className="fab-menu-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <line x1="12" y1="14" x2="12" y2="20"/>
                  <line x1="9" y1="17" x2="15" y2="17"/>
                </svg>
              </span>
              <span className="fab-menu-label">Compléter un parent</span>
              <span className="fab-menu-hint" aria-hidden="true">
                {!person.father_id && !person.mother_ref ? 'Père + mère' : !person.father_id ? 'Père' : 'Mère'}
              </span>
            </button>
          )}

          <div className="fab-menu-separator" role="separator" />

          <button
            type="button"
            role="menuitem"
            className="fab-menu-item"
            onClick={act(onViewTree)}
          >
            <span className="fab-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </span>
            <span className="fab-menu-label">Voir dans l'arbre</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="fab-menu-item"
            onClick={act(onShare)}
          >
            <span className="fab-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </span>
            <span className="fab-menu-label">Partager la fiche</span>
          </button>

          <div className="fab-menu-separator" role="separator" />

          <button
            type="button"
            role="menuitem"
            className="fab-menu-item fab-menu-item--danger"
            onClick={act(onDelete)}
          >
            <span className="fab-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1.5 14a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8L5 6"/>
                <path d="M10 11v6"/>
                <path d="M14 11v6"/>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </span>
            <span className="fab-menu-label">Supprimer la fiche</span>
          </button>
        </div>
      )}

      {state === 'foyer' && (
        <div
          className="fab-menu"
          role="menu"
          aria-label="Choisir le foyer pour l'enfant"
        >
          <button
            type="button"
            className="fab-menu-back"
            onClick={() => setState('main')}
            ref={firstItemRef}
          >
            <span aria-hidden="true">‹</span>
            Retour
          </button>
          <div className="fab-menu-header fab-menu-header--large">
            Ajouter un enfant au foyer <em lang="son">windi</em>
          </div>

          {foyers.filter((f) => !f.orphan).map((f) => {
            const spouseName = f.spouse?.name ?? f.spouseName ?? '—';
            const childCount = f.children.length;
            return (
              <button
                key={`${f.spouse?.id ?? f.spouseName}-${f.rank}`}
                type="button"
                role="menuitem"
                className="fab-menu-item fab-menu-item--foyer"
                onClick={act(() => onAddChild(f.spouse?.id ?? null))}
              >
                <span className="fab-menu-foyer-avatar">
                  {f.spouse ? (
                    <Avatar name={f.spouse.name} gender={f.spouse.gender} size="sm" />
                  ) : (
                    <span className="fab-menu-foyer-placeholder" aria-hidden="true">?</span>
                  )}
                </span>
                <span className="fab-menu-foyer-main">
                  <span className="fab-menu-foyer-name">{spouseName}</span>
                  <span className="fab-menu-foyer-meta">
                    {rankLabel(f.rank, f.spouse?.gender ?? (person.gender === 'M' ? 'F' : 'M'))} · {childCount} enfant{childCount !== 1 ? 's' : ''}
                  </span>
                </span>
              </button>
            );
          })}

          <button
            type="button"
            role="menuitem"
            className="fab-menu-item fab-menu-item--foyer fab-menu-item--new"
            onClick={act(() => onAddChild(null))}
          >
            <span className="fab-menu-foyer-avatar">
              <span className="fab-menu-foyer-placeholder fab-menu-foyer-placeholder--new" aria-hidden="true">+</span>
            </span>
            <span className="fab-menu-foyer-main">
              <span className="fab-menu-foyer-name">Créer un nouveau foyer</span>
              <span className="fab-menu-foyer-meta">Nouveau conjoint</span>
            </span>
          </button>
        </div>
      )}
    </>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        className={`fab${state !== 'closed' ? ' is-open' : ''}`}
        onClick={toggle}
        aria-expanded={state !== 'closed'}
        aria-haspopup="menu"
        aria-label={state === 'closed' ? 'Actions sur la fiche, menu fermé' : 'Actions sur la fiche, menu ouvert'}
      >
        <svg className="fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      {overlay}
    </>
  );
}

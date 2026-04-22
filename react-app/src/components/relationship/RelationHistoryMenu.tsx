import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { HistoryEntry } from '../../hooks/useParenteHistory';
import { formatRelativeTime } from '../../lib/formatRelativeTime';

interface Props {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (aId: string, bId: string) => void;
  onClear: () => void;
  onNewSearch: () => void;
}

/**
 * Menu deroulant "Historique" affiche dans l'en-tete de la page Parente.
 * Masque quand history est vide. Cliquer le bouton ouvre un panneau
 * flottant listant les paires passees (plus recente en haut), avec
 * horodatage relatif, bouton de retrait par entree, et footer "Nouvelle
 * recherche".
 *
 * Ferme sur Escape (+ refocus du trigger), clic exterieur, ou apres
 * toute action (select, clear, new search).
 *
 * Navigation clavier : ArrowDown / ArrowUp naviguent entre les entrees
 * (roving tabindex), Home / End sautent au premier / dernier menuitem,
 * Delete / Backspace retirent l'entree focus, Enter / Espace activent
 * le menuitem focus (comportement natif des boutons).
 */
export default function RelationHistoryMenu({ history, onSelect, onRemove, onClear, onNewSearch }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  // Au moment de l'ouverture, reset l'index actif et focus la premiere entree.
  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    // Attente d'un frame pour que les refs soient attachees.
    const id = requestAnimationFrame(() => {
      itemRefs.current[0]?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (history.length === 0) return null;

  const close = useCallback(() => setOpen(false), []);

  const handleSelect = (entry: HistoryEntry) => {
    onSelect(entry);
    close();
  };

  const handleClear = () => {
    onClear();
    close();
  };

  const handleNewSearch = () => {
    onNewSearch();
    close();
  };

  const focusItem = (index: number) => {
    const count = history.length;
    if (count === 0) return;
    const next = ((index % count) + count) % count;
    setActiveIndex(next);
    itemRefs.current[next]?.focus();
  };

  const onItemKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, entry: HistoryEntry, index: number) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusItem(index + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusItem(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusItem(0);
        break;
      case 'End':
        e.preventDefault();
        focusItem(history.length - 1);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        onRemove(entry.aId, entry.bId);
        break;
      default:
        break;
    }
  };

  return (
    <div className="parente-history-menu" ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        className="parente-history-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? panelId : undefined}
        aria-label={`Historique des recherches (${history.length})`}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="parente-history-menu-trigger-label">Historique</span>
        <span className="parente-history-menu-trigger-count" aria-hidden="true">· {history.length}</span>
      </button>
      {open && (
        <div role="menu" id={panelId} className="parente-history-menu-panel">
          <div className="parente-history-menu-head">
            <span className="parente-history-menu-title">Recherches récentes</span>
            <button
              type="button"
              role="menuitem"
              className="parente-history-menu-clear"
              onClick={handleClear}
            >
              Effacer tout
            </button>
          </div>
          <ul className="parente-history-menu-list">
            {history.map((entry, index) => (
              <li key={entry.aId + '-' + entry.bId} className="parente-history-menu-item">
                <button
                  ref={(el) => { itemRefs.current[index] = el; }}
                  type="button"
                  role="menuitem"
                  tabIndex={index === activeIndex ? 0 : -1}
                  className="parente-history-menu-item-main"
                  aria-label={`Rouvrir ${entry.aName} et ${entry.bName}`}
                  onClick={() => handleSelect(entry)}
                  onKeyDown={(e) => onItemKeyDown(e, entry, index)}
                  onFocus={() => setActiveIndex(index)}
                >
                  <span className="parente-history-menu-item-names">
                    <span>{entry.aName}</span>
                    <span className="parente-history-menu-item-sep" aria-hidden="true">↔</span>
                    <span>{entry.bName}</span>
                  </span>
                  <span className="parente-history-menu-item-meta">
                    {entry.topTerm && (
                      <>
                        <em lang="son" className="parente-history-menu-item-term">{entry.topTerm}</em>
                        <span className="parente-history-menu-item-dot" aria-hidden="true">·</span>
                      </>
                    )}
                    <span className="parente-history-menu-item-time">{formatRelativeTime(entry.timestamp)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="parente-history-menu-item-remove"
                  aria-label={`Retirer ${entry.aName} et ${entry.bName} de l'historique`}
                  onClick={(e) => { e.stopPropagation(); onRemove(entry.aId, entry.bId); }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            role="menuitem"
            className="parente-history-menu-new"
            onClick={handleNewSearch}
          >
            + Nouvelle recherche
          </button>
        </div>
      )}
    </div>
  );
}

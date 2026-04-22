import { useState } from 'react';
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
 */
export default function RelationHistoryMenu({ history, onSelect, onRemove, onClear, onNewSearch }: Props) {
  const [open, setOpen] = useState(false);

  if (history.length === 0) return null;

  const close = () => setOpen(false);

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

  return (
    <div className="parente-history-menu">
      <button
        type="button"
        className="parente-history-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
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
        <div role="menu" className="parente-history-menu-panel">
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
            {history.map((entry) => (
              <li key={entry.aId + '-' + entry.bId} className="parente-history-menu-item">
                <button
                  type="button"
                  role="menuitem"
                  className="parente-history-menu-item-main"
                  aria-label={`Rouvrir ${entry.aName} et ${entry.bName}`}
                  onClick={() => handleSelect(entry)}
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

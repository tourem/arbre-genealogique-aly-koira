import { useState } from 'react';
import type { HistoryEntry } from '../../hooks/useParenteHistory';

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
          {/* populated in tasks 3+ */}
        </div>
      )}
    </div>
  );
}

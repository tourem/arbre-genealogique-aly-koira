import type { HistoryEntry } from '../../hooks/useParenteHistory';

interface Props {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (aId: string, bId: string) => void;
  onClear: () => void;
}

export default function RelationHistoryChips({ history, onSelect, onRemove, onClear }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="parente-history">
      <div className="parente-history-head">
        <span className="parente-history-title">Recherches récentes</span>
        <button
          type="button"
          className="parente-history-clear"
          onClick={onClear}
          aria-label="Effacer l'historique des recherches"
        >
          Effacer
        </button>
      </div>
      <div className="parente-history-chips">
        {history.map((entry) => (
          <div key={entry.aId + '-' + entry.bId} className="parente-history-chip">
            <button
              type="button"
              className="parente-history-chip-main"
              onClick={() => onSelect(entry)}
              aria-label={`Rouvrir ${entry.aName} et ${entry.bName}`}
            >
              <span className="chip-names">
                <span>{entry.aName}</span>
                <span className="chip-sep">↔</span>
                <span>{entry.bName}</span>
              </span>
              {entry.topTerm && (
                <small className="chip-term" lang="son">{entry.topTerm}</small>
              )}
            </button>
            <button
              type="button"
              className="parente-history-chip-remove"
              onClick={(e) => { e.stopPropagation(); onRemove(entry.aId, entry.bId); }}
              aria-label={`Retirer ${entry.aName} et ${entry.bName} de l'historique`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

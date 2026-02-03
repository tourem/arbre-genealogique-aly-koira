import type { SonghoyRelationResult } from '../../lib/types';
import RelationCard from './RelationCard';

interface Props {
  results: SonghoyRelationResult[];
  personAName: string;
  personBName: string;
}

export default function RelationshipResult({
  results,
  personAName,
  personBName,
}: Props) {
  if (results.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">{'\u2753'}</div>
        <div className="empty-text">
          Aucun lien de parente trouve entre {personAName} et {personBName}
        </div>
      </div>
    );
  }

  return (
    <div className="relation-results">
      <div className="relation-results-header">
        <span className="relation-results-count">
          {results.length} relation{results.length > 1 ? 's' : ''} trouvee
          {results.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="relation-results-list">
        {results.map((r, i) => (
          <RelationCard
            key={`${r.commonAncestor.id}-${i}`}
            result={r}
            personAName={personAName}
            personBName={personBName}
          />
        ))}
      </div>
    </div>
  );
}

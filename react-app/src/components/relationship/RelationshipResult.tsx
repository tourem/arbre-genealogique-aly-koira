import type { SonghoyRelationResult } from '../../lib/types';
import RelationCard from './RelationCard';

interface Props {
  results: SonghoyRelationResult[];
  personAName: string;
  personBName: string;
}

function getShortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(0, 2).join(' ') : parts[0];
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

  const firstTerm =
    results[0].termAtoB?.term_songhoy || results[0].category.label_fr;
  const otherCount = results.length - 1;

  return (
    <>
      <div className="parente-flash">
        <div className="parente-flash-n">{results.length}</div>
        <div className="parente-flash-t">
          <em>{getShortName(personAName)}</em> est{' '}
          <strong>{firstTerm}</strong> pour{' '}
          <em>{getShortName(personBName)}</em>
          {otherCount > 0 &&
            ` \u2014 et ${otherCount} autre${otherCount > 1 ? 's' : ''} relation${otherCount > 1 ? 's' : ''} trouvee${otherCount > 1 ? 's' : ''}`}
        </div>
      </div>

      {results.map((r, i) => (
        <RelationCard
          key={`${r.commonAncestor.id}-${i}`}
          result={r}
          personAName={personAName}
          personBName={personBName}
          index={i}
        />
      ))}
    </>
  );
}

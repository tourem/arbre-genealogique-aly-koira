import type { Member } from '../../lib/types';
import { genNames } from '../../lib/constants';

interface Props {
  person: Member;
  spouseCount?: number;
  childrenCount?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function PersonCard({ person, spouseCount = 0, childrenCount = 0 }: Props) {
  const isMale = person.gender === 'M';
  const sexSymbol = isMale ? '\u2642' : '\u2640';

  return (
    <div className="fiche-portrait">
      <div className="fiche-portrait-inner">
        <div className={`fiche-av ${isMale ? 'm' : 'f'}`}>
          {person.photo_url ? (
            <img src={person.photo_url} alt={person.name} className="fiche-av-photo" />
          ) : (
            getInitials(person.name)
          )}
          <span className="fiche-av-gb">G{person.generation}</span>
        </div>
        <div className="fiche-portrait-info">
          <div className="fiche-portrait-name">
            {person.name}
            {person.alias && <span className="fiche-clan"> ({person.alias})</span>}
          </div>
          <div className="fiche-portrait-meta">
            <span className="fiche-portrait-sex">{sexSymbol}</span>
            {genNames[person.generation]}
            {person.generation > 0 ? '\u00E8me' : ''} g\u00E9n\u00E9ration
          </div>
          {person.note && (
            <div className="fiche-portrait-note">{person.note}</div>
          )}
        </div>
        <div className="fiche-portrait-stats">
          <div className="fiche-ps sp">
            <div className="fiche-ps-n">{spouseCount}</div>
            <div className="fiche-ps-l">\u00C9pouses</div>
          </div>
          <div className="fiche-ps ch">
            <div className="fiche-ps-n">{childrenCount}</div>
            <div className="fiche-ps-l">Enfants</div>
          </div>
        </div>
      </div>
    </div>
  );
}

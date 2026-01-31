import type { Member } from '../../lib/types';
import { genNames } from '../../lib/constants';

interface Props {
  person: Member;
}

export default function PersonCard({ person }: Props) {
  const genClass = `gen${person.generation}`;

  return (
    <div className={`person-card ${genClass}`}>
      <div className="gen-badge">G{person.generation}</div>
      <div className={`person-avatar ${person.gender === 'M' ? 'male' : 'female'}`}>
        {person.gender === 'M' ? '\u{1F468}' : '\u{1F469}'}
      </div>
      <div className="person-name">
        {person.name}
        {person.alias && <span className="alias-inline"> ({person.alias})</span>}
      </div>
      <div className="person-gen">
        {genNames[person.generation]} g&eacute;n&eacute;ration
      </div>
    </div>
  );
}

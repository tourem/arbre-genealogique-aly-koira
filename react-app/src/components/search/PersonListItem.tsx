import type { Member } from '../../lib/types';

interface Props {
  person: Member;
  onClick: () => void;
}

export default function PersonListItem({ person, onClick }: Props) {
  const displayName = person.alias
    ? `${person.name} (${person.alias})`
    : person.name;

  return (
    <div className="person-item" onClick={onClick}>
      <div className={`avatar ${person.gender === 'M' ? 'male' : 'female'}`}>
        {person.gender === 'M' ? '\u{1F468}' : '\u{1F469}'}
      </div>
      <div className="info">
        <div className="name">{displayName}</div>
        <div className="details">G&eacute;n&eacute;ration {person.generation}</div>
      </div>
      <svg
        className="arrow"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </div>
  );
}

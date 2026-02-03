import type { Member, MemberDict } from '../../lib/types';

interface Props {
  child: Member;
  members: MemberDict;
  onNavigate: (id: string) => void;
  onInfo?: (member: Member) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ChildCard({ child, onNavigate, onInfo }: Props) {
  const isMale = child.gender === 'M';
  const firstName = child.name.split(' ')[0];
  const displayName = child.alias ? `${firstName} (${child.alias})` : firstName;

  return (
    <div
      className={`fiche-kid ${isMale ? 'boy' : 'girl'}`}
      onClick={() => onNavigate(child.id)}
    >
      {onInfo && (
        <button
          className="info-icon-btn"
          onClick={(e) => { e.stopPropagation(); onInfo(child); }}
          type="button"
        >
          i
        </button>
      )}
      <div className={`fiche-av-kid ${isMale ? 'm' : 'f'}`}>
        {getInitials(child.name)}
      </div>
      <div className="fiche-kid-info">
        <span className="fiche-kid-name">{displayName}</span>
        <span className={`fiche-gender-tag ${isMale ? 'm' : 'f'}`}>
          {isMale ? '\u2642' : '\u2640'}
        </span>
      </div>
    </div>
  );
}

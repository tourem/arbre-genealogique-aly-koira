import type { Member, MemberDict } from '../../lib/types';
import { genColors } from '../../lib/constants';

interface Props {
  child: Member;
  members: MemberDict;
  onNavigate: (id: string) => void;
  onInfo?: (member: Member) => void;
}

export default function ChildCard({ child, members, onNavigate, onInfo }: Props) {
  const grandKids = (child.children || []).filter((gc) => members[gc]).length;
  const firstName = child.name.split(' ')[0];
  const displayName = child.alias ? `${firstName} (${child.alias})` : firstName;

  return (
    <div
      className={`child-card gen${child.generation}`}
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
      <div className={`mini-avatar ${child.gender === 'M' ? 'male' : 'female'}`}>
        {child.gender === 'M' ? '\u{1F468}' : '\u{1F469}'}
      </div>
      <div className="name">{displayName}</div>
      <span className="gen-tag" style={{ background: genColors[child.generation] }}>
        G{child.generation}
      </span>
      {grandKids > 0 && (
        <div className="badge">{grandKids} {'\u{1F476}'}</div>
      )}
    </div>
  );
}

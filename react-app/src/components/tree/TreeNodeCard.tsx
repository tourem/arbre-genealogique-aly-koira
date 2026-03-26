import { genNames } from '../../lib/constants';
import type { Member, MemberDict } from '../../lib/types';

interface Props {
  member: Member;
  members: MemberDict;
  isCollapsed: boolean;
  hasChildren: boolean;
  onToggle: (id: string) => void;
  onNodeClick: (member: Member) => void;
}

export default function TreeNodeCard({
  member,
  members,
  isCollapsed,
  hasChildren,
  onToggle,
  onNodeClick,
}: Props) {
  const genClass = `gen${member.generation}`;
  const childCount = (member.children || []).filter((c) => members[c]).length;

  return (
    <div
      className={`tree-card ${genClass} ${member.gender === 'M' ? 'male' : 'female'}`}
      onClick={() => onNodeClick(member)}
    >
      <div className="tree-card-avatar">
        {member.gender === 'M' ? '\u2642' : '\u2640'}
      </div>
      <div className="tree-card-info">
        <div className="tree-card-name">
          {member.name}
          {member.alias ? <span className="tree-card-alias"> ({member.alias})</span> : null}
        </div>
        <div className={`tree-card-gen ${genClass}`}>
          {genNames[member.generation] || `Gen ${member.generation}`}
        </div>
      </div>
      {hasChildren && (
        <button
          className="tree-card-toggle"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(member.id);
          }}
          title={isCollapsed ? 'Ouvrir' : 'Fermer'}
        >
          {isCollapsed ? `+${childCount}` : '\u2212'}
        </button>
      )}
    </div>
  );
}

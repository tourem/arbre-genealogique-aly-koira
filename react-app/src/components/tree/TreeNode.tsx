import type { Member, MemberDict } from '../../lib/types';
import TreeNodeCard from './TreeNodeCard';

interface Props {
  memberId: string;
  members: MemberDict;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onNodeClick: (member: Member) => void;
  visitedIds: Set<string>;
}

export default function TreeNode({
  memberId,
  members,
  collapsed,
  onToggle,
  onNodeClick,
  visitedIds,
}: Props) {
  const member = members[memberId];
  if (!member || visitedIds.has(memberId)) return null;

  const nextVisited = new Set(visitedIds);
  nextVisited.add(memberId);

  const childIds = (member.children || []).filter(
    (c) => members[c] && !visitedIds.has(c),
  );
  const hasChildren = childIds.length > 0;
  const isCollapsed = collapsed.has(memberId);

  return (
    <div className="tree-node">
      <div className="tree-node-content">
        <TreeNodeCard
          member={member}
          members={members}
          isCollapsed={isCollapsed}
          hasChildren={hasChildren}
          onToggle={onToggle}
          onNodeClick={onNodeClick}
        />
        {hasChildren && !isCollapsed && <div className="tree-node-bridge" />}
      </div>
      {hasChildren && !isCollapsed && (
        <div className="tree-node-children">
          {childIds.map((childId) => (
            <div
              key={childId}
              className={`tree-child-row ${childIds.length === 1 ? 'only-child' : ''}`}
            >
              <TreeNode
                memberId={childId}
                members={members}
                collapsed={collapsed}
                onToggle={onToggle}
                onNodeClick={onNodeClick}
                visitedIds={nextVisited}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

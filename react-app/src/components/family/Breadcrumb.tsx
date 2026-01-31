import type { Member, MemberDict } from '../../lib/types';

interface Props {
  currentPersonId: string;
  members: MemberDict;
  historyLength: number;
  onNavigate: (id: string) => void;
  onGoBack: () => void;
}

export default function Breadcrumb({
  currentPersonId,
  members,
  historyLength,
  onNavigate,
  onGoBack,
}: Props) {
  // Build ancestor path
  const path: string[] = [];
  let cur: string | null = currentPersonId;
  while (cur && path.length < 5) {
    path.unshift(cur);
    const m: Member | undefined = members[cur];
    if (!m) break;
    const next: string | null = m.father_id || m.mother_ref;
    cur = next && members[next] ? next : null;
  }

  return (
    <div className="tree-nav" id="breadcrumb">
      {historyLength > 0 && (
        <div className="tree-nav-item" onClick={onGoBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Retour
        </div>
      )}
      {path.map((id, i) => {
        const p = members[id];
        if (!p) return null;
        const isLast = i === path.length - 1;
        return (
          <div
            key={id}
            className="tree-nav-item"
            onClick={() => onNavigate(id)}
            style={isLast ? { background: 'var(--primary)', color: 'white' } : undefined}
          >
            {p.name.split(' ')[0]}
          </div>
        );
      })}
    </div>
  );
}

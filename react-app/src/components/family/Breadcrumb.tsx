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
    <div className="fiche-bc">
      {historyLength > 0 && (
        <div className="fiche-bc-item" onClick={onGoBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <span key={id} style={{ display: 'contents' }}>
            {i > 0 && <span className="fiche-bc-ch">{'\u203A'}</span>}
            <div
              className={`fiche-bc-item${isLast ? ' on' : ''}`}
              onClick={() => onNavigate(id)}
            >
              {p.name.split(' ')[0]}
            </div>
          </span>
        );
      })}
    </div>
  );
}

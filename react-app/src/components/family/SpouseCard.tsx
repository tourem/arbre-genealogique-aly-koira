import type { Member, MemberDict } from '../../lib/types';

interface Props {
  person: Member;
  members: MemberDict;
  onNavigate: (id: string) => void;
  onInfo?: (member: Member) => void;
}

export default function SpouseCard({ person, members, onNavigate, onInfo }: Props) {
  const spouses = person.spouses || [];
  if (spouses.length === 0) return null;

  const spouseLabel = person.gender === 'M' ? '\u00C9pouse(s)' : '\u00C9poux';
  const spouseIcon = person.gender === 'M' ? '\u{1F469}' : '\u{1F468}';

  return (
    <>
      <div className="section-title">{'\u{1F491}'} {spouseLabel}</div>
      <div className="spouses-list">
        {spouses.map((sp, idx) => {
          const spouseInTree = members[sp];
          const spouseName = spouseInTree ? spouseInTree.name : sp;
          const spouseAlias = spouseInTree?.alias ? ` (${spouseInTree.alias})` : '';

          return (
            <div
              key={sp + idx}
              className={`spouse-card ${spouseInTree ? 'clickable' : ''}`}
              onClick={spouseInTree ? () => onNavigate(sp) : undefined}
            >
              {spouseInTree && onInfo && (
                <button
                  className="info-icon-btn"
                  onClick={(e) => { e.stopPropagation(); onInfo(spouseInTree); }}
                  type="button"
                >
                  i
                </button>
              )}
              <div className="spouse-avatar">{spouseIcon}</div>
              <div className="spouse-info">
                <div className="spouse-name">{spouseName}{spouseAlias}</div>
                {spouses.length > 1 && (
                  <div className="spouse-num">
                    {idx + 1}{idx === 0 ? '\u00E8re' : '\u00E8me'} \u00E9pouse
                  </div>
                )}
                {spouseInTree && (
                  <div className="spouse-link">Voir sa famille &rarr;</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

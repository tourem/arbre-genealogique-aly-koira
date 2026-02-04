import type { Member, MemberDict } from '../../lib/types';

interface Props {
  person: Member;
  members: MemberDict;
  onNavigate: (id: string) => void;
  onInfo?: (member: Member) => void;
  onAddSpouse?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function countChildrenForSpouse(person: Member, spouseId: string, members: MemberDict): number {
  const kids = (person.children || []).filter((c) => members[c]);
  return kids.filter((c) => {
    const child = members[c];
    return child.mother_ref === spouseId;
  }).length;
}

export default function SpouseCard({ person, members, onNavigate, onInfo, onAddSpouse }: Props) {
  const spouses = person.spouses || [];

  if (spouses.length === 0 && !onAddSpouse) return null;

  const spouseLabel = person.gender === 'M' ? 'Épouses' : 'Époux';
  // Spouse gender is opposite of the person
  const spouseGender = person.gender === 'M' ? 'f' : 'm';

  return (
    <div className="fiche-section">
      <div className="fiche-conn c-gold"></div>
      <div className="fiche-sh-header spouses">
        <div className="fiche-sh-txt">
          <span className="fiche-sh-ico">{'\u25C6'}</span> {spouseLabel}
          {spouses.length > 0 && (
            <span className="fiche-sh-count">{spouses.length}</span>
          )}
        </div>
      </div>
      <div className="fiche-spouses-list">
        {spouses.map((sp, idx) => {
          const spouseInTree = members[sp];
          const spouseName = spouseInTree ? spouseInTree.name : sp;
          const actualGender = spouseInTree ? (spouseInTree.gender === 'M' ? 'm' : 'f') : spouseGender;
          const childCount = person.gender === 'M'
            ? countChildrenForSpouse(person, sp, members)
            : 0;

          return (
            <div
              key={sp + idx}
              className={`fiche-sp-card${spouseInTree ? '' : ' static'}`}
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
              <div className="fiche-sp-num">{idx + 1}</div>
              <div className={`fiche-av-sp ${actualGender}`}>
                {getInitials(spouseName)}
              </div>
              <div className="fiche-sp-info">
                <div className="fiche-sp-name">
                  {spouseName}
                  <span className={`fiche-gender-tag ${actualGender}`}>
                    {actualGender === 'm' ? '\u2642' : '\u2640'}
                  </span>
                </div>
                {spouses.length > 1 && (
                  <div className="fiche-sp-sub">
                    {idx + 1}{idx === 0 ? 'ère' : 'ème'} épouse
                  </div>
                )}
              </div>
              {childCount > 0 && (
                <div className="fiche-sp-children">
                  {childCount} enfant{childCount > 1 ? 's' : ''}
                </div>
              )}
              {spouseInTree && <div className="fiche-sp-arrow">{'\u203A'}</div>}
            </div>
          );
        })}
        {onAddSpouse && (
          <button className="fiche-add-btn" onClick={onAddSpouse} type="button">
            <span className="fiche-add-ico">+</span>
            Ajouter {person.gender === 'M' ? 'une épouse' : 'un époux'}
          </button>
        )}
      </div>
    </div>
  );
}

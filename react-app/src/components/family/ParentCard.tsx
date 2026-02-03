import type { Member, MemberDict } from '../../lib/types';

interface Props {
  person: Member;
  members: MemberDict;
  onNavigate: (id: string) => void;
  onInfo?: (member: Member) => void;
  onAddParent?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ParentCard({ person, members, onNavigate, onInfo, onAddParent }: Props) {
  const father = person.father_id && members[person.father_id] ? members[person.father_id] : null;
  const mother = person.mother_ref && members[person.mother_ref] ? members[person.mother_ref] : null;
  const motherName = typeof person.mother_ref === 'string' && !members[person.mother_ref] ? person.mother_ref : null;

  const canAddMore = onAddParent && (!father || (!mother && !motherName));

  if (!father && !mother && !motherName && !onAddParent) return null;

  return (
    <div className="fiche-section">
      <div className="fiche-conn c-terra"></div>
      <div className="fiche-sh-header parents">
        <div className="fiche-sh-txt">
          <span className="fiche-sh-ico">{'\u25B2'}</span> Parents
        </div>
      </div>
      <div className="fiche-parents-grid">
        {father && (
          <div
            className="fiche-p-card father"
            onClick={() => onNavigate(father.id)}
          >
            {onInfo && (
              <button
                className="info-icon-btn"
                onClick={(e) => { e.stopPropagation(); onInfo(father); }}
                type="button"
              >
                i
              </button>
            )}
            <div className="fiche-av-sm m">
              {getInitials(father.name)}
              <span className="fiche-av-sm-gb">G{father.generation}</span>
            </div>
            <div className="fiche-p-info">
              <div className="fiche-p-name">{father.name}</div>
              <div className="fiche-p-role">
                <span className="fiche-gender-ico m">{'\u2642'}</span> Père
              </div>
            </div>
            <div className="fiche-p-arrow">{'\u203A'}</div>
          </div>
        )}
        {mother ? (
          <div
            className="fiche-p-card mother"
            onClick={() => onNavigate(mother.id)}
          >
            {onInfo && (
              <button
                className="info-icon-btn"
                onClick={(e) => { e.stopPropagation(); onInfo(mother); }}
                type="button"
              >
                i
              </button>
            )}
            <div className="fiche-av-sm f">
              {getInitials(mother.name)}
              <span className="fiche-av-sm-gb">G{mother.generation}</span>
            </div>
            <div className="fiche-p-info">
              <div className="fiche-p-name">{mother.name}</div>
              <div className="fiche-p-role">
                <span className="fiche-gender-ico f">{'\u2640'}</span> Mère
              </div>
            </div>
            <div className="fiche-p-arrow">{'\u203A'}</div>
          </div>
        ) : motherName ? (
          <div className="fiche-p-card mother static">
            {onInfo && (
              <button
                className="info-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo({
                    id: person.mother_ref!,
                    name: motherName,
                    first_name: null,
                    alias: null,
                    gender: 'F',
                    generation: person.generation - 1,
                    father_id: null,
                    mother_ref: null,
                    spouses: [],
                    children: [],
                    photo_url: null,
                    note: null,
                    birth_city: null,
                    birth_country: null,
                    village: null,
                  });
                }}
                type="button"
              >
                i
              </button>
            )}
            <div className="fiche-av-sm f">
              {getInitials(motherName)}
            </div>
            <div className="fiche-p-info">
              <div className="fiche-p-name">{motherName}</div>
              <div className="fiche-p-role">
                <span className="fiche-gender-ico f">{'\u2640'}</span> Mère
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {canAddMore && (
        <button
          className="fiche-add-btn"
          onClick={onAddParent}
          type="button"
        >
          <span className="fiche-add-ico">+</span>
          Ajouter un parent
        </button>
      )}
    </div>
  );
}

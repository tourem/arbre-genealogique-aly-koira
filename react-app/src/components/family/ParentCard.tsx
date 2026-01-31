import type { Member, MemberDict } from '../../lib/types';
import { genColors } from '../../lib/constants';

interface Props {
  person: Member;
  members: MemberDict;
  onNavigate: (id: string) => void;
}

function shortName(p: Member): string {
  const first = p.name.split(' ')[0];
  return p.alias ? `${first} (${p.alias})` : first;
}

export default function ParentCard({ person, members, onNavigate }: Props) {
  const father = person.father_id && members[person.father_id] ? members[person.father_id] : null;
  const mother = person.mother_ref && members[person.mother_ref] ? members[person.mother_ref] : null;
  const motherName = typeof person.mother_ref === 'string' && !members[person.mother_ref] ? person.mother_ref : null;

  if (!father && !mother && !motherName) return null;

  return (
    <>
      <div className="section-title">{'\u2B06\uFE0F'} Parents</div>
      <div className="parent-cards">
        {father && (
          <div
            className={`parent-card gen${father.generation}`}
            onClick={() => onNavigate(father.id)}
          >
            <div className="mini-avatar male">{'\u{1F468}'}</div>
            <div className="name">{shortName(father)}</div>
            <div className="label">P&egrave;re</div>
            <div className="gen-tag" style={{ background: genColors[father.generation] }}>
              G{father.generation}
            </div>
          </div>
        )}
        {mother ? (
          <div
            className={`parent-card gen${mother.generation}`}
            onClick={() => onNavigate(mother.id)}
          >
            <div className="mini-avatar female">{'\u{1F469}'}</div>
            <div className="name">{shortName(mother)}</div>
            <div className="label">M&egrave;re</div>
            <div className="gen-tag" style={{ background: genColors[mother.generation] }}>
              G{mother.generation}
            </div>
          </div>
        ) : motherName ? (
          <div className="parent-card static">
            <div className="mini-avatar female">{'\u{1F469}'}</div>
            <div className="name">{motherName.split(' ')[0]}</div>
            <div className="label">M&egrave;re</div>
          </div>
        ) : null}
      </div>
    </>
  );
}

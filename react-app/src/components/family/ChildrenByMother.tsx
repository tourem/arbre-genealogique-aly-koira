import type { Member, MemberDict } from '../../lib/types';
import ChildCard from './ChildCard';

interface Props {
  person: Member;
  kids: Member[];
  members: MemberDict;
  onNavigate: (id: string) => void;
}

export default function ChildrenByMother({ person, kids, members, onNavigate }: Props) {
  const spouses = person.spouses || [];

  // Group by mother when male with multiple spouses
  if (spouses.length > 1 && person.gender === 'M') {
    const childrenByMother: Record<string, Member[]> = {};
    kids.forEach((c) => {
      let motherKey = c.mother_ref || 'M\u00E8re inconnue';
      if (members[motherKey]) {
        motherKey = members[motherKey].name;
      }
      if (!childrenByMother[motherKey]) childrenByMother[motherKey] = [];
      childrenByMother[motherKey].push(c);
    });

    return (
      <>
        <div className="section-title">
          {'\u2B07\uFE0F'} Enfants ({kids.length})
        </div>
        {Object.entries(childrenByMother).map(([motherKey, children]) => (
          <div className="children-mother-group" key={motherKey}>
            <div className="mother-label">{'\u{1F469}'} {motherKey}</div>
            <div className="children-grid">
              {children.map((c) => (
                <ChildCard key={c.id} child={c} members={members} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </>
    );
  }

  // Simple display
  return (
    <>
      <div className="section-title">
        {'\u2B07\uFE0F'} Enfants ({kids.length})
      </div>
      <div className="children-grid">
        {kids.map((c) => (
          <ChildCard key={c.id} child={c} members={members} onNavigate={onNavigate} />
        ))}
      </div>
    </>
  );
}

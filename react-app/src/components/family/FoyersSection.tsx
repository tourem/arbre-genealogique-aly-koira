import type { Member, MemberDict } from '../../lib/types';
import { computeFoyers } from '../../lib/foyers';
import SonghayTerm from '../ui/SonghayTerm';
import FoyerBlock from './FoyerBlock';

interface Props {
  person: Member;
  members: MemberDict;
  onNavigate: (id: string) => void;
  onInfo?: (member: Member) => void;
}

export default function FoyersSection({ person, members, onNavigate, onInfo }: Props) {
  const foyers = computeFoyers(person, members);
  if (foyers.length === 0) return null;

  const totalChildren = foyers.reduce((acc, f) => acc + f.children.length, 0);
  const showRank = foyers.filter((f) => !f.orphan).length > 1;

  return (
    <section className="foyers-section" aria-label="Foyers">
      <header className="foyers-section-header">
        <h2 className="foyers-section-title">
          Foyers
          <span className="foyers-section-songhay" aria-hidden="true">
            <SonghayTerm term="windi" variant="inline" />
          </span>
        </h2>
        <span
          className="foyers-section-count"
          aria-label={`${foyers.length} foyer${foyers.length > 1 ? 's' : ''}, ${totalChildren} enfant${totalChildren > 1 ? 's' : ''} au total`}
        >
          {foyers.length === 1
            ? `${totalChildren} enfant${totalChildren > 1 ? 's' : ''} au total`
            : `${foyers.length} foyers · ${totalChildren} enfant${totalChildren > 1 ? 's' : ''}`}
        </span>
      </header>
      <div className="foyers-list">
        {foyers.map((f, i) => (
          <FoyerBlock
            key={`${f.spouse?.id ?? f.spouseName ?? 'orphan'}-${i}`}
            foyer={f}
            personGender={person.gender}
            members={members}
            onNavigate={onNavigate}
            onInfo={onInfo}
            showRank={showRank}
          />
        ))}
      </div>
    </section>
  );
}

import type { Member, MemberDict } from '../../lib/types';

interface Props {
  person: Member;
  members: MemberDict;
  onNavigate: (id: string) => void;
}

export default function ExtendedFamily({ person, members, onNavigate }: Props) {
  // Lalla Hamatou - show brother
  if (person.id === 'lalla_hamatou' && members['mahamane_h']) {
    return (
      <>
        <div className="section-title">{'\u{1F46B}'} Fr&egrave;re</div>
        <div className="parent-cards">
          <div className="parent-card extended" onClick={() => onNavigate('mahamane_h')}>
            <div className="mini-avatar male">{'\u{1F468}'}</div>
            <div className="name">Mahamane (Koro)</div>
            <div className="label">Fr&egrave;re</div>
            <div className="extended-badge">M&ecirc;me p&egrave;re &rarr;</div>
          </div>
        </div>
      </>
    );
  }

  return null;
}

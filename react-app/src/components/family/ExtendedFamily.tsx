import type { Member, MemberDict } from '../../lib/types';

interface Props {
  person: Member;
  members: MemberDict;
  onNavigate: (id: string) => void;
}

export default function ExtendedFamily({ person, members, onNavigate }: Props) {
  // Alkamahamane - show in-law family
  if (person.id === 'alkamahamane' && members['hamatou_lassane']) {
    return (
      <>
        <div className="section-title">
          {'\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}'} Belle-famille (famille de l&apos;&eacute;pouse)
        </div>
        <div className="extended-family-note">
          Famille de Lalla Hamatou - Cliquez sur son nom ci-dessus pour voir
        </div>
        <div className="parent-cards">
          <div className="parent-card extended" onClick={() => onNavigate('hamatou_lassane')}>
            <div className="mini-avatar male">{'\u{1F468}'}</div>
            <div className="name">Hamatou Lassane (Koro)</div>
            <div className="label">Beau-p&egrave;re</div>
            <div className="extended-badge">P&egrave;re de l&apos;&eacute;pouse &rarr;</div>
          </div>
          <div className="parent-card extended" onClick={() => onNavigate('mahamane_h')}>
            <div className="mini-avatar male">{'\u{1F468}'}</div>
            <div className="name">Mahamane (Koro)</div>
            <div className="label">Beau-fr&egrave;re</div>
            <div className="extended-badge">Fr&egrave;re de l&apos;&eacute;pouse &rarr;</div>
          </div>
        </div>
      </>
    );
  }

  // Mahamane Hamatou - show alliance family
  if (person.id === 'mahamane_h' && members['alkamahamane']) {
    return (
      <>
        <div className="section-title">
          {'\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}'} Famille &eacute;largie (par alliance)
        </div>
        <div className="extended-family-note">
          &Eacute;poux de sa s&oelig;ur Lalla Hamatou
        </div>
        <div className="parent-cards">
          <div className="parent-card extended" onClick={() => onNavigate('alkamahamane')}>
            <div className="mini-avatar male">{'\u{1F468}'}</div>
            <div className="name">Alkamahamane</div>
            <div className="label">Beau-fr&egrave;re</div>
            <div className="extended-badge">Voir sa branche &rarr;</div>
          </div>
          <div className="parent-card extended" onClick={() => onNavigate('lalla_hamatou')}>
            <div className="mini-avatar female">{'\u{1F469}'}</div>
            <div className="name">Lalla Hamatou</div>
            <div className="label">S&oelig;ur</div>
            <div className="extended-badge">Voir ses enfants &rarr;</div>
          </div>
        </div>
      </>
    );
  }

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

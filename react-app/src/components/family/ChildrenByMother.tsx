import { useState } from 'react';
import type { Member, MemberDict } from '../../lib/types';
import ChildCard from './ChildCard';

interface Props {
  person: Member;
  kids: Member[];
  members: MemberDict;
  onNavigate: (id: string) => void;
  onInfo?: (member: Member) => void;
  onAddChild?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function AddChildCard({ onAddChild }: { onAddChild: () => void }) {
  return (
    <button className="fiche-add-btn" onClick={onAddChild} type="button">
      <span className="fiche-add-ico">+</span>
      Ajouter un enfant
    </button>
  );
}

interface WifeGroupProps {
  motherKey: string;
  motherName: string;
  children: Member[];
  members: MemberDict;
  onNavigate: (id: string) => void;
  onInfo?: (member: Member) => void;
}

function WifeGroup({ motherName, children, members, onNavigate, onInfo }: WifeGroupProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="fiche-wife-group">
      <div
        className={`fiche-wg-header${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="fiche-wg-av">{getInitials(motherName)}</div>
        <div className="fiche-wg-name">Enfants avec {motherName}</div>
        <div className="fiche-wg-count">{children.length}</div>
        <div className="fiche-wg-chev">{'\u203A'}</div>
      </div>
      {open && (
        <div className="fiche-kids-grid">
          {children.map((c) => (
            <ChildCard key={c.id} child={c} members={members} onNavigate={onNavigate} onInfo={onInfo} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChildrenByMother({ person, kids, members, onNavigate, onInfo, onAddChild }: Props) {
  const spouses = person.spouses || [];

  // Group by mother when male with multiple spouses
  if (spouses.length > 1 && person.gender === 'M') {
    const childrenByMother: Record<string, { name: string; children: Member[] }> = {};
    kids.forEach((c) => {
      const motherRef = c.mother_ref || 'M\u00E8re inconnue';
      const motherMember = members[motherRef];
      const motherName = motherMember ? motherMember.name : motherRef;
      if (!childrenByMother[motherRef]) {
        childrenByMother[motherRef] = { name: motherName, children: [] };
      }
      childrenByMother[motherRef].children.push(c);
    });

    return (
      <div className="fiche-section">
        <div className="fiche-conn c-green"></div>
        <div className="fiche-sh-header children">
          <div className="fiche-sh-txt">
            <span className="fiche-sh-ico">{'\u25BC'}</span> Enfants
            <span className="fiche-sh-count">{kids.length}</span>
          </div>
        </div>
        {Object.entries(childrenByMother).map(([key, group]) => (
          <WifeGroup
            key={key}
            motherKey={key}
            motherName={group.name}
            children={group.children}
            members={members}
            onNavigate={onNavigate}
            onInfo={onInfo}
          />
        ))}
        {onAddChild && <AddChildCard onAddChild={onAddChild} />}
      </div>
    );
  }

  // Simple display (single spouse or no grouping)
  return (
    <div className="fiche-section">
      <div className="fiche-conn c-green"></div>
      <div className="fiche-sh-header children">
        <div className="fiche-sh-txt">
          <span className="fiche-sh-ico">{'\u25BC'}</span> Enfants
          <span className="fiche-sh-count">{kids.length}</span>
        </div>
      </div>
      <div className="fiche-kids-grid">
        {kids.map((c) => (
          <ChildCard key={c.id} child={c} members={members} onNavigate={onNavigate} onInfo={onInfo} />
        ))}
      </div>
      {onAddChild && <AddChildCard onAddChild={onAddChild} />}
    </div>
  );
}

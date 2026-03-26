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

interface ParentGroupProps {
  parentName: string;
  parentGender: 'M' | 'F';
  children: Member[];
  members: MemberDict;
  onNavigate: (id: string) => void;
  onInfo?: (member: Member) => void;
}

function ParentGroup({ parentName, parentGender, children, members, onNavigate, onInfo }: ParentGroupProps) {
  const [open, setOpen] = useState(true);
  const label = parentGender === 'M' ? 'Enfants avec' : 'Enfants avec';

  return (
    <div className="fiche-wife-group">
      <div
        className={`fiche-wg-header${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <div className={`fiche-wg-av ${parentGender === 'F' ? 'female' : 'male'}`}>
          {getInitials(parentName)}
        </div>
        <div className="fiche-wg-name">{label} {parentName}</div>
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
  // For males: check if children have multiple different mothers
  if (person.gender === 'M') {
    // Group by mother NAME (not ID) to handle duplicates
    const childrenByMotherName: Record<string, { name: string; children: Member[] }> = {};
    kids.forEach((c) => {
      const motherRef = c.mother_ref;
      const motherMember = motherRef ? members[motherRef] : null;
      const motherName = motherMember ? motherMember.name : 'Mère inconnue';
      if (!childrenByMotherName[motherName]) {
        childrenByMotherName[motherName] = { name: motherName, children: [] };
      }
      childrenByMotherName[motherName].children.push(c);
    });

    const uniqueMotherNames = Object.keys(childrenByMotherName);
    if (uniqueMotherNames.length > 1) {

      return (
        <div className="fiche-section">
          <div className="fiche-conn c-green"></div>
          <div className="fiche-sh-header children">
            <div className="fiche-sh-txt">
              <span className="fiche-sh-ico">{'\u25BC'}</span> Enfants
              <span className="fiche-sh-count">{kids.length}</span>
            </div>
          </div>
          {Object.entries(childrenByMotherName).map(([key, group]) => (
            <ParentGroup
              key={key}
              parentName={group.name}
              parentGender="F"
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
  }

  // For females: check if children have multiple different fathers
  if (person.gender === 'F') {
    // Group by father NAME (not ID) to handle duplicates
    const childrenByFatherName: Record<string, { name: string; children: Member[] }> = {};
    kids.forEach((c) => {
      const fatherRef = c.father_id;
      const fatherMember = fatherRef ? members[fatherRef] : null;
      const fatherName = fatherMember ? fatherMember.name : 'Père inconnu';
      if (!childrenByFatherName[fatherName]) {
        childrenByFatherName[fatherName] = { name: fatherName, children: [] };
      }
      childrenByFatherName[fatherName].children.push(c);
    });

    const uniqueFatherNames = Object.keys(childrenByFatherName);
    if (uniqueFatherNames.length > 1) {
      return (
        <div className="fiche-section">
          <div className="fiche-conn c-green"></div>
          <div className="fiche-sh-header children">
            <div className="fiche-sh-txt">
              <span className="fiche-sh-ico">{'\u25BC'}</span> Enfants
              <span className="fiche-sh-count">{kids.length}</span>
            </div>
          </div>
          {Object.entries(childrenByFatherName).map(([key, group]) => (
            <ParentGroup
              key={key}
              parentName={group.name}
              parentGender="M"
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
  }

  // Simple display (single parent or no grouping needed)
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

import { useState } from 'react';
import type { Member, MemberDict } from '../../lib/types';
import { genNames, genColors } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { useMembersContext } from '../../context/MembersContext';
import MemberFormModal from '../admin/MemberFormModal';

interface Props {
  member: Member;
  members: MemberDict;
  onClose: () => void;
}

export default function TreePopup({ member, members, onClose }: Props) {
  const { isAdmin } = useAuth();
  const { refetchMembers } = useMembersContext();
  const [showEdit, setShowEdit] = useState(false);

  const father = member.father_id ? members[member.father_id] : null;
  const motherRef = member.mother_ref;
  const childCount = (member.children || []).filter((c) => members[c]).length;
  const spouses = (member.spouses || [])
    .filter((s) => members[s])
    .map((s) => members[s]);
  const genColor = genColors[member.generation] || '#6366f1';

  const handleSaved = async () => {
    setShowEdit(false);
    await refetchMembers();
    onClose();
  };

  if (showEdit) {
    return (
      <MemberFormModal
        member={member}
        onClose={() => setShowEdit(false)}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <div className="tree-popup-overlay" onClick={onClose}>
      <div className="tree-popup" onClick={(e) => e.stopPropagation()}>
        <button className="tree-popup-close" onClick={onClose}>
          &times;
        </button>

        <div className="tree-popup-header">
          <div
            className={`tree-popup-avatar ${member.gender === 'M' ? 'male' : 'female'}`}
          >
            {member.photo_url ? (
              <img src={member.photo_url} alt={member.name} className="tree-popup-photo" />
            ) : (
              member.gender === 'M' ? '\u2642' : '\u2640'
            )}
          </div>
          <div className="tree-popup-title">
            <h3>{member.name}</h3>
            {member.alias && (
              <span className="tree-popup-alias">{member.alias}</span>
            )}
          </div>
          <span
            className="tree-popup-gen-badge"
            style={{ background: genColor }}
          >
            {genNames[member.generation] || `Gen ${member.generation}`}
          </span>
        </div>

        <div className="tree-popup-body">
          <div className="tree-popup-row">
            <span className="tree-popup-label">Genre</span>
            <span>{member.gender === 'M' ? 'Homme' : 'Femme'}</span>
          </div>

          <div className="tree-popup-row">
            <span className="tree-popup-label">Pere</span>
            <span>{father ? father.name : 'Inconnu'}</span>
          </div>

          <div className="tree-popup-row">
            <span className="tree-popup-label">Mere</span>
            <span>{motherRef || 'Inconnue'}</span>
          </div>

          {spouses.length > 0 && (
            <div className="tree-popup-row">
              <span className="tree-popup-label">
                {member.gender === 'M' ? 'Epouse(s)' : 'Epoux'}
              </span>
              <span>{spouses.map((s) => s.name).join(', ')}</span>
            </div>
          )}

          <div className="tree-popup-row">
            <span className="tree-popup-label">Enfants</span>
            <span>{childCount}</span>
          </div>
        </div>

        {isAdmin && (
          <div className="tree-popup-footer">
            <button
              className="tree-popup-edit-btn"
              onClick={() => setShowEdit(true)}
            >
              Modifier
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

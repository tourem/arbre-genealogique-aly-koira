import { useState } from 'react';
import type { Member, MemberDict } from '../../lib/types';
import { genNames, genColors } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { useMembersContext } from '../../context/MembersContext';
import { supabase } from '../../lib/supabase';
import MemberFormModal from '../admin/MemberFormModal';

interface Props {
  member: Member;
  members: MemberDict;
  onClose: () => void;
}

export default function TreePopup({ member, members, onClose }: Props) {
  const { isAdmin } = useAuth();
  const { refetchMembers, updateMember } = useMembersContext();
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const father = member.father_id ? members[member.father_id] : null;
  const motherRef = member.mother_ref;
  const childCount = (member.children || []).filter((c) => members[c]).length;
  const isLeaf = childCount === 0;
  const spouses = (member.spouses || [])
    .filter((s) => members[s])
    .map((s) => members[s]);
  const genColor = genColors[member.generation] || '#6366f1';

  const handleSaved = (updatedPayload?: Partial<Member>) => {
    if (updatedPayload && member.id) {
      updateMember(member.id, updatedPayload);
    }
    setShowEdit(false);
    onClose();
    refetchMembers();
  };

  const handleDelete = async () => {
    if (!isLeaf) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      // 1. Remove member ID from other members' children arrays
      const parents = Object.values(members).filter(
        (m) => (m.children || []).includes(member.id)
      );
      for (const parent of parents) {
        const updated = parent.children.filter((c) => c !== member.id);
        const { error } = await supabase
          .from('members')
          .update({ children: updated })
          .eq('id', parent.id);
        if (error) throw error;
      }

      // 2. Remove member ID from spouses' spouses arrays
      for (const spouseId of member.spouses || []) {
        const spouse = members[spouseId];
        if (!spouse) continue;
        const updated = (spouse.spouses || []).filter((s) => s !== member.id);
        const { error } = await supabase
          .from('members')
          .update({ spouses: updated })
          .eq('id', spouse.id);
        if (error) throw error;
      }

      // 3. Delete photo from storage if exists
      if (member.photo_url) {
        const path = member.photo_url.split('/photos/')[1];
        if (path) {
          await supabase.storage.from('photos').remove([path]);
        }
      }

      // 4. Delete the member row
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', member.id);
      if (error) throw error;

      // 5. Refresh and close
      await refetchMembers();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
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

  if (confirmDelete) {
    return (
      <div className="tree-popup-overlay" onClick={() => setConfirmDelete(false)}>
        <div className="tree-popup" onClick={(e) => e.stopPropagation()}>
          <button
            className="tree-popup-close"
            onClick={() => setConfirmDelete(false)}
          >
            &times;
          </button>
          <div className="tree-popup-confirm">
            <p className="tree-popup-confirm-msg">
              Supprimer <strong>{member.name}</strong> ? Cette action est
              irreversible.
            </p>
            {deleteError && (
              <p className="tree-popup-confirm-msg" style={{ color: '#ef4444' }}>
                {deleteError}
              </p>
            )}
            <div className="tree-popup-confirm-actions">
              <button
                className="btn-cancel"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                className="btn-confirm-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      </div>
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

          {member.note && (
            <div className="note-callout">
              <span className="note-callout-ico" aria-hidden="true">★</span>
              <p className="note-callout-txt">{member.note}</p>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="tree-popup-footer">
            <button
              className="tree-popup-edit-btn"
              onClick={() => setShowEdit(true)}
            >
              Modifier
            </button>
            <button
              className="tree-popup-delete-btn"
              onClick={() => setConfirmDelete(true)}
              disabled={!isLeaf}
              title={!isLeaf ? "Supprimez d'abord les enfants" : 'Supprimer ce membre'}
            >
              Supprimer
            </button>
            {!isLeaf && (
              <p className="tree-popup-disabled-hint">
                Ce membre a des enfants et ne peut pas etre supprime
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

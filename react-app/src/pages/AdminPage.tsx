import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMembersContext } from '../context/MembersContext';
import type { Suggestion, UserProfile, Member } from '../lib/types';
import MemberFormModal from '../components/admin/MemberFormModal';

type AdminTab = 'suggestions' | 'members' | 'users';

export default function AdminPage() {
  const { members, refetchMembers } = useMembersContext();
  const [tab, setTab] = useState<AdminTab>('suggestions');

  return (
    <div className="page active">
      <div className="scroll">
        <h2 className="page-title">Administration</h2>

        <div className="admin-tabs">
          <button
            className={`admin-tab${tab === 'suggestions' ? ' active' : ''}`}
            onClick={() => setTab('suggestions')}
            type="button"
          >
            Suggestions
          </button>
          <button
            className={`admin-tab${tab === 'members' ? ' active' : ''}`}
            onClick={() => setTab('members')}
            type="button"
          >
            Membres
          </button>
          <button
            className={`admin-tab${tab === 'users' ? ' active' : ''}`}
            onClick={() => setTab('users')}
            type="button"
          >
            Utilisateurs
          </button>
        </div>

        {tab === 'suggestions' && <SuggestionsSection />}
        {tab === 'members' && (
          <MembersSection members={members} refetch={refetchMembers} />
        )}
        {tab === 'users' && <UsersSection />}
      </div>
    </div>
  );
}

/* ---- Suggestions en attente ---- */
function SuggestionsSection() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const loadSuggestions = useCallback(async () => {
    const { data } = await supabase
      .from('suggestions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setSuggestions((data as Suggestion[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    await supabase
      .from('suggestions')
      .update({
        status,
        admin_note: noteMap[id] || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    loadSuggestions();
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="admin-section">
      {suggestions.length === 0 ? (
        <div className="empty-state">
          <p>Aucune suggestion en attente.</p>
        </div>
      ) : (
        suggestions.map((s) => (
          <div key={s.id} className="suggestion-card">
            <div className="suggestion-header">
              <span className="suggestion-type">
                {s.type === 'add' ? 'Ajout' : s.type === 'edit' ? 'Modification' : 'Suppression'}
              </span>
              <span className="suggestion-date">
                {new Date(s.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="suggestion-body">
              <strong>{s.payload.nom}</strong>
              {s.payload.prenom && ` (${s.payload.prenom})`}
              {s.payload.genre && ` - ${s.payload.genre === 'M' ? 'Homme' : 'Femme'}`}
              {s.payload.pere?.nom && (
                <div>P&egrave;re : {s.payload.pere.nom} {s.payload.pere.prenom}</div>
              )}
              {s.payload.mere?.nom && (
                <div>M&egrave;re : {s.payload.mere.nom} {s.payload.mere.prenom}</div>
              )}
              {s.payload.enfants?.length > 0 && (
                <div>Enfants : {s.payload.enfants.map((e) => `${e.nom} ${e.prenom}`).join(', ')}</div>
              )}
            </div>
            <div className="suggestion-actions">
              <input
                type="text"
                className="admin-note-input"
                placeholder="Note (optionnel)"
                value={noteMap[s.id] || ''}
                onChange={(e) =>
                  setNoteMap((prev) => ({ ...prev, [s.id]: e.target.value }))
                }
              />
              <div className="suggestion-buttons">
                <button
                  className="btn-approve"
                  onClick={() => handleReview(s.id, 'approved')}
                  type="button"
                >
                  Approuver
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleReview(s.id, 'rejected')}
                  type="button"
                >
                  Rejeter
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ---- Gestion des membres ---- */
function MembersSection({
  members,
  refetch,
}: {
  members: Record<string, Member>;
  refetch: () => Promise<void>;
}) {
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const memberList = Object.values(members).filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    if (!confirm(`Supprimer le membre "${id}" ?`)) return;
    await supabase.from('members').delete().eq('id', id);
    refetch();
  };

  const openAdd = () => {
    setEditMember(null);
    setShowModal(true);
  };

  const openEdit = (m: Member) => {
    setEditMember(m);
    setShowModal(true);
  };

  const handleSaved = () => {
    setShowModal(false);
    refetch();
  };

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <input
          type="text"
          placeholder="Rechercher un membre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search"
        />
        <button className="login-btn" onClick={openAdd} type="button">
          + Ajouter
        </button>
      </div>

      <div className="admin-members-list">
        {memberList.map((m) => (
          <div key={m.id} className="admin-member-row">
            <div className="admin-member-info">
              <strong>{m.name}</strong>
              {m.alias && <span className="admin-member-alias"> ({m.alias})</span>}
              <span className="admin-member-meta">
                {' '}&middot; {m.gender === 'M' ? 'H' : 'F'} &middot; G{m.generation}
              </span>
            </div>
            <div className="admin-member-actions">
              <button
                className="btn-edit"
                onClick={() => openEdit(m)}
                type="button"
              >
                Modifier
              </button>
              <button
                className="btn-delete"
                onClick={() => handleDelete(m.id)}
                type="button"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <MemberFormModal
          member={editMember}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

/* ---- Gestion des utilisateurs ---- */
function UsersSection() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, display_name, role')
      .order('created_at', { ascending: true });
    setProfiles((data as UserProfile[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const toggleRole = async (profile: UserProfile) => {
    const newRole = profile.role === 'admin' ? 'user' : 'admin';
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profile.id);
    loadProfiles();
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="admin-section">
      {profiles.length === 0 ? (
        <div className="empty-state">
          <p>Aucun utilisateur.</p>
        </div>
      ) : (
        <div className="admin-users-list">
          {profiles.map((p) => (
            <div key={p.id} className="admin-user-row">
              <div className="admin-user-info">
                <strong>{p.display_name || p.email}</strong>
                <span className="admin-user-email">{p.email}</span>
              </div>
              <div className="admin-user-actions">
                <span className={`header-role-badge ${p.role}`}>
                  {p.role === 'admin' ? 'Admin' : 'Membre'}
                </span>
                <button
                  className="btn-toggle-role"
                  onClick={() => toggleRole(p)}
                  type="button"
                >
                  {p.role === 'admin' ? 'Passer en Membre' : 'Passer en Admin'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

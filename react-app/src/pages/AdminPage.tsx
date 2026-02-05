import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMembersContext } from '../context/MembersContext';
import type { Suggestion, UserProfile, Member } from '../lib/types';
import MemberFormModal from '../components/admin/MemberFormModal';
import MergeModal from '../components/admin/MergeModal';
import TermsManagementSection from '../components/admin/TermsManagementSection';

type AdminTab = 'suggestions' | 'members' | 'users' | 'terms';

const TAB_LABELS: Record<AdminTab, string> = {
  suggestions: 'Suggestions',
  members: 'Membres',
  users: 'Utilisateurs',
  terms: 'Termes',
};

export default function AdminPage() {
  const { members, refetchMembers } = useMembersContext();
  const [tab, setTab] = useState<AdminTab>('suggestions');

  return (
    <div className="admin-page">
      <div className="scroll" tabIndex={0}>
        <h2 className="page-title">Administration</h2>

        <div className="adm-tabs">
          {(['suggestions', 'members', 'users', 'terms'] as AdminTab[]).map((t) => (
            <button
              key={t}
              className={`adm-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
              type="button"
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === 'suggestions' && <SuggestionsSection />}
        {tab === 'members' && (
          <MembersSection members={members} refetch={refetchMembers} />
        )}
        {tab === 'users' && <UsersSection />}
        {tab === 'terms' && <TermsManagementSection />}
      </div>
    </div>
  );
}

/* ---- Suggestions en attente (inchange) ---- */
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

/* ---- Gestion des membres — redesign ---- */
function MembersSection({
  members,
  refetch,
}: {
  members: Record<string, Member>;
  refetch: () => Promise<void>;
}) {
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'F'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [toolbarMenuOpen, setToolbarMenuOpen] = useState(false);
  const PAGE_SIZE = 20;

  const memberList = Object.values(members);

  /* KPIs */
  const totalCount = memberList.length;
  const maleCount = memberList.filter((m) => m.gender === 'M').length;
  const femaleCount = memberList.filter((m) => m.gender === 'F').length;
  const genCount = new Set(memberList.map((m) => m.generation)).size;

  /* Filtering */
  const filtered = memberList
    .filter((m) => {
      if (genderFilter !== 'all' && m.gender !== genderFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          (m.alias?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    })
    .sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name));

  /* Reset page on filter change */
  useEffect(() => setCurrentPage(1), [genderFilter, search]);

  /* Pagination */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  /* Group by generation */
  const groups: [number, Member[]][] = [];
  let curGen: number | null = null;
  let curGroup: Member[] = [];
  for (const m of paged) {
    if (m.generation !== curGen) {
      if (curGen !== null) groups.push([curGen, curGroup]);
      curGen = m.generation;
      curGroup = [m];
    } else {
      curGroup.push(m);
    }
  }
  if (curGen !== null) groups.push([curGen, curGroup]);

  /* Actions */
  const handleDelete = async (id: string) => {
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
  const handleSaved = async () => {
    await refetch();
    setShowModal(false);
  };

  /* Helpers */
  const getInitials = (m: Member) => {
    const parts = m.name.split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  };

  const getMiniStats = (m: Member) => {
    const parts: string[] = [];
    if (m.spouses?.length)
      parts.push(`${m.spouses.length} épouse${m.spouses.length > 1 ? 's' : ''}`);
    if (m.children?.length)
      parts.push(`${m.children.length} enfant${m.children.length > 1 ? 's' : ''}`);
    return parts.join(' · ');
  };

  return (
    <div className="admin-section">
      {/* KPIs */}
      <div className="adm-kpis">
        <div className="adm-kpi gold">
          <strong>{totalCount}</strong> membres
        </div>
        <div className="adm-kpi blue">
          <strong>{maleCount}</strong> hommes
        </div>
        <div className="adm-kpi violet">
          <strong>{femaleCount}</strong> femmes
        </div>
        <div className="adm-kpi terra">
          <strong>{genCount}</strong> générations
        </div>
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar">
        <input
          type="text"
          className="adm-search"
          placeholder="Rechercher un membre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="adm-pills">
          {(
            [
              ['all', 'Tous'],
              ['M', 'Hommes'],
              ['F', 'Femmes'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              className={`adm-pill${genderFilter === v ? ' active' : ''}`}
              onClick={() => setGenderFilter(v as 'all' | 'M' | 'F')}
              type="button"
            >
              {l}
            </button>
          ))}
        </div>
        <div className="adm-toolbar-actions">
          <button
            className="adm-btn-more"
            onClick={() => setToolbarMenuOpen(!toolbarMenuOpen)}
            type="button"
            title="Actions avancées"
          >
            &hellip;
          </button>
          {toolbarMenuOpen && (
            <div className="adm-toolbar-menu">
              <button
                onClick={() => {
                  setToolbarMenuOpen(false);
                  setShowMergeModal(true);
                }}
              >
                &#x1F517; Fusionner deux membres
              </button>
            </div>
          )}
        </div>
        <button className="adm-btn-add" onClick={openAdd} type="button">
          + Ajouter
        </button>
      </div>

      {/* Members grouped by generation */}
      <div className="adm-rows">
        {groups.map(([gen, groupMembers]) => (
          <div key={gen}>
            <div className="adm-ggroup">
              <span>
                Génération <strong>{gen}</strong> &mdash; {groupMembers.length}{' '}
                membre{groupMembers.length > 1 ? 's' : ''}
              </span>
            </div>
            {groupMembers.map((m) => (
              <div
                key={m.id}
                className={`adm-row ${m.gender === 'M' ? 'male' : 'female'}`}
              >
                <div className={`adm-av ${m.gender === 'M' ? 'm' : 'f'}`}>
                  {getInitials(m)}
                </div>
                <div className="adm-row-info">
                  <strong>
                    {m.name}
                    {m.alias && (
                      <span className="adm-row-alias"> ({m.alias})</span>
                    )}
                  </strong>
                  <span className="adm-row-sub">
                    {m.gender === 'M' ? 'Homme' : 'Femme'}
                    {getMiniStats(m) && (
                      <span className="adm-row-mini">
                        {' '}
                        &middot; {getMiniStats(m)}
                      </span>
                    )}
                  </span>
                </div>
                <span className="adm-badge gen">Gen. {m.generation}</span>
                <div className="adm-acts">
                  <button
                    onClick={() => openEdit(m)}
                    title="Modifier"
                    type="button"
                  >
                    &#x270E;
                  </button>
                  <button
                    onClick={() =>
                      setMenuOpen(menuOpen === m.id ? null : m.id)
                    }
                    title="Plus"
                    type="button"
                  >
                    &hellip;
                  </button>
                  {menuOpen === m.id && (
                    <div className="adm-dropdown">
                      <button
                        className="danger"
                        onClick={() => {
                          setMenuOpen(null);
                          setConfirmDelete(m);
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="adm-pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            &lsaquo;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={currentPage === p ? 'active' : ''}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            &rsaquo;
          </button>
          <span className="adm-page-info">
            {(currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} sur{' '}
            {filtered.length}
          </span>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="adm-confirm-overlay"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="adm-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <p>
              Supprimer le membre &laquo;&nbsp;
              <strong>{confirmDelete.name}</strong>&nbsp;&raquo; ?
            </p>
            <p className="adm-confirm-sub">
              Cette action est irr&eacute;versible.
            </p>
            <div className="adm-confirm-actions">
              <button onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button
                className="adm-confirm-danger"
                onClick={() => {
                  handleDelete(confirmDelete.id);
                  setConfirmDelete(null);
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <MemberFormModal
          member={editMember}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {showMergeModal && (
        <MergeModal
          members={members}
          onClose={() => setShowMergeModal(false)}
          onMerged={async () => {
            await refetch();
            setShowMergeModal(false);
          }}
        />
      )}
    </div>
  );
}

/* ---- Gestion des utilisateurs — redesign ---- */
function UsersSection() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>(
    'all',
  );
  const [confirmAction, setConfirmAction] = useState<{
    profile: UserProfile;
    newRole: 'admin' | 'user';
  } | null>(null);

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

  /* KPIs */
  const adminCount = profiles.filter((p) => p.role === 'admin').length;
  const memberCount = profiles.filter((p) => p.role === 'user').length;

  /* Filtering */
  const filtered = profiles.filter((p) => {
    if (roleFilter !== 'all' && p.role !== roleFilter) return false;
    if (
      search &&
      !p.display_name?.toLowerCase().includes(search.toLowerCase()) &&
      !p.email.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  /* Initials */
  const getInitials = (p: UserProfile) => {
    if (p.display_name) {
      const parts = p.display_name.split(' ');
      return parts.length > 1
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    }
    return p.email[0].toUpperCase();
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="admin-section">
      {/* KPIs */}
      <div className="adm-kpis">
        <div className="adm-kpi gold">
          <strong>{profiles.length}</strong> utilisateurs
        </div>
        <div className="adm-kpi terra">
          <strong>{adminCount}</strong> admins
        </div>
        <div className="adm-kpi blue">
          <strong>{memberCount}</strong> membres
        </div>
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar">
        <input
          type="text"
          className="adm-search"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="adm-pills">
          {(
            [
              ['all', 'Tous'],
              ['admin', 'Admin'],
              ['user', 'Membre'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              className={`adm-pill${roleFilter === v ? ' active' : ''}`}
              onClick={() => setRoleFilter(v as 'all' | 'admin' | 'user')}
              type="button"
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Users list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>Aucun utilisateur.</p>
        </div>
      ) : (
        <div className="adm-rows">
          {filtered.map((p) => (
            <div key={p.id} className={`adm-row ${p.role}`}>
              <div className={`adm-av ${p.role}`}>{getInitials(p)}</div>
              <div className="adm-row-info">
                <strong>{p.display_name || p.email}</strong>
                <span className="adm-row-sub">{p.email}</span>
              </div>
              <span className={`adm-badge ${p.role}`}>
                {p.role === 'admin' ? 'Admin' : 'Membre'}
              </span>
              <div className="adm-acts">
                <button
                  onClick={() =>
                    setConfirmAction({
                      profile: p,
                      newRole: p.role === 'admin' ? 'user' : 'admin',
                    })
                  }
                  title={
                    p.role === 'admin'
                      ? 'Passer en Membre'
                      : 'Passer en Admin'
                  }
                  type="button"
                >
                  &hellip;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role change confirmation modal */}
      {confirmAction && (
        <div
          className="adm-confirm-overlay"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="adm-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <p>
              Changer le r&ocirc;le de{' '}
              <strong>
                {confirmAction.profile.display_name ||
                  confirmAction.profile.email}
              </strong>{' '}
              ?
            </p>
            <p className="adm-confirm-sub">
              {confirmAction.newRole === 'admin'
                ? "Cet utilisateur aura accès à toutes les fonctions d'administration."
                : "Cet utilisateur perdra ses droits d'administration."}
            </p>
            <div className="adm-confirm-actions">
              <button onClick={() => setConfirmAction(null)}>Annuler</button>
              <button
                className="adm-confirm-gold"
                onClick={() => {
                  toggleRole(confirmAction.profile);
                  setConfirmAction(null);
                }}
              >
                {confirmAction.newRole === 'admin'
                  ? 'Passer en Admin'
                  : 'Passer en Membre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

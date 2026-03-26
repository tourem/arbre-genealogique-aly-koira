import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMembersContext } from '../context/MembersContext';
import type { Suggestion, UserProfile, Member } from '../lib/types';
import MemberFormModal from '../components/admin/MemberFormModal';
import MergeModal from '../components/admin/MergeModal';
import MergeHistorySection from '../components/admin/MergeHistorySection';
import TermsManagementSection from '../components/admin/TermsManagementSection';

type AdminTab = 'suggestions' | 'members' | 'history' | 'users' | 'terms';

const TAB_LABELS: Record<AdminTab, string> = {
  suggestions: 'Suggestions',
  members: 'Membres',
  history: 'Fusions',
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
          {(['suggestions', 'members', 'history', 'users', 'terms'] as AdminTab[]).map((t) => (
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
        {tab === 'history' && <MergeHistorySection onReverted={refetchMembers} />}
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
    if (m.spouses?.length) {
      const spouseWord = m.gender === 'M'
        ? `épouse${m.spouses.length > 1 ? 's' : ''}`
        : 'époux';
      parts.push(`${m.spouses.length} ${spouseWord}`);
    }
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
          members={members}
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
type StatusFilter = 'all' | 'active' | 'pending';
type UserAction = 'activate' | 'deactivate' | 'promote' | 'demote' | 'delete' | 'reset_password';

function UsersSection() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    profile: UserProfile;
    action: UserAction;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadProfiles = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, display_name, role, is_active')
      .order('created_at', { ascending: false });
    setProfiles((data as UserProfile[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const executeAction = async (profile: UserProfile, action: string) => {
    switch (action) {
      case 'activate':
        await supabase.from('profiles').update({ is_active: true }).eq('id', profile.id);
        break;
      case 'deactivate':
        await supabase.from('profiles').update({ is_active: false }).eq('id', profile.id);
        break;
      case 'promote':
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', profile.id);
        break;
      case 'demote':
        await supabase.from('profiles').update({ role: 'user' }).eq('id', profile.id);
        break;
      case 'delete':
        // Delete profile (le compte auth restera mais sera inutilisable)
        await supabase.from('profiles').delete().eq('id', profile.id);
        break;
      case 'reset_password':
        // Envoyer un email de réinitialisation de mot de passe
        const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
          redirectTo: window.location.origin,
        });
        if (error) {
          setToast({ message: `Erreur: ${error.message}`, type: 'error' });
        } else {
          setToast({ message: `Email de réinitialisation envoyé à ${profile.email}`, type: 'success' });
        }
        setTimeout(() => setToast(null), 5000);
        break;
    }
    loadProfiles();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpen) {
        setMenuOpen(null);
        setMenuPosition(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  // Open menu with position
  const openMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (menuOpen === id) {
      setMenuOpen(null);
      setMenuPosition(null);
    } else {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 160,
      });
      setMenuOpen(id);
    }
  };

  /* KPIs */
  const activeCount = profiles.filter((p) => p.is_active).length;
  const pendingCount = profiles.filter((p) => !p.is_active).length;
  const adminCount = profiles.filter((p) => p.role === 'admin').length;

  /* Filtering */
  const filtered = profiles.filter((p) => {
    if (statusFilter === 'active' && !p.is_active) return false;
    if (statusFilter === 'pending' && p.is_active) return false;
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

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'activate': return 'Activer le compte';
      case 'deactivate': return 'Désactiver le compte';
      case 'promote': return 'Passer en Admin';
      case 'demote': return 'Passer en Membre';
      case 'delete': return 'Supprimer le compte';
      case 'reset_password': return 'Réinitialiser le mot de passe';
      default: return '';
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'activate':
        return "Cet utilisateur pourra accéder à l'application.";
      case 'deactivate':
        return "Cet utilisateur ne pourra plus accéder à l'application.";
      case 'promote':
        return "Cet utilisateur aura accès à toutes les fonctions d'administration.";
      case 'demote':
        return "Cet utilisateur perdra ses droits d'administration.";
      case 'delete':
        return "Cette action est irréversible. Le profil sera supprimé et l'utilisateur ne pourra plus se connecter.";
      case 'reset_password':
        return "Un email sera envoyé à cet utilisateur avec un lien pour réinitialiser son mot de passe.";
      default:
        return '';
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="admin-section">
      {/* KPIs */}
      <div className="adm-kpis">
        <div className="adm-kpi gold">
          <strong>{profiles.length}</strong> utilisateurs
        </div>
        <div className="adm-kpi green">
          <strong>{activeCount}</strong> actifs
        </div>
        <div className="adm-kpi orange">
          <strong>{pendingCount}</strong> en attente
        </div>
        <div className="adm-kpi terra">
          <strong>{adminCount}</strong> admins
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
              ['active', 'Actifs'],
              ['pending', 'En attente'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              className={`adm-pill${statusFilter === v ? ' active' : ''}`}
              onClick={() => setStatusFilter(v as StatusFilter)}
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
            <div
              key={p.id}
              className={`adm-row ${p.role} ${!p.is_active ? 'inactive' : ''}`}
            >
              <div className={`adm-av ${p.role} ${!p.is_active ? 'inactive' : ''}`}>
                {getInitials(p)}
              </div>
              <div className="adm-row-info">
                <strong>
                  {p.display_name || p.email}
                  {!p.is_active && <span className="adm-pending-tag">En attente</span>}
                </strong>
                <span className="adm-row-sub">{p.email}</span>
              </div>
              <span className={`adm-badge ${p.role}`}>
                {p.role === 'admin' ? 'Admin' : 'Membre'}
              </span>
              <div className="adm-acts">
                {!p.is_active && (
                  <button
                    className="adm-btn-activate"
                    onClick={() => setConfirmAction({ profile: p, action: 'activate' })}
                    title="Activer ce compte"
                    type="button"
                  >
                    Activer
                  </button>
                )}
                <button
                  onClick={(e) => openMenu(e, p.id)}
                  title="Plus d'options"
                  type="button"
                >
                  &hellip;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating dropdown menu */}
      {menuOpen && menuPosition && (
        <div
          className="adm-dropdown"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const p = profiles.find((pr) => pr.id === menuOpen);
            if (!p) return null;
            return (
              <>
                {p.is_active && (
                  <button
                    onClick={() => {
                      setMenuOpen(null);
                      setMenuPosition(null);
                      setConfirmAction({ profile: p, action: 'deactivate' });
                    }}
                  >
                    ⏸ Désactiver
                  </button>
                )}
                {p.role === 'user' ? (
                  <button
                    onClick={() => {
                      setMenuOpen(null);
                      setMenuPosition(null);
                      setConfirmAction({ profile: p, action: 'promote' });
                    }}
                  >
                    ⬆ Passer en Admin
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(null);
                      setMenuPosition(null);
                      setConfirmAction({ profile: p, action: 'demote' });
                    }}
                  >
                    ⬇ Passer en Membre
                  </button>
                )}
                <button
                  onClick={() => {
                    setMenuOpen(null);
                    setMenuPosition(null);
                    setConfirmAction({ profile: p, action: 'reset_password' });
                  }}
                >
                  🔑 Réinitialiser mot de passe
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    setMenuOpen(null);
                    setMenuPosition(null);
                    setConfirmAction({ profile: p, action: 'delete' });
                  }}
                >
                  🗑 Supprimer
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* Action confirmation modal */}
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
              {getActionLabel(confirmAction.action)} pour{' '}
              <strong>
                {confirmAction.profile.display_name || confirmAction.profile.email}
              </strong>{' '}
              ?
            </p>
            <p className="adm-confirm-sub">
              {getActionDescription(confirmAction.action)}
            </p>
            <div className="adm-confirm-actions">
              <button onClick={() => setConfirmAction(null)}>Annuler</button>
              <button
                className={
                  confirmAction.action === 'deactivate' || confirmAction.action === 'delete'
                    ? 'adm-confirm-danger'
                    : confirmAction.action === 'reset_password'
                    ? 'adm-confirm-blue'
                    : 'adm-confirm-gold'
                }
                onClick={() => {
                  executeAction(confirmAction.profile, confirmAction.action);
                  setConfirmAction(null);
                }}
              >
                {confirmAction.action === 'reset_password' ? 'Envoyer l\'email' : getActionLabel(confirmAction.action)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`adm-toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '⚠'} {toast.message}
        </div>
      )}
    </div>
  );
}

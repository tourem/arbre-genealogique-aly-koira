import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMembersContext } from '../context/MembersContext';
import { genColors } from '../lib/constants';
import PersonHero from '../components/family/PersonHero';
import ParentsSection from '../components/family/ParentsSection';
import FoyersSection from '../components/family/FoyersSection';
import Breadcrumb from '../components/family/Breadcrumb';
import ExtendedFamily from '../components/family/ExtendedFamily';
import TreeView from '../components/tree/TreeView';
import TreePopup from '../components/tree/TreePopup';
import AddMemberModal from '../components/family/AddMemberModal';
import EditPanel from '../components/family/EditPanel';
import FicheFAB from '../components/family/FicheFAB';
import FicheSkeleton from '../components/layout/FicheSkeleton';
import { computeFoyers } from '../lib/foyers';
import type { Member } from '../lib/types';

// Find the best default person (lowest generation, or first member)
function getDefaultPerson(members: Record<string, Member>): string {
  const memberList = Object.values(members);
  if (memberList.length === 0) return '';

  // Prefer member named "Ali Alkamahamane" or similar
  const ali = memberList.find(m =>
    m.name.toLowerCase().includes('ali') &&
    m.name.toLowerCase().includes('alkama')
  );
  if (ali) return ali.id;

  // Otherwise, find the member with the lowest generation
  const sorted = memberList.sort((a, b) => a.generation - b.generation);
  return sorted[0]?.id || '';
}

export default function FamillePage() {
  const { members, loading, refetchMembers } = useMembersContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentPersonId, setCurrentPersonId] = useState(
    searchParams.get('person') || '',
  );
  const [history, setHistory] = useState<string[]>([]);
  const [animClass, setAnimClass] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'tree'>('card');
  const [popupMember, setPopupMember] = useState<Member | null>(null);
  const [addModal, setAddModal] = useState<{ mode: 'child' | 'spouse' | 'parent' } | null>(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle query param navigation from search page
  useEffect(() => {
    const personParam = searchParams.get('person');
    if (personParam && members[personParam] && personParam !== currentPersonId) {
      setHistory([]);
      setCurrentPersonId(personParam);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, members, currentPersonId, setSearchParams]);

  // Set default person if current is invalid or empty
  useEffect(() => {
    if (!loading && Object.keys(members).length > 0) {
      if (!currentPersonId || !members[currentPersonId]) {
        const defaultId = getDefaultPerson(members);
        if (defaultId) {
          setCurrentPersonId(defaultId);
        }
      }
    }
  }, [loading, members, currentPersonId]);

  const navigateTo = useCallback(
    (id: string) => {
      if (!members[id]) return;

      // Flash bar
      const genColor = genColors[members[id].generation] || '#6366f1';
      const flash = document.createElement('div');
      flash.className = 'click-flash';
      flash.style.background = `linear-gradient(90deg, ${genColor}, transparent)`;
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 500);

      // Animate out
      setAnimClass('changing');

      setTimeout(() => {
        if (currentPersonId !== id) {
          setHistory((prev) => [...prev, currentPersonId]);
        }
        setCurrentPersonId(id);

        // Animate in
        setAnimClass('entering');
        setTimeout(() => setAnimClass(''), 400);

        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 150);
    },
    [members, currentPersonId],
  );

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setCurrentPersonId(prev);
    }
  }, [history]);

  // Global keyboard shortcut: "E" opens the edit panel when nothing else is
  // focused inside a text field and the panel is not already open.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'e' && e.key !== 'E') return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const active = document.activeElement;
      const tag = active?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((active as HTMLElement | null)?.isContentEditable) return;
      if (editPanelOpen) return;
      if (!currentPersonId || !members[currentPersonId]) return;
      e.preventDefault();
      setEditPanelOpen(true);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [editPanelOpen, currentPersonId, members]);

  if (loading) {
    return (
      <div className="page active fiche-sh">
        <div className="scroll" tabIndex={0}>
          <FicheSkeleton />
        </div>
      </div>
    );
  }

  const person = members[currentPersonId];
  if (!person) return null;

  const spouseCount = new Set(person.spouses || []).size;
  const childrenCount = [...new Set(person.children || [])]
    .filter((c) => members[c])
    .length;

  const foyersForFab = person ? computeFoyers(person, members) : [];

  const handleAddSaved = async () => {
    setAddModal(null);
    await refetchMembers();
  };

  return (
    <div className="page active fiche-sh">
      <div className="scroll" ref={scrollRef} tabIndex={0}>
        <div className="fiche-tabs">
          <div
            className={`fiche-tab${viewMode === 'card' ? ' on' : ''}`}
            onClick={() => setViewMode('card')}
          >
            <svg className="fiche-tab-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="8" y1="13" x2="14" y2="13" />
              <line x1="8" y1="17" x2="12" y2="17" />
            </svg>
            Fiche
          </div>
          <div
            className={`fiche-tab${viewMode === 'tree' ? ' on' : ''}`}
            onClick={() => setViewMode('tree')}
          >
            <svg className="fiche-tab-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="6" r="2" />
              <circle cx="6" cy="18" r="2" />
              <circle cx="18" cy="18" r="2" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="12" x2="6" y2="16" />
              <line x1="12" y1="12" x2="18" y2="16" />
            </svg>
            Arbre
          </div>
        </div>

        {viewMode === 'tree' ? (
          <TreeView rootId={currentPersonId} members={members} />
        ) : (
          <>
            <Breadcrumb
              currentPersonId={currentPersonId}
              members={members}
              historyLength={history.length}
              onNavigate={navigateTo}
              onGoBack={goBack}
            />

            <div className={`person-view-container ${animClass}`} key={currentPersonId}>
              <PersonHero
                person={person}
                members={members}
                spouseCount={spouseCount}
                childrenCount={childrenCount}
              />

              <ParentsSection
                person={person}
                members={members}
                onNavigate={navigateTo}
                onInfo={setPopupMember}
              />

              <FoyersSection
                person={person}
                members={members}
                onNavigate={navigateTo}
                onInfo={setPopupMember}
              />

              <ExtendedFamily
                person={person}
                members={members}
                onNavigate={navigateTo}
              />
            </div>

            {popupMember && (
              <TreePopup
                member={popupMember}
                members={members}
                onClose={() => setPopupMember(null)}
              />
            )}

            {addModal && (
              <AddMemberModal
                mode={addModal.mode}
                person={person}
                members={members}
                onClose={() => setAddModal(null)}
                onSaved={handleAddSaved}
              />
            )}

            <FicheFAB
              person={person}
              foyers={foyersForFab}
              onEdit={() => setEditPanelOpen(true)}
              onAddSpouse={() => setAddModal({ mode: 'spouse' })}
              onAddChild={(_foyerSpouseId) => {
                // The existing AddMemberModal child flow handles foyer selection internally.
                // TODO: pre-fill the foyer when AddMemberModal accepts a spouseId.
                setAddModal({ mode: 'child' });
              }}
              onAddParent={() => setAddModal({ mode: 'parent' })}
              onViewTree={() => setViewMode('tree')}
              onShare={async () => {
                const url = `${window.location.origin}/?person=${person.id}`;
                try {
                  if (navigator.share) {
                    await navigator.share({ title: `${person.name} — Aly Koïra`, url });
                  } else {
                    await navigator.clipboard.writeText(url);
                    alert('Lien copié dans le presse-papier');
                  }
                } catch {
                  // User canceled share or clipboard denied — silent.
                }
              }}
              onDelete={() => setEditPanelOpen(true)}
            />
          </>
        )}

        {editPanelOpen && person && (
          <EditPanel
            person={person}
            onClose={() => setEditPanelOpen(false)}
            onSaved={async () => {
              await refetchMembers();
              setEditPanelOpen(false);
            }}
            onDeleted={() => {
              setEditPanelOpen(false);
              void refetchMembers();
              navigate('/');
            }}
          />
        )}
      </div>
    </div>
  );
}

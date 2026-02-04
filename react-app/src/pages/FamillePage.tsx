import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMembersContext } from '../context/MembersContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_PERSON, genColors } from '../lib/constants';
import PersonCard from '../components/family/PersonCard';
import ParentCard from '../components/family/ParentCard';
import SpouseCard from '../components/family/SpouseCard';
import ChildrenByMother from '../components/family/ChildrenByMother';
import Breadcrumb from '../components/family/Breadcrumb';
import ExtendedFamily from '../components/family/ExtendedFamily';
import MemberSearch from '../components/family/MemberSearch';
import TreeView from '../components/tree/TreeView';
import TreePopup from '../components/tree/TreePopup';
import AddMemberModal from '../components/family/AddMemberModal';
import FicheSkeleton from '../components/layout/FicheSkeleton';
import type { Member } from '../lib/types';

export default function FamillePage() {
  const { members, loading, refetchMembers } = useMembersContext();
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPersonId, setCurrentPersonId] = useState(
    searchParams.get('person') || DEFAULT_PERSON,
  );
  const [history, setHistory] = useState<string[]>([]);
  const [animClass, setAnimClass] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'tree'>('card');
  const [popupMember, setPopupMember] = useState<Member | null>(null);
  const [addModal, setAddModal] = useState<{ mode: 'child' | 'spouse' | 'parent' } | null>(null);
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

  if (loading) {
    return (
      <div className="page active fiche-sh">
        <div className="scroll">
          <FicheSkeleton />
        </div>
      </div>
    );
  }

  const person = members[currentPersonId];
  if (!person) return null;

  const kids = [...new Set(person.children || [])]
    .filter((c) => members[c])
    .map((c) => members[c]);

  const spouseCount = new Set(person.spouses || []).size;
  const childrenCount = kids.length;

  const handleAddSaved = async () => {
    setAddModal(null);
    await refetchMembers();
  };

  return (
    <div className="page active fiche-sh">
      <div className="scroll" ref={scrollRef}>
        <MemberSearch
          members={members}
          currentPersonId={currentPersonId}
          onSelect={navigateTo}
        />

        <div className="fiche-tabs">
          <div
            className={`fiche-tab${viewMode === 'card' ? ' on' : ''}`}
            onClick={() => setViewMode('card')}
          >
            <span className="fiche-tab-ico">{'\uD83D\uDCCB'}</span> Fiche
          </div>
          <div
            className={`fiche-tab${viewMode === 'tree' ? ' on' : ''}`}
            onClick={() => setViewMode('tree')}
          >
            <span className="fiche-tab-ico">{'\uD83C\uDF33'}</span> Arbre
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
              <PersonCard
                person={person}
                spouseCount={spouseCount}
                childrenCount={childrenCount}
              />

              <ParentCard
                person={person}
                members={members}
                onNavigate={navigateTo}
                onInfo={setPopupMember}
                onAddParent={isAdmin ? () => setAddModal({ mode: 'parent' }) : undefined}
              />

              <SpouseCard
                person={person}
                members={members}
                onNavigate={navigateTo}
                onInfo={setPopupMember}
                onAddSpouse={isAdmin ? () => setAddModal({ mode: 'spouse' }) : undefined}
              />

              {kids.length > 0 ? (
                <ChildrenByMother
                  person={person}
                  kids={kids}
                  members={members}
                  onNavigate={navigateTo}
                  onInfo={setPopupMember}
                  onAddChild={isAdmin ? () => setAddModal({ mode: 'child' }) : undefined}
                />
              ) : (
                <div className="fiche-section">
                  <div className="fiche-conn c-green"></div>
                  <div className="fiche-sh-header children">
                    <div className="fiche-sh-txt">
                      <span className="fiche-sh-ico">{'\u25BC'}</span> Enfants
                    </div>
                  </div>
                  {isAdmin ? (
                    <button
                      className="fiche-add-btn"
                      onClick={() => setAddModal({ mode: 'child' })}
                      type="button"
                    >
                      <span className="fiche-add-ico">+</span>
                      Ajouter un enfant
                    </button>
                  ) : (
                    <div className="no-data">Pas d&apos;enfants enregistr&eacute;s</div>
                  )}
                </div>
              )}

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
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMembersContext } from '../context/MembersContext';
import { roots, DEFAULT_PERSON, genColors } from '../lib/constants';
import PersonCard from '../components/family/PersonCard';
import ParentCard from '../components/family/ParentCard';
import SpouseCard from '../components/family/SpouseCard';
import ChildrenByMother from '../components/family/ChildrenByMother';
import Breadcrumb from '../components/family/Breadcrumb';
import GenerationLegend from '../components/family/GenerationLegend';
import ExtendedFamily from '../components/family/ExtendedFamily';

export default function FamillePage() {
  const { members, loading } = useMembersContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPersonId, setCurrentPersonId] = useState(
    searchParams.get('person') || DEFAULT_PERSON,
  );
  const [history, setHistory] = useState<string[]>([]);
  const [animClass, setAnimClass] = useState('');
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

  const changeRoot = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      if (id && members[id]) {
        setHistory([]);
        navigateTo(id);
      }
    },
    [members, navigateTo],
  );

  if (loading) {
    return (
      <div className="page active">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div>Chargement des donn&eacute;es...</div>
        </div>
      </div>
    );
  }

  const person = members[currentPersonId];
  if (!person) return null;

  const kids = (person.children || [])
    .filter((c) => members[c])
    .map((c) => members[c]);

  return (
    <div className="page active">
      <div className="scroll" ref={scrollRef}>
        <select
          className="root-select"
          value={currentPersonId}
          onChange={changeRoot}
        >
          <option value="">
            {'\u{1F4CD}'} Choisir un point de d&eacute;part...
          </option>
          {roots.map((id) =>
            members[id] ? (
              <option key={id} value={id}>
                {members[id].name}
                {members[id].alias ? ` (${members[id].alias})` : ''}
              </option>
            ) : null,
          )}
        </select>

        <Breadcrumb
          currentPersonId={currentPersonId}
          members={members}
          historyLength={history.length}
          onNavigate={navigateTo}
          onGoBack={goBack}
        />

        <div className={`person-view-container ${animClass}`} key={currentPersonId}>
          <PersonCard person={person} />

          <ParentCard
            person={person}
            members={members}
            onNavigate={navigateTo}
          />

          <SpouseCard
            person={person}
            members={members}
            onNavigate={navigateTo}
          />

          {kids.length > 0 ? (
            <ChildrenByMother
              person={person}
              kids={kids}
              members={members}
              onNavigate={navigateTo}
            />
          ) : person.children && person.children.length === 0 ? (
            <>
              <div className="section-title">Enfants</div>
              <div className="no-data">Pas d&apos;enfants enregistr&eacute;s</div>
            </>
          ) : null}

          <ExtendedFamily
            person={person}
            members={members}
            onNavigate={navigateTo}
          />

          <GenerationLegend />
        </div>
      </div>
    </div>
  );
}

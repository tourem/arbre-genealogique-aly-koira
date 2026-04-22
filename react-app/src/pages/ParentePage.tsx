import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMembersContext } from '../context/MembersContext';
import { computeRelations } from '../lib/parenteSonghay';
import { useParenteLabels } from '../hooks/useParenteLabels';
import { useParenteHistory } from '../hooks/useParenteHistory';
import PersonPicker from '../components/relationship/PersonPicker';
import RelationCard from '../components/relationship/RelationCard';
import RelationHistoryChips from '../components/relationship/RelationHistoryChips';
import { groupRelations } from '../components/relationship/groupRelations';
import { suggestPairs } from '../components/relationship/suggestPairs';

const DEFAULT_VISIBLE = 3;

export default function ParentePage() {
  const { members, loading } = useMembersContext();
  const { labels, loading: labelsLoading } = useParenteLabels();
  const { history, add: addHistory, remove: removeHistory, clear: clearHistory } = useParenteHistory();
  const [searchParams, setSearchParams] = useSearchParams();
  const [personAId, setPersonAIdState] = useState<string | null>(searchParams.get('a'));
  const [personBId, setPersonBIdState] = useState<string | null>(searchParams.get('b'));
  const [expanded, setExpanded] = useState(false);

  // Wrap the setters to ALSO update the URL.
  const setPersonAId = (id: string | null) => {
    setPersonAIdState(id);
    const next = new URLSearchParams(searchParams);
    if (id) next.set('a', id); else next.delete('a');
    setSearchParams(next, { replace: true });
  };
  const setPersonBId = (id: string | null) => {
    setPersonBIdState(id);
    const next = new URLSearchParams(searchParams);
    if (id) next.set('b', id); else next.delete('b');
    setSearchParams(next, { replace: true });
  };

  // If the URL referenced a now-unknown member, clear local state silently
  // (no URL update — we just drop the invalid IDs from local selection).
  useEffect(() => {
    if (personAId && !members[personAId]) setPersonAIdState(null);
    if (personBId && !members[personBId]) setPersonBIdState(null);
  }, [members, personAId, personBId]);

  const result = useMemo(() => {
    if (!personAId || !personBId) return null;
    if (personAId === personBId) return { kind: 'same-person' as const };
    return computeRelations(personAId, personBId, members, labels);
  }, [personAId, personBId, members, labels]);

  const relations = result?.kind === 'relations' ? result.relations : [];
  const groups = useMemo(() => groupRelations(relations), [relations]);
  const suggestions = useMemo(() => suggestPairs(members, 3), [members]);

  const personA = personAId ? members[personAId] : null;
  const personB = personBId ? members[personBId] : null;
  const getMember = (id: string) => members[id];

  useEffect(() => {
    if (!personAId || !personBId) return;
    if (!personA || !personB) return;
    if (!result || result.kind !== 'relations') return;
    const topTerm =
      result.relations[0]?.groupTerm ??
      `${result.relations[0]?.termForA} / ${result.relations[0]?.termForB}`;
    addHistory({
      aId: personAId,
      aName: personA.name,
      bId: personBId,
      bName: personB.name,
      topTerm,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personAId, personBId, result?.kind === 'relations' ? result.relations[0]?.via : null]);

  if (loading || labelsLoading) {
    return (
      <div className="page active parente-page">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div>Chargement...</div>
        </div>
      </div>
    );
  }

  const visibleGroups = expanded ? groups : groups.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = Math.max(0, groups.length - DEFAULT_VISIBLE);

  return (
    <div className="page active parente-page">
      <div className="parente-layout">
        <header className="parente-sticky-head">
          <div className="parente-hdr">
            <div className="parente-hdr-i" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="3" />
                <circle cx="17" cy="7" r="3" />
                <path d="M7 10v4" />
                <path d="M17 10v4" />
                <path d="M7 14h10" />
                <path d="M12 14v5" />
                <circle cx="12" cy="20" r="1.5" />
              </svg>
            </div>
            <div>
              <h1>Parenté</h1>
              <small>Liens familiaux <em>·</em> Terminologie songhay</small>
            </div>
          </div>
          <div className="parente-sel">
            <PersonPicker
              label="Personne A"
              value={personAId}
              members={members}
              onChange={setPersonAId}
              side="a"
            />
            <PersonPicker
              label="Personne B"
              value={personBId}
              members={members}
              onChange={setPersonBId}
              side="b"
            />
          </div>
        </header>

        <section className="parente-results">
          {!personAId || !personBId ? (
            <div className="parente-empty-state">
              <div className="parente-empty-state-icon" aria-hidden>
                <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="8" r="3" />
                  <circle cx="22" cy="8" r="3" />
                  <circle cx="16" cy="24" r="3" />
                  <path d="M10 11v4" />
                  <path d="M22 11v4" />
                  <path d="M10 15h12" />
                  <path d="M16 15v6" />
                </svg>
              </div>
              <p className="parente-empty-state-text">Sélectionnez deux personnes pour calculer leurs liens de parenté.</p>
              {history.length > 0 && (
                <RelationHistoryChips
                  history={history}
                  onSelect={(entry) => {
                    setPersonAId(entry.aId);
                    setPersonBId(entry.bId);
                  }}
                  onRemove={removeHistory}
                  onClear={clearHistory}
                />
              )}
              {suggestions.length > 0 && (
                <>
                  <p className="parente-empty-hint">Ou essayez une de ces paires :</p>
                  <div className="parente-suggestions">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="parente-suggestion-chip"
                        onClick={() => { setPersonAId(s.aId); setPersonBId(s.bId); }}
                      >
                        <span>{s.aName}</span>
                        <span className="chip-sep">↔</span>
                        <span>{s.bName}</span>
                        {s.hint && <small className="chip-hint">{s.hint}</small>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : result?.kind === 'same-person' ? (
            <div className="parente-notice">C'est la même personne.</div>
          ) : result?.kind === 'no-link' ? (
            <div className="parente-notice parente-notice-empty">
              <h2>Aucun lien de parenté trouvé</h2>
              <p>Aucun lien de parenté trouvé entre <strong>{personA?.name}</strong> et <strong>{personB?.name}</strong> dans la base. Ils n'ont aucun ancêtre commun connu.</p>
              <p className="subtle">Cela peut être dû à des branches familiales déconnectées ou à des données manquantes.</p>
            </div>
          ) : result?.kind === 'incomplete' ? (
            <div className="parente-notice parente-notice-warn">
              <h2>Calcul incomplet</h2>
              <p>La généalogie n'est pas suffisamment renseignée pour déterminer ce lien.</p>
              <ul>
                {result.missingParents.map((m, i) => {
                  const person = getMember(m.personId);
                  return (
                    <li key={i}>
                      Compléter le <strong>{m.missing === 'father' ? 'père' : 'mère'}</strong> de{' '}
                      <strong>{person?.name ?? m.personId}</strong> pourrait permettre le calcul.
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : result?.kind === 'relations' && personA && personB ? (
            <>
              <div className="parente-summary">
                <span className="parente-summary-num">{groups.length}</span>
                <span>
                  {groups.length === 1 ? 'lien trouvé' : 'liens trouvés'} · plus proche :{' '}
                  <em lang="son">{groups[0].termForA}</em>
                  <span className="sep">/</span>
                  <em lang="son">{groups[0].termForB}</em>
                </span>
              </div>

              {visibleGroups.map((g, i) => (
                <RelationCard
                  key={`${g.termForA}-${g.termForB}-${i}`}
                  index={i}
                  group={g}
                  personA={personA}
                  personB={personB}
                  getMember={getMember}
                  defaultExpanded={i === 0}
                />
              ))}

              {hiddenCount > 0 && !expanded && (
                <button type="button" className="parente-show-more" onClick={() => setExpanded(true)}>
                  + Voir les {hiddenCount} autre{hiddenCount > 1 ? 's' : ''} relation{hiddenCount > 1 ? 's' : ''}
                </button>
              )}
              {expanded && hiddenCount > 0 && (
                <button type="button" className="parente-show-more" onClick={() => setExpanded(false)}>
                  − Masquer les relations additionnelles
                </button>
              )}
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}

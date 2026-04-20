import { useMemo, useState } from 'react';
import { useMembersContext } from '../context/MembersContext';
import { computeRelations } from '../lib/parenteSonghay';
import { useParenteLabels } from '../hooks/useParenteLabels';
import PersonPicker from '../components/relationship/PersonPicker';
import RelationCard from '../components/relationship/RelationCard';

const DEFAULT_VISIBLE = 3;

export default function ParentePage() {
  const { members, loading } = useMembersContext();
  const { labels, loading: labelsLoading } = useParenteLabels();
  const [personAId, setPersonAId] = useState<string | null>(null);
  const [personBId, setPersonBId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const result = useMemo(() => {
    if (!personAId || !personBId) return null;
    if (personAId === personBId) return { kind: 'same-person' as const };
    return computeRelations(personAId, personBId, members, labels);
  }, [personAId, personBId, members, labels]);

  const personA = personAId ? members[personAId] : null;
  const personB = personBId ? members[personBId] : null;
  const getMember = (id: string) => members[id];

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

  const relations = result?.kind === 'relations' ? result.relations : [];
  const visibleRelations = expanded ? relations : relations.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = Math.max(0, relations.length - DEFAULT_VISIBLE);

  return (
    <div className="page active parente-page">
      <div className="parente-layout">
        <header className="parente-sticky-head">
          <div className="parente-hdr">
            <div className="parente-hdr-i">{'\u{1F333}'}</div>
            <div>
              <h1>Parenté</h1>
              <small>Liens familiaux · Terminologie Songhay</small>
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
              <div className="parente-empty-state-icon">{'\u{1F446}'}</div>
              <p>Sélectionnez deux personnes pour calculer leurs liens de parenté.</p>
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
                <span className="parente-summary-num">{relations.length}</span>
                <span>
                  {relations.length === 1 ? 'lien trouvé' : 'liens trouvés'} · plus proche :{' '}
                  <em lang="son">{relations[0].termForA}</em>
                  <span className="sep">/</span>
                  <em lang="son">{relations[0].termForB}</em>
                </span>
              </div>

              {visibleRelations.map((r, i) => (
                <RelationCard
                  key={`${r.via}-${i}`}
                  index={i}
                  relation={r}
                  personA={personA}
                  personB={personB}
                  getMember={getMember}
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

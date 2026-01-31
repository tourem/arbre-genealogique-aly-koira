import { useState, useMemo } from 'react';
import { useMembersContext } from '../context/MembersContext';
import { findAncestor, getRelationType } from '../lib/relationship';
import PersonSelect from '../components/relationship/PersonSelect';
import RelationshipResultComponent from '../components/relationship/RelationshipResult';
import type { RelationResult } from '../lib/types';

export default function ParentePage() {
  const { members, loading } = useMembersContext();
  const [person1, setPerson1] = useState('');
  const [person2, setPerson2] = useState('');
  const [result, setResult] = useState<{
    relation: RelationResult;
    type: string;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const sortedMembers = useMemo(
    () =>
      Object.values(members).sort((a, b) =>
        a.name.localeCompare(b.name, 'fr'),
      ),
    [members],
  );

  const handleFind = () => {
    setResult(null);
    setNotFound(false);

    if (!person1 || !person2) return;

    if (person1 === person2) {
      setResult(null);
      return;
    }

    const r = findAncestor(person1, person2, members);
    if (!r) {
      setNotFound(true);
      return;
    }

    const rel = getRelationType(r.d1, r.d2, members[person1], members[person2]);
    setResult({ relation: r, type: rel });
  };

  if (loading) {
    return (
      <div className="page active">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div>Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page active">
      <div className="scroll">
        <h2 className="page-title">
          {'\u{1F517}'} Trouver un lien de parent&eacute;
        </h2>
        <p className="page-subtitle">
          S&eacute;lectionnez deux personnes pour d&eacute;couvrir leur lien familial
        </p>

        <div className="parente-form">
          <PersonSelect
            label="Premi&egrave;re personne"
            value={person1}
            members={sortedMembers}
            onChange={setPerson1}
          />

          <div className="parente-vs">{'\u2194\uFE0F'}</div>

          <PersonSelect
            label="Deuxi&egrave;me personne"
            value={person2}
            members={sortedMembers}
            onChange={setPerson2}
          />

          <button className="parente-btn" onClick={handleFind}>
            Trouver le lien
          </button>
        </div>

        {!person1 || !person2 ? (
          <div className="empty">
            <div className="empty-icon">{'\u{1F446}'}</div>
            <div className="empty-text">S&eacute;lectionnez deux personnes</div>
          </div>
        ) : person1 === person2 ? (
          <div className="relation-result">
            <div className="relation-badge">M&ecirc;me personne!</div>
          </div>
        ) : notFound ? (
          <div className="empty">
            <div className="empty-icon">{'\u2753'}</div>
            <div className="empty-text">Lien non trouv&eacute;</div>
          </div>
        ) : result ? (
          <RelationshipResultComponent
            result={result.relation}
            relationType={result.type}
          />
        ) : null}
      </div>
    </div>
  );
}

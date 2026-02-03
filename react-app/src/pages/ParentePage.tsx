import { useState, useMemo } from 'react';
import { useMembersContext } from '../context/MembersContext';
import { useRelationTerms } from '../hooks/useRelationTerms';
import { findSonghoyRelations } from '../lib/songhoyRelationship';
import MemberAutocomplete from '../components/relationship/MemberAutocomplete';
import RelationshipResult from '../components/relationship/RelationshipResult';

export default function ParentePage() {
  const { members, loading: membersLoading } = useMembersContext();
  const { terms, categories, loading: termsLoading } = useRelationTerms();
  const [person1, setPerson1] = useState('');
  const [person2, setPerson2] = useState('');

  const loading = membersLoading || termsLoading;

  const results = useMemo(() => {
    if (!person1 || !person2 || person1 === person2) return null;
    return findSonghoyRelations(person1, person2, members, terms, categories);
  }, [person1, person2, members, terms, categories]);

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
        <h2 className="page-title">Trouver un lien de parente</h2>
        <p className="page-subtitle">
          Selectionnez deux personnes pour decouvrir leur lien familial avec les
          termes Songhoy
        </p>

        <div className="parente-form">
          <MemberAutocomplete
            label="Premiere personne"
            value={person1}
            members={members}
            onChange={setPerson1}
          />

          <div className="parente-vs">{'\u2194\uFE0F'}</div>

          <MemberAutocomplete
            label="Deuxieme personne"
            value={person2}
            members={members}
            onChange={setPerson2}
          />
        </div>

        {!person1 || !person2 ? (
          <div className="empty">
            <div className="empty-icon">{'\u{1F446}'}</div>
            <div className="empty-text">Selectionnez deux personnes</div>
          </div>
        ) : person1 === person2 ? (
          <div className="relation-result">
            <div className="relation-badge">Meme personne !</div>
          </div>
        ) : results !== null ? (
          <RelationshipResult
            results={results}
            personAName={members[person1]?.name || ''}
            personBName={members[person2]?.name || ''}
          />
        ) : null}
      </div>
    </div>
  );
}

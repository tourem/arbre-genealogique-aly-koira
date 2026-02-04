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

  const handleSwap = () => {
    const tmp = person1;
    setPerson1(person2);
    setPerson2(tmp);
  };

  if (loading) {
    return (
      <div className="page active parente-page">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div>Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page active parente-page">
      <div className="scroll" tabIndex={0}>
        <div className="parente-hdr">
          <div className="parente-hdr-i">{'\uD83C\uDF33'}</div>
          <div>
            <h1>Parente</h1>
            <small>Relations familiales &middot; Terminologie Songhoy</small>
          </div>
        </div>

        <div className="parente-sel">
          <MemberAutocomplete
            label="Premiere personne"
            value={person1}
            members={members}
            onChange={setPerson1}
            side="a"
          />
          <button
            className="parente-sw"
            onClick={handleSwap}
            title="Inverser"
          >
            {'\u21C4'}
          </button>
          <MemberAutocomplete
            label="Deuxieme personne"
            value={person2}
            members={members}
            onChange={setPerson2}
            side="b"
          />
        </div>

        {!person1 || !person2 ? (
          <div className="empty">
            <div className="empty-icon">{'\u{1F446}'}</div>
            <div className="empty-text">Selectionnez deux personnes</div>
          </div>
        ) : person1 === person2 ? (
          <div className="parente-flash">
            <div className="parente-flash-n">!</div>
            <div className="parente-flash-t">
              Meme personne selectionnee
            </div>
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

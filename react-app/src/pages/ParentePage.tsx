// react-app/src/pages/ParentePage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useMembersContext } from '../context/MembersContext';
import { computeRelations } from '../lib/parenteSonghay';
import { useParenteLabels } from '../hooks/useParenteLabels';
import PersonPicker from '../components/relationship/PersonPicker';
import ParenteResultModal from '../components/relationship/ParenteResultModal';

export default function ParentePage() {
  const { members, loading } = useMembersContext();
  const { labels, loading: labelsLoading } = useParenteLabels();

  const [personAId, setPersonAId] = useState<string | null>(null);
  const [personBId, setPersonBId] = useState<string | null>(null);
  const [modalDismissed, setModalDismissed] = useState(false);

  const result = useMemo(() => {
    if (!personAId || !personBId) return null;
    if (personAId === personBId) return { kind: 'same-person' as const };
    return computeRelations(personAId, personBId, members, labels);
  }, [personAId, personBId, members, labels]);

  useEffect(() => { setModalDismissed(false); }, [personAId, personBId]);

  const personA = personAId ? members[personAId] : null;
  const personB = personBId ? members[personBId] : null;
  const showModal = result !== null && result.kind !== 'same-person' && !modalDismissed && !!personA && !!personB;
  const showReopenBtn = result !== null && result.kind !== 'same-person' && modalDismissed;

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

  return (
    <div className="page active parente-page">
      <div className="scroll" tabIndex={0}>
        <div className="parente-hdr">
          <div className="parente-hdr-i">{'\uD83C\uDF33'}</div>
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

        {!personAId || !personBId ? (
          <div className="empty">
            <div className="empty-icon">{'\u{1F446}'}</div>
            <div className="empty-text">Sélectionnez deux personnes pour calculer leurs liens de parenté.</div>
          </div>
        ) : personAId === personBId ? (
          <div className="parente-flash">
            <div className="parente-flash-n">!</div>
            <div className="parente-flash-t">C'est la même personne.</div>
          </div>
        ) : showReopenBtn ? (
          <div className="parente-reopen">
            <button className="parente-reopen-btn" onClick={() => setModalDismissed(false)}>
              Voir les liens
            </button>
          </div>
        ) : null}

        {showModal && personA && personB && result && (
          <ParenteResultModal
            result={result}
            personA={personA}
            personB={personB}
            getMember={(id) => members[id]}
            onClose={() => setModalDismissed(true)}
          />
        )}
      </div>
    </div>
  );
}

// react-app/src/components/relationship/ParenteResultModal.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RelationResult } from '../../lib/parenteSonghay';
import type { Member } from '../../lib/types';
import RelationSelector from './RelationSelector';
import SubTreeSvg from './SubTreeSvg';
import DetailedView from './DetailedView';

interface Props {
  result: RelationResult;
  personA: Member;
  personB: Member;
  getMember: (id: string) => Member | undefined;
  onClose: () => void;
}

type Tab = 'graphic' | 'detailed';

export default function ParenteResultModal({ result, personA, personB, getMember, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState<Tab>('graphic');

  useEffect(() => { setActiveIndex(0); setTab('graphic'); }, [result]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (result.kind === 'relations') {
        if (e.key === 'ArrowLeft') setActiveIndex((i) => Math.max(0, i - 1));
        if (e.key === 'ArrowRight') setActiveIndex((i) => Math.min(result.relations.length - 1, i + 1));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [result, onClose]);

  const content = (
    <>
      <div className="parente-modal-backdrop" onClick={onClose} />
      <div className="parente-modal" role="dialog" aria-modal="true" aria-labelledby="parente-modal-title">
        <div className="parente-modal-handle" aria-hidden="true" />
        <div className="parente-modal-header">
          <div>
            <h2 id="parente-modal-title">Liens de parenté</h2>
            <p className="parente-modal-subtitle">{personA.name} ↔ {personB.name}</p>
          </div>
          <button className="parente-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <div className="parente-modal-body">
          {result.kind === 'same-person' && (
            <div className="parente-empty">
              <div className="parente-empty-title">Même personne</div>
              <p>Vous avez sélectionné deux fois la même personne.</p>
            </div>
          )}

          {result.kind === 'no-link' && (
            <div className="parente-empty">
              <div className="parente-empty-title">Aucun lien de parenté trouvé</div>
              <p>Aucun lien de parenté trouvé entre <strong>{personA.name}</strong> et <strong>{personB.name}</strong> dans la base. Ils n'ont aucun ancêtre commun connu.</p>
              <p className="parente-empty-hint">Cela peut être dû à des branches familiales déconnectées ou à des données manquantes.</p>
            </div>
          )}

          {result.kind === 'incomplete' && (
            <div className="parente-empty warn">
              <div className="parente-empty-title">Calcul incomplet</div>
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
          )}

          {result.kind === 'relations' && (
            <>
              <RelationSelector
                relations={result.relations}
                activeIndex={activeIndex}
                onChange={setActiveIndex}
              />

              <div className="parente-modal-tabs" role="tablist">
                <button
                  role="tab"
                  aria-selected={tab === 'graphic'}
                  className={`parente-modal-tab${tab === 'graphic' ? ' active' : ''}`}
                  onClick={() => setTab('graphic')}
                >Vue graphique</button>
                <button
                  role="tab"
                  aria-selected={tab === 'detailed'}
                  className={`parente-modal-tab${tab === 'detailed' ? ' active' : ''}`}
                  onClick={() => setTab('detailed')}
                >Vue détaillée</button>
              </div>

              {tab === 'graphic' && result.relations[activeIndex] && (
                (() => {
                  const active = result.relations[activeIndex];
                  const ancestor = getMember(active.via);
                  if (!ancestor) return <div className="parente-empty">Ancêtre {active.via} introuvable</div>;
                  return (
                    <SubTreeSvg
                      relation={active}
                      personA={personA}
                      personB={personB}
                      ancestor={ancestor}
                      getMember={getMember}
                    />
                  );
                })()
              )}

              {tab === 'detailed' && (
                <DetailedView
                  relations={result.relations}
                  personA={personA}
                  personB={personB}
                  activeIndex={activeIndex}
                  getMember={getMember}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}

import type { Member } from '../../lib/types';
import type { RelationGroup } from './groupRelations';
import { anthroLabel, glossForTerm } from '../../lib/parenteSonghay';
import { useParenteLabels } from '../../hooks/useParenteLabels';
import { articleDevant } from '../../lib/lineage';
import SonghayTerm from '../ui/SonghayTerm';

interface Props {
  group: RelationGroup;
  personA: Member;
  personB: Member;
  onClickA?: () => void;
  onClickB?: () => void;
}

/**
 * Encart editorial affichant en Fraunces la reponse a la question
 * "quel est le lien entre A et B ?" en moins de 2 secondes de lecture.
 *
 * Forme cible (cas avunculat) :
 *   "Mahamadou Alhabibou est touba (neveu via oncle maternel) d'Ibrahim Alassane.
 *    — Neveu par voie maternelle — avunculat songhay, deux lignees distinctes"
 *
 * Pour les relations symetriques avec groupTerm (arrou hinka izey,
 * hassey-zee n'da hawey-zee, woy hinka izey...) on affiche le groupTerm
 * comme terme principal.
 */
export default function AnswerBlock({ group, personA, personB, onClickA, onClickB }: Props) {
  const { labels } = useParenteLabels();
  const label = anthroLabel(group, personA.gender);

  // Pour les groupes symetriques (groupTerm), on affiche : "A et B sont <groupTerm> (trad)."
  if (group.groupTerm) {
    const groupGloss = glossForTerm(group.groupTerm, labels);
    return (
      <section className="parente-answer" aria-label="Lien de parenté">
        <p className="parente-answer-line">
          <NameLink name={personA.name} onClick={onClickA} />
          {' '}et{' '}
          <NameLink name={personB.name} onClick={onClickB} />
          {' '}sont{' '}
          <SonghayTerm term={group.groupTerm} variant="inline" />
          {groupGloss && <span className="parente-answer-translation"> ({groupGloss})</span>}
          .
        </p>
        <p className="parente-answer-label">{label}</p>
      </section>
    );
  }

  // Cas asymetrique : on ecrit du point de vue de A.
  const termA = group.termForA;
  const glossA = glossForTerm(termA, labels);
  const prepB = articleDevant(personB.name);

  return (
    <section className="parente-answer" aria-label="Lien de parenté">
      <p className="parente-answer-line">
        <NameLink name={personA.name} onClick={onClickA} />
        {' '}est{' '}
        <SonghayTerm term={termA} variant="inline" />
        {glossA && <span className="parente-answer-translation"> ({glossA})</span>}
        {' '}
        <span className="parente-answer-prep">{prepB}</span>
        <NameLink name={personB.name} onClick={onClickB} />
        .
      </p>
      <p className="parente-answer-label">{label}</p>
    </section>
  );
}

function NameLink({ name, onClick }: { name: string; onClick?: () => void }) {
  if (onClick) {
    return (
      <button type="button" className="parente-answer-name" onClick={onClick}>
        {name}
      </button>
    );
  }
  return <strong className="parente-answer-name">{name}</strong>;
}

import type { Member } from '../../lib/types';
import type { RelationGroup } from './groupRelations';
import { glossForTerm } from '../../lib/parenteSonghay';
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
 * Une seule ligne compacte sous l'AnswerBlock :
 *   "↪ Inversement, [B] est [termB] ([trad]) de [A]."
 *
 * Pour les relations symetriques avec groupTerm, on omet cette ligne
 * (la reciprocite est implicite : A et B portent le meme lien).
 */
export default function ReciprocityLine({ group, personA, personB, onClickA, onClickB }: Props) {
  const { labels } = useParenteLabels();

  if (group.groupTerm) return null;

  const termB = group.termForB;
  const glossB = glossForTerm(termB, labels);
  const prepA = articleDevant(personA.name);

  return (
    <p className="parente-reciprocity" role="note">
      <span className="parente-reciprocity-arrow" aria-hidden="true">↪</span>
      {' '}Inversement,{' '}
      <NameLink name={personB.name} onClick={onClickB} />
      {' '}est{' '}
      <SonghayTerm term={termB} variant="inline" />
      {glossB && <span className="parente-reciprocity-translation"> ({glossB})</span>}
      {' '}
      <span className="parente-reciprocity-prep">{prepA}</span>
      <NameLink name={personA.name} onClick={onClickA} />
      .
    </p>
  );
}

function NameLink({ name, onClick }: { name: string; onClick?: () => void }) {
  if (onClick) {
    return (
      <button type="button" className="parente-reciprocity-name" onClick={onClick}>
        {name}
      </button>
    );
  }
  return <strong className="parente-reciprocity-name">{name}</strong>;
}

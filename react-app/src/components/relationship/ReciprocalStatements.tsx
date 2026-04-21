// react-app/src/components/relationship/ReciprocalStatements.tsx
import type { Relation } from '../../lib/parenteSonghay';
import { glossForTerm } from '../../lib/parenteSonghay';
import { useParenteLabels } from '../../hooks/useParenteLabels';

interface Props {
  relation: Relation;
  nameA: string;
  nameB: string;
  onClickA?: () => void;
  onClickB?: () => void;
}

export default function ReciprocalStatements({ relation, nameA, nameB, onClickA, onClickB }: Props) {
  const { labels } = useParenteLabels();
  const glossA = glossForTerm(relation.termForA, labels);
  const glossB = glossForTerm(relation.termForB, labels);

  const renderName = (name: string, onClick?: () => void) =>
    onClick ? (
      <button type="button" className="parente-name-link" onClick={onClick}>{name}</button>
    ) : (
      <strong>{name}</strong>
    );

  return (
    <div className="parente-reciprocal">
      <div className="parente-reciprocal-row">
        {renderName(nameA, onClickA)}
        <span className="verb">est</span>
        <span className="term-block">
          <em lang="son" className="term">{relation.termForA}</em>
          {glossA && <small className="term-gloss">— {glossA}</small>}
        </span>
        <span className="verb">pour</span>
        {renderName(nameB, onClickB)}
      </div>
      <div className="parente-reciprocal-row">
        {renderName(nameB, onClickB)}
        <span className="verb">est</span>
        <span className="term-block">
          <em lang="son" className="term">{relation.termForB}</em>
          {glossB && <small className="term-gloss">— {glossB}</small>}
        </span>
        <span className="verb">pour</span>
        {renderName(nameA, onClickA)}
      </div>
    </div>
  );
}

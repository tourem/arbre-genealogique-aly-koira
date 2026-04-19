// react-app/src/components/relationship/ReciprocalStatements.tsx
import type { Relation } from '../../lib/parenteSonghay';

interface Props {
  relation: Relation;
  nameA: string;
  nameB: string;
}

export default function ReciprocalStatements({ relation, nameA, nameB }: Props) {
  return (
    <div className="parente-reciprocal">
      <div className="parente-reciprocal-row">
        <strong>{nameA}</strong>
        <span className="verb">est</span>
        <em lang="son" className="term">{relation.termForA}</em>
        <span className="verb">pour</span>
        <strong>{nameB}</strong>
      </div>
      <div className="parente-reciprocal-row">
        <strong>{nameB}</strong>
        <span className="verb">est</span>
        <em lang="son" className="term">{relation.termForB}</em>
        <span className="verb">pour</span>
        <strong>{nameA}</strong>
      </div>
    </div>
  );
}

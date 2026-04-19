// react-app/src/components/relationship/PedagogicalExplanation.tsx
import { explainRelation, type Relation } from '../../lib/parenteSonghay';
import { useParenteLabels } from '../../hooks/useParenteLabels';

interface Props {
  relation: Relation;
  nameA: string;
  nameB: string;
}

export default function PedagogicalExplanation({ relation, nameA, nameB }: Props) {
  const { labels } = useParenteLabels();
  const text = explainRelation(relation, nameA, nameB, labels);
  return (
    <div className="parente-explain">
      <p>{text}</p>
    </div>
  );
}

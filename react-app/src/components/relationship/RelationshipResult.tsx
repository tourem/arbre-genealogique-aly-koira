import type { RelationResult } from '../../lib/types';

interface Props {
  result: RelationResult;
  relationType: string;
}

export default function RelationshipResult({ result, relationType }: Props) {
  const p1 = result.path1[0];
  const p2 = result.path2[0];

  return (
    <div className="relation-result">
      <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
        {p1.name}
        <br />
        &amp;
        <br />
        {p2.name}
      </div>
      <div className="relation-badge">{relationType}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
        Anc&ecirc;tre commun : {result.anc.name}
      </div>
      <div className="relation-detail">
        {result.path1.slice(0, -1).map((step, i) => (
          <div className="relation-step" key={`p1-${step.id}`}>
            <div className="dot" />
            {step.name} est {step.gender === 'M' ? 'fils' : 'fille'} de{' '}
            {result.path1[i + 1].name}
          </div>
        ))}
        {result.path2.slice(0, -1).map((step, i) => (
          <div className="relation-step" key={`p2-${step.id}`}>
            <div className="dot" />
            {step.name} est {step.gender === 'M' ? 'fils' : 'fille'} de{' '}
            {result.path2[i + 1].name}
          </div>
        ))}
      </div>
    </div>
  );
}

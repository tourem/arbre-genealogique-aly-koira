// react-app/src/components/relationship/TechnicalDetails.tsx
import type { Relation, Hop } from '../../lib/parenteSonghay';
import type { Member } from '../../lib/types';

interface Props {
  relation: Relation;
  personA: Member;
  personB: Member;
  getMember: (id: string) => Member | undefined;
}

function describeChain(start: Member, hops: Hop[], getMember: (id: string) => Member | undefined): string {
  const segments: string[] = [start.name];
  let cursor: Member | undefined = start;
  for (const hop of hops) {
    if (!cursor) break;
    const parentId: string | null = hop === 'P' ? cursor.father_id : cursor.mother_ref;
    const parent: Member | undefined = parentId ? getMember(parentId) : undefined;
    if (!parent) break;
    const relationWord = hop === 'P' ? 'père' : 'mère';
    const possessive = parent.gender === 'F' ? 'sa' : 'son';
    segments.push(`${possessive} ${relationWord} ${parent.name}`);
    cursor = parent;
  }
  return segments.join(' → ');
}

export default function TechnicalDetails({ relation, personA, personB, getMember }: Props) {
  const pathADesc = describeChain(personA, relation.pathA, getMember);
  const pathBDesc = describeChain(personB, relation.pathB, getMember);

  return (
    <div className="parente-tech-details">
      <div className="tech-title">Détails techniques</div>
      <dl>
        <dt>Chemin A</dt><dd>{pathADesc}</dd>
        <dt>Chemin B</dt><dd>{pathBDesc}</dd>
        <dt>Distances</dt><dd>dA = {relation.distanceA}, dB = {relation.distanceB}</dd>
        <dt>Proximité</dt><dd>{relation.proximityScore}</dd>
        <dt>Équilibre</dt><dd>{relation.balanceScore}</dd>
      </dl>
    </div>
  );
}

// react-app/src/lib/parenteSonghay/index.ts
import type { Member, MemberDict } from '../types';
import { classifyInstance } from './classify';
import { enumeratePaths } from './enumeratePaths';
import { findLCAInstances } from './findLCAInstances';
import { defaultLabels } from './labels';
import type { Person, PersonDict, Relation, RelationResult } from './types';

export * from './types';
export { defaultLabels } from './labels';
export { applyLabels } from './applyLabels';
export { explainRelation } from './explain';

function toPerson(m: Member): Person {
  return { id: m.id, name: m.name, sex: m.gender, fatherId: m.father_id, motherId: m.mother_ref };
}

function toPersonDict(members: MemberDict): PersonDict {
  const out: PersonDict = {};
  for (const id of Object.keys(members)) out[id] = toPerson(members[id]);
  return out;
}

export function computeRelations(
  idA: string,
  idB: string,
  members: MemberDict,
  labels: Record<string, string> = defaultLabels,
): RelationResult {
  if (idA === idB) return { kind: 'same-person' };
  if (!members[idA] || !members[idB]) return { kind: 'no-link' };
  const dict = toPersonDict(members);
  const A = dict[idA];
  const B = dict[idB];
  const pathsA = enumeratePaths(idA, dict);
  const pathsB = enumeratePaths(idB, dict);
  const instances = findLCAInstances(pathsA, pathsB);
  if (instances.length === 0) return { kind: 'no-link' };

  const relations: Relation[] = [];
  const missingMap = new Map<string, 'father' | 'mother'>();

  for (const inst of instances) {
    const classification = classifyInstance(A, B, inst, dict, labels);
    if ('incomplete' in classification) {
      for (const m of classification.missing) missingMap.set(m.personId + ':' + m.missing, m.missing);
      continue;
    }
    const ancestorPerson = dict[inst.ancestor];
    relations.push({
      termForA: classification.termForA,
      termForB: classification.termForB,
      kind: classification.kind,
      via: inst.ancestor,
      viaName: ancestorPerson?.name ?? inst.ancestor,
      pathA: inst.pathA,
      pathB: inst.pathB,
      distanceA: inst.pathA.length,
      distanceB: inst.pathB.length,
      proximityScore: inst.pathA.length + inst.pathB.length,
      balanceScore: Math.max(inst.pathA.length, inst.pathB.length),
    });
  }

  if (relations.length === 0 && missingMap.size > 0) {
    return {
      kind: 'incomplete',
      missingParents: Array.from(missingMap.entries()).map(([k, missing]) => ({
        personId: k.split(':')[0], missing,
      })),
    };
  }
  if (relations.length === 0) return { kind: 'no-link' };

  // Tri par proximité puis équilibre
  relations.sort((a, b) =>
    a.proximityScore !== b.proximityScore
      ? a.proximityScore - b.proximityScore
      : a.balanceScore - b.balanceScore,
  );

  // Déduplication (termForA, termForB, via)
  const seen = new Set<string>();
  const unique = relations.filter((r) => {
    const key = `${r.termForA}|${r.termForB}|${r.via}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { kind: 'relations', relations: unique };
}

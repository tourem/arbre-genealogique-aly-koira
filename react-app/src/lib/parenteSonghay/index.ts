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

function areCoupleDuplicates(
  r1: Relation,
  r2: Relation,
  members: MemberDict,
): boolean {
  if (r1.termForA !== r2.termForA) return false;
  if (r1.termForB !== r2.termForB) return false;
  if (r1.pathA.length !== r2.pathA.length) return false;
  if (r1.pathB.length !== r2.pathB.length) return false;
  if (r1.pathA.length === 0 || r1.pathB.length === 0) return false;

  // All hops but the last must match exactly
  for (let i = 0; i < r1.pathA.length - 1; i++) {
    if (r1.pathA[i] !== r2.pathA[i]) return false;
  }
  for (let i = 0; i < r1.pathB.length - 1; i++) {
    if (r1.pathB[i] !== r2.pathB[i]) return false;
  }

  // Last hops must be OPPOSITE on both sides (one P, one M)
  if (r1.pathA[r1.pathA.length - 1] === r2.pathA[r2.pathA.length - 1]) return false;
  if (r1.pathB[r1.pathB.length - 1] === r2.pathB[r2.pathB.length - 1]) return false;

  // LCAs must be spouses of each other
  const lca1 = members[r1.via];
  const lca2 = members[r2.via];
  if (!lca1 || !lca2) return false;
  const spouses1 = lca1.spouses ?? [];
  const spouses2 = lca2.spouses ?? [];
  return spouses1.includes(r2.via) || spouses2.includes(r1.via);
}

function dedupCoupleDuplicates(
  relations: Relation[],
  members: MemberDict,
): Relation[] {
  const dropped = new Set<number>();
  for (let i = 0; i < relations.length; i++) {
    if (dropped.has(i)) continue;
    for (let j = i + 1; j < relations.length; j++) {
      if (dropped.has(j)) continue;
      if (areCoupleDuplicates(relations[i], relations[j], members)) {
        dropped.add(j);
      }
    }
  }
  return relations.filter((_, i) => !dropped.has(i));
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

  const coupleDeduped = dedupCoupleDuplicates(unique, members);
  return { kind: 'relations', relations: coupleDeduped };
}

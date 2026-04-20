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
export { glossForTerm } from './glossForTerm';

function toPerson(m: Member): Person {
  return { id: m.id, name: m.name, sex: m.gender, fatherId: m.father_id, motherId: m.mother_ref };
}

function toPersonDict(members: MemberDict): PersonDict {
  const out: PersonDict = {};
  for (const id of Object.keys(members)) out[id] = toPerson(members[id]);
  return out;
}

/**
 * Two relations are "duplicates via a married couple" IFF:
 *   1. They have the same (termForA, termForB). This is the primary gate: if
 *      passing via the husband yields one kinship (e.g. hassa/touba) and via
 *      the wife yields a different kinship (e.g. baba/izé), these are NOT
 *      duplicates and both MUST be preserved.
 *   2. The two structural paths are identical except for their LAST hop, which
 *      is flipped (P <-> M) on both sides. This is the structural signature of
 *      a couple: child of the couple is the same, only the LCA parent differs.
 *   3. The two LCAs are mutually spouses in the member dictionary.
 *
 * Conditions 2 and 3 without 1 should never occur by construction of the
 * classification algorithm (the classification depends on sibling-equivalents,
 * not on the LCA's own sex when dA>0 and dB>0). Condition 1 is the safety net
 * that guarantees correctness even if the algorithm evolves.
 *
 * Songhay cultural note: marriage is structurally meaningful; a married couple
 * forms one reproductive unit when the link transits both spouses identically.
 * But when the link differs via husband vs wife, the two relations represent
 * distinct kinship routes and must both be surfaced to the user.
 */
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
  // We need to enrich kept relations with viaSpouse info, so work on a mutable copy
  const result: Relation[] = relations.map((r) => ({ ...r }));
  for (let i = 0; i < result.length; i++) {
    if (dropped.has(i)) continue;
    for (let j = i + 1; j < result.length; j++) {
      if (dropped.has(j)) continue;
      if (areCoupleDuplicates(result[i], result[j], members)) {
        dropped.add(j);
        // Enrich kept relation i with the dropped LCA's info
        if (!result[i].viaSpouse) {
          const droppedLca = members[result[j].via];
          if (droppedLca) {
            result[i].viaSpouse = { id: droppedLca.id, name: droppedLca.name };
          }
        }
      }
    }
  }
  return result.filter((_, i) => !dropped.has(i));
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
      groupTerm: classification.groupTerm,
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

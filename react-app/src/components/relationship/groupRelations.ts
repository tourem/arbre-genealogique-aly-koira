import type { Relation } from '../../lib/parenteSonghay';

export interface RelationGroup {
  termForA: string;
  termForB: string;
  kind: Relation['kind'];
  /** All relations sharing the same term pair, sorted by proximity. The first
   *  is the closest (used to represent the group in the collapsed header). */
  paths: Relation[];
}

export function groupRelations(relations: Relation[]): RelationGroup[] {
  const byKey = new Map<string, RelationGroup>();
  for (const r of relations) {
    const key = `${r.termForA}|${r.termForB}`;
    let g = byKey.get(key);
    if (!g) {
      g = { termForA: r.termForA, termForB: r.termForB, kind: r.kind, paths: [] };
      byKey.set(key, g);
    }
    g.paths.push(r);
  }
  // Paths within each group are already sorted (input is pre-sorted), but re-assert.
  for (const g of byKey.values()) {
    g.paths.sort((a, b) =>
      a.proximityScore !== b.proximityScore
        ? a.proximityScore - b.proximityScore
        : a.balanceScore - b.balanceScore,
    );
  }
  // Groups sorted by best path's proximity, then balance.
  return Array.from(byKey.values()).sort((a, b) => {
    const pA = a.paths[0];
    const pB = b.paths[0];
    return pA.proximityScore !== pB.proximityScore
      ? pA.proximityScore - pB.proximityScore
      : pA.balanceScore - pB.balanceScore;
  });
}

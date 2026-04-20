import type { MemberDict } from '../../lib/types';

export interface SuggestedPair {
  aId: string;
  aName: string;
  bId: string;
  bName: string;
  hint?: string;
}

export function suggestPairs(members: MemberDict, max: number = 3): SuggestedPair[] {
  const list = Object.values(members);
  if (list.length < 2) return [];
  const pairs: SuggestedPair[] = [];

  // Pair 1: lowest generation <-> highest generation (ancestor/descendant)
  const byGen = [...list].sort((a, b) => a.generation - b.generation);
  const root = byGen[0];
  const leaf = byGen[byGen.length - 1];
  if (root && leaf && root.id !== leaf.id) {
    pairs.push({
      aId: root.id, aName: root.name,
      bId: leaf.id, bName: leaf.name,
      hint: 'ancêtre & descendant',
    });
  }

  // Pair 2: two members sharing a parent (siblings)
  const byParent = new Map<string, string[]>();
  for (const m of list) {
    if (m.father_id) {
      const arr = byParent.get(m.father_id) ?? [];
      arr.push(m.id);
      byParent.set(m.father_id, arr);
    }
    if (m.mother_ref) {
      const arr = byParent.get(m.mother_ref) ?? [];
      arr.push(m.id);
      byParent.set(m.mother_ref, arr);
    }
  }
  for (const [, kids] of byParent) {
    if (kids.length >= 2) {
      const a = members[kids[0]];
      const b = members[kids[1]];
      if (a && b) {
        pairs.push({
          aId: a.id, aName: a.name,
          bId: b.id, bName: b.name,
          hint: 'fratrie',
        });
        break;
      }
    }
  }

  // Pair 3: two cousins (their parents share a parent)
  for (const [, kids] of byParent) {
    if (kids.length >= 2 && pairs.length < max) {
      const firstGrand = list.find(m => m.father_id === kids[0] || m.mother_ref === kids[0]);
      const secondGrand = list.find(m => m.father_id === kids[1] || m.mother_ref === kids[1]);
      if (firstGrand && secondGrand && firstGrand.id !== secondGrand.id) {
        pairs.push({
          aId: firstGrand.id, aName: firstGrand.name,
          bId: secondGrand.id, bName: secondGrand.name,
          hint: 'cousins',
        });
        break;
      }
    }
  }

  return pairs.slice(0, max);
}

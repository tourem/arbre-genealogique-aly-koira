// react-app/src/lib/parenteSonghay/findLCAInstances.ts
import type { AncestorPath, Hop, LCAInstance } from './types';

function isPrefix(shorter: Hop[], longer: Hop[]): boolean {
  if (shorter.length >= longer.length) return false;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) return false;
  }
  return true;
}

/**
 * Pour chaque ancêtre commun, produit toutes les combinaisons de chemins,
 * puis filtre les instances non-minimales.
 * Une instance (X, pathA, pathB) est non-minimale s'il existe une autre
 * instance (Y, pathA', pathB') telle que pathA' est un préfixe strict de pathA
 * ET pathB' est un préfixe strict de pathB.
 */
export function findLCAInstances(
  pathsA: AncestorPath[],
  pathsB: AncestorPath[],
): LCAInstance[] {
  const byAncestorA = new Map<string, AncestorPath[]>();
  const byAncestorB = new Map<string, AncestorPath[]>();
  for (const p of pathsA) {
    const list = byAncestorA.get(p.ancestor) ?? [];
    list.push(p);
    byAncestorA.set(p.ancestor, list);
  }
  for (const p of pathsB) {
    const list = byAncestorB.get(p.ancestor) ?? [];
    list.push(p);
    byAncestorB.set(p.ancestor, list);
  }

  const candidates: LCAInstance[] = [];
  for (const [ancestor, listA] of byAncestorA) {
    const listB = byAncestorB.get(ancestor);
    if (!listB) continue;
    for (const a of listA) {
      for (const b of listB) {
        candidates.push({ ancestor, pathA: a.hops, pathB: b.hops });
      }
    }
  }

  // Filtre : une instance (X, pA, pB) est non-minimale si une autre (Y, pA', pB')
  // existe avec pA' préfixe strict de pA ET pB' préfixe strict de pB.
  return candidates.filter((inst) => {
    for (const other of candidates) {
      if (other === inst) continue;
      if (isPrefix(other.pathA, inst.pathA) && isPrefix(other.pathB, inst.pathB)) {
        return false;
      }
    }
    return true;
  });
}

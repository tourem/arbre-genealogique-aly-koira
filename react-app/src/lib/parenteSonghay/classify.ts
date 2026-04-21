// react-app/src/lib/parenteSonghay/classify.ts
import type { LCAInstance, MissingParent, Person, PersonDict, Relation } from './types';
import {
  buildCrossCousinTerm,
  buildDirectChildTerm,
  buildDirectParentTerm,
  buildHaamaTerm,
  buildKagaTerm,
  buildSiblingTerm,
} from './buildTerms';

type Labels = Record<string, string>;
export type ClassifyResult =
  | Omit<Relation, 'via' | 'viaName' | 'pathA' | 'pathB' | 'distanceA' | 'distanceB' | 'proximityScore' | 'balanceScore'>
  | { incomplete: true; missing: MissingParent[] };

function parentOf(p: Person, dict: PersonDict, hop: 'P' | 'M'): Person | null {
  const id = hop === 'P' ? p.fatherId : p.motherId;
  return id ? dict[id] ?? null : null;
}

function classifyDescendant(
  ancestor: Person,
  _descendant: Person,
  distance: number,
  firstHop: 'P' | 'M',
  L: Labels,
  reverse: boolean,
): ClassifyResult {
  let termAncestor: string;
  let termDescendant: string;
  if (distance === 1) {
    termAncestor = buildDirectParentTerm(ancestor.sex, L);
    termDescendant = buildDirectChildTerm(L);
  } else {
    termAncestor = buildKagaTerm(ancestor.sex, distance - 1, firstHop, L);
    termDescendant = buildHaamaTerm(distance - 1, L);
  }
  if (reverse) {
    return { kind: 'direct-ascendant', termForA: termDescendant, termForB: termAncestor };
  }
  return { kind: 'direct-descendant', termForA: termAncestor, termForB: termDescendant };
}

function classifySameGen(A: Person, B: Person, instance: LCAInstance, dict: PersonDict, L: Labels): ClassifyResult {
  const parentA = parentOf(A, dict, instance.pathA[0]);
  const parentB = parentOf(B, dict, instance.pathB[0]);
  const missing: MissingParent[] = [];
  if (!parentA) missing.push({ personId: A.id, missing: instance.pathA[0] === 'P' ? 'father' : 'mother' });
  if (!parentB) missing.push({ personId: B.id, missing: instance.pathB[0] === 'P' ? 'father' : 'mother' });
  if (missing.length) return { incomplete: true, missing };

  if (parentA!.sex === parentB!.sex) {
    const dA = instance.pathA.length;
    const dB = instance.pathB.length;
    // Songhay "reset" rule: at ANY same-generation depth (dA=dB>=2), direct
    // parents of A and B are sibling-equivalents. Same sex → parallel group:
    //   arrou hinka izey = "enfants de deux frères" (parents both male).
    //   woy hinka izey   = "enfants de deux sœurs" (parents both female).
    // Only true siblings (dA=dB=1, sharing a single direct parent) are
    // excluded — they have ONE parent, not "two brothers / two sisters".
    let groupTerm: string | undefined;
    const hasGroupTerm = dA === dB && dA >= 2;
    if (hasGroupTerm) {
      groupTerm = parentA!.sex === 'M'
        ? L['term.arrou_hinka_izey']
        : L['term.woy_hinka_izey'];
    }
    return {
      kind: 'parallel',
      termForA: buildSiblingTerm(A.sex, L),
      termForB: buildSiblingTerm(B.sex, L),
      groupTerm,
    };
  }
  // Cross branch : direct parents are of opposite sexes (siblings at LCA).
  // hassey-zee n'da hawey-zee = "enfants d'un frère et d'une sœur".
  // Songhay reset rule: applies at ANY same-generation depth (dA=dB>=2),
  // not only at the first-cousin level.
  const dA = instance.pathA.length;
  const dB = instance.pathB.length;
  let groupTerm: string | undefined;
  const hasGroupTerm = dA === dB && dA >= 2;
  if (hasGroupTerm) {
    groupTerm = L['term.hassey_zee_nda_hawey_zee'];
  }
  return {
    kind: 'cross',
    termForA: buildCrossCousinTerm(A.sex, L),
    termForB: buildCrossCousinTerm(B.sex, L),
    groupTerm,
  };
}

function classifyDelta(
  A: Person, B: Person, instance: LCAInstance, dict: PersonDict, L: Labels,
): ClassifyResult {
  const dA = instance.pathA.length;
  const dB = instance.pathB.length;
  const supIsA = dA < dB;
  const sup = supIsA ? A : B;
  const inf = supIsA ? B : A;
  const pathInf = supIsA ? instance.pathB : instance.pathA;
  const dSup = Math.min(dA, dB);
  const dInf = Math.max(dA, dB);
  const delta = dInf - dSup;

  let termSup: string;
  let termInf: string;

  if (delta === 1) {
    const parentInfTop = parentOf(inf, dict, pathInf[0]);
    if (!parentInfTop) {
      return { incomplete: true, missing: [{ personId: inf.id, missing: pathInf[0] === 'P' ? 'father' : 'mother' }] };
    }
    if (sup.sex === parentInfTop.sex) {
      termSup = buildDirectParentTerm(sup.sex, L);
      termInf = buildDirectChildTerm(L);
    } else if (sup.sex === 'M') {
      termSup = L['term.hassa'];
      termInf = L['term.touba'];
    } else {
      termSup = L['term.hawa'];
      termInf = buildDirectChildTerm(L);
    }
    const r: ClassifyResult = { kind: 'avuncular', termForA: supIsA ? termSup : termInf, termForB: supIsA ? termInf : termSup };
    return r;
  }

  // delta >= 2 : grand-oncle, arrière-grand-oncle, ...
  const nbKaga = delta - 1;
  termSup = buildKagaTerm(sup.sex, nbKaga, pathInf[0], L);
  termInf = buildHaamaTerm(nbKaga, L);
  return { kind: 'distant-vertical', termForA: supIsA ? termSup : termInf, termForB: supIsA ? termInf : termSup };
}

export function classifyInstance(
  A: Person, B: Person, instance: LCAInstance, dict: PersonDict, L: Labels,
): ClassifyResult {
  const dA = instance.pathA.length;
  const dB = instance.pathB.length;
  if (dA === 0) {
    return classifyDescendant(A, B, dB, instance.pathB[0] ?? 'P', L, false);
  }
  if (dB === 0) {
    return classifyDescendant(B, A, dA, instance.pathA[0] ?? 'P', L, true);
  }
  if (dA === dB) {
    return classifySameGen(A, B, instance, dict, L);
  }
  return classifyDelta(A, B, instance, dict, L);
}

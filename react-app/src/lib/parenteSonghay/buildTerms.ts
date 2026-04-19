// react-app/src/lib/parenteSonghay/buildTerms.ts
import type { Hop, Sex } from './types';

type Labels = Record<string, string>;

export function buildDirectParentTerm(parentSex: Sex, L: Labels): string {
  return parentSex === 'M' ? L['term.baba'] : L['term.gna'];
}

export function buildDirectChildTerm(L: Labels): string {
  return L['term.ize'];
}

export function buildCoteSuffix(firstHop: Hop, L: Labels): string {
  return firstHop === 'P' ? L['term.cote_baba'] : L['term.cote_gna'];
}

/**
 * Construit "kaga [kaga...] arou/woy coté baba/gna".
 * nbKaga >= 1 (niveau 1 = grand-parent, niveau 2 = arrière-grand-parent, etc.)
 */
export function buildKagaTerm(
  ancestorSex: Sex,
  nbKaga: number,
  firstHopOfDescendant: Hop,
  L: Labels,
): string {
  const kagaWord = L[ancestorSex === 'M' ? 'term.kaga_arou' : 'term.kaga_woy'];
  // kaga_arou = "kaga arou" ; on veut nbKaga répétitions du mot "kaga" avant "arou"
  // pour nbKaga=1 : "kaga arou" ; pour nbKaga=2 : "kaga kaga arou"
  const parts = kagaWord.split(' ');
  const lastWord = parts[parts.length - 1]; // "arou" ou "woy"
  const prefixes = Array(nbKaga).fill(parts[0]); // n fois "kaga"
  const base = [...prefixes, lastWord].join(' ');
  return `${base} ${buildCoteSuffix(firstHopOfDescendant, L)}`;
}

/** Construit "haama" ou "haama haama ..." selon la répétition. */
export function buildHaamaTerm(nbRepeat: number, L: Labels): string {
  return Array(nbRepeat).fill(L['term.haama']).join(' ');
}

export function buildSiblingTerm(personSex: Sex, L: Labels): string {
  return personSex === 'M' ? L['term.arma'] : L['term.woyma'];
}

export function buildCrossCousinTerm(personSex: Sex, L: Labels): string {
  return personSex === 'M' ? L['term.baassa_arou'] : L['term.baassa_woy'];
}

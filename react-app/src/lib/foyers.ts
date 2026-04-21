import type { Member, MemberDict } from './types';

export interface Foyer {
  /** Rang dans la séquence des foyers (1-based). */
  rank: number;
  /** Conjoint résolu en membre, ou null si seulement un nom libre. */
  spouse: Member | null;
  /** Fallback si `spouse` est null : le nom brut tel que saisi. */
  spouseName: string | null;
  /** Enfants du person nés de ce foyer (tri par position dans person.children). */
  children: Member[];
  /** True si ce foyer est le cas spécial "enfants sans conjoint identifié". */
  orphan: boolean;
}

/**
 * Résout un spouseRef (ID ou nom libre) en membre si possible.
 */
function findSpouseMember(spouseRef: string, members: MemberDict): Member | null {
  if (members[spouseRef]) return members[spouseRef];
  const refLower = spouseRef.toLowerCase().trim();
  for (const m of Object.values(members)) {
    if (m.name.toLowerCase() === refLower) return m;
  }
  return null;
}

/**
 * Construit la liste ordonnée des foyers d'une personne.
 *
 * Règles :
 * - Un foyer par conjoint dans `person.spouses`, dans l'ordre du tableau.
 * - Les enfants de person sont attribués au conjoint dont l'ID
 *   correspond à `child.mother_ref` (si person est homme) ou à
 *   `child.father_id` (si person est femme).
 * - Les enfants non attribuables forment un foyer "orphan" final.
 */
export function computeFoyers(person: Member, members: MemberDict): Foyer[] {
  const spouses = [...new Set(person.spouses ?? [])];
  const allChildren: Member[] = [...new Set(person.children ?? [])]
    .map((cid) => members[cid])
    .filter((c): c is Member => Boolean(c));

  const isMale = person.gender === 'M';
  const assigned = new Set<string>(); // child IDs assigned to a foyer
  const foyers: Foyer[] = [];

  spouses.forEach((spRef, idx) => {
    const spouse = findSpouseMember(spRef, members);
    const spouseId = spouse?.id ?? null;
    const spouseName = spouse?.name ?? spRef;

    const kids = allChildren.filter((c) => {
      if (assigned.has(c.id)) return false;
      if (isMale) {
        // person est père, on cherche children dont mother_ref = spouse
        return c.mother_ref === spouseId
            || c.mother_ref === spRef
            || (spouse !== null && c.mother_ref === spouse.name);
      } else {
        // person est mère, on cherche children dont father_id = spouse
        return c.father_id === spouseId
            || c.father_id === spRef
            || (spouse !== null && c.father_id === spouse.name);
      }
    });
    for (const k of kids) assigned.add(k.id);

    foyers.push({
      rank: idx + 1,
      spouse,
      spouseName: spouse ? null : spouseName,
      children: kids,
      orphan: false,
    });
  });

  // Enfants non assignés → foyer orphelin
  const leftover = allChildren.filter((c) => !assigned.has(c.id));
  if (leftover.length > 0) {
    foyers.push({
      rank: foyers.length + 1,
      spouse: null,
      spouseName: null,
      children: leftover,
      orphan: true,
    });
  }

  return foyers;
}

/**
 * Label textuel du rang, selon le sexe du conjoint.
 * Ex : rank=1, spouse=female → "1ère épouse"
 *      rank=3, spouse=male   → "3ème époux"
 */
export function rankLabel(rank: number, spouseGender: 'M' | 'F'): string {
  const role = spouseGender === 'M' ? 'époux' : 'épouse';
  if (rank === 1) return `1${spouseGender === 'M' ? 'er' : 'ère'} ${role}`;
  return `${rank}ème ${role}`;
}

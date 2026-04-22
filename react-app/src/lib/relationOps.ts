/**
 * Operations de suppression symetrique de relations.
 *
 * Chaque fonction est un wrapper TypeScript autour d'une RPC
 * PL/pgSQL (cf. migration 015) qui applique la mutation des DEUX
 * cotes dans une seule transaction. Le client ne choisit jamais la
 * symetrie — c'est un invariant enforced server-side.
 *
 * Les fonctions `describe*` renvoient une description humaine des
 * consequences concretes, pour les modales de confirmation.
 */

import { supabase } from './supabase';
import type { Member, MemberDict } from './types';

// ============================================================
// Wrappers RPC (suppression symetrique)
// ============================================================

export async function detachParent(
  childId: string,
  role: 'father' | 'mother',
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('detach_parent', {
    p_child_id: childId,
    p_role: role,
  });
  return { error: error?.message ?? null };
}

export async function dissolveMarriage(
  aId: string,
  bId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('dissolve_marriage', {
    p_a_id: aId,
    p_b_id: bId,
  });
  return { error: error?.message ?? null };
}

export async function detachChildFromFoyer(
  childId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('detach_child_from_foyer', {
    p_child_id: childId,
  });
  return { error: error?.message ?? null };
}

export async function archiveMember(
  memberId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('archive_member', {
    p_member_id: memberId,
  });
  return { error: error?.message ?? null };
}

export async function restoreMember(
  memberId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('restore_member', {
    p_member_id: memberId,
  });
  return { error: error?.message ?? null };
}

// ============================================================
// Descriptions des consequences (pour les modales)
// Pure, testables sans reseau.
// ============================================================

export interface RelationConsequence {
  /** Phrase principale : qu'est-ce qui va se passer. */
  headline: string;
  /** Liste de consequences concretes (bullet points). */
  items: string[];
  /** Avertissements en rouge si applicable. */
  warnings: string[];
  /** Rappel : cette action n'archive pas la fiche. */
  preservation: string;
}

/** Consequences de "Retirer cette relation" sur un lien parent-enfant. */
export function describeDetachParent(
  child: Member,
  parent: Member | string | null,
  role: 'father' | 'mother',
): RelationConsequence {
  const parentLabel = typeof parent === 'string'
    ? parent
    : parent?.name ?? 'le parent';
  const roleLabel = role === 'father' ? 'pere' : 'mere';

  const items: string[] = [
    `${parentLabel} ne sera plus liee a ${child.name} comme ${roleLabel}.`,
    `La fiche de ${child.name} perdra son ${roleLabel}${role === 'mother' ? ' (mother_ref vide)' : ''}.`,
  ];
  if (typeof parent !== 'string' && parent) {
    items.push(`${parent.name} perdra ${child.name} de sa liste d'enfants.`);
  }

  return {
    headline: `Retirer ${parentLabel} comme ${roleLabel} de ${child.name} ?`,
    items,
    warnings: [],
    preservation: 'Les deux fiches restent intactes. Seule la relation est effacee.',
  };
}

/** Consequences de "Retirer ce foyer" = dissoudre un mariage. */
export function describeDissolveMarriage(
  person: Member,
  spouse: Member,
  members: MemberDict,
): RelationConsequence {
  const sharedChildren = (person.children ?? []).filter((cid) => {
    const child = members[cid];
    if (!child) return false;
    const fatherId = person.gender === 'M' ? person.id : spouse.id;
    const motherId = person.gender === 'F' ? person.id : spouse.id;
    return child.father_id === fatherId && child.mother_ref === motherId;
  });

  const items: string[] = [
    `Le mariage entre ${person.name} et ${spouse.name} sera dissous.`,
    `${spouse.name} sera retiree de la liste des conjoint·e·s de ${person.name}, et reciproquement.`,
  ];
  const warnings: string[] = [];
  if (sharedChildren.length > 0) {
    warnings.push(
      `${sharedChildren.length} enfant${sharedChildren.length > 1 ? 's' : ''} partage${sharedChildren.length > 1 ? 'nt' : ''} ce foyer. Leurs liens parent-enfant avec ${person.name} et ${spouse.name} sont conserves — seul le mariage disparait.`,
    );
  }

  return {
    headline: `Dissoudre le mariage entre ${person.name} et ${spouse.name} ?`,
    items,
    warnings,
    preservation: 'Les deux fiches et les fiches des enfants restent intactes.',
  };
}

/** Consequences de "Retirer de ce foyer" sur un enfant d'un foyer. */
export function describeDetachChildFromFoyer(
  child: Member,
  father: Member | null,
  mother: Member | string | null,
): RelationConsequence {
  const motherLabel = typeof mother === 'string' ? mother : mother?.name ?? null;

  const items: string[] = [];
  if (father) {
    items.push(`${father.name} perdra ${child.name} de sa descendance.`);
  }
  if (motherLabel) {
    items.push(`${motherLabel} perdra ${child.name} de sa descendance.`);
  }
  items.push(`La fiche de ${child.name} n'aura plus de pere ni de mere reference.`);

  return {
    headline: `Detacher ${child.name} de ce foyer ?`,
    items,
    warnings: [
      `${child.name} deviendra une fiche "orpheline" de parents. Vous pourrez lui rattacher un autre foyer plus tard.`,
    ],
    preservation: `La fiche de ${child.name} reste intacte.`,
  };
}

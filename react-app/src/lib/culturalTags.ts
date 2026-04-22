import type { Member, MemberDict } from './types';

/** Valeurs autorisées pour les tags culturels. Extensible au fil des ajouts. */
export const KNOWN_CULTURAL_TAGS = ['koda', 'konkobey'] as const;
export type CulturalTagKey = typeof KNOWN_CULTURAL_TAGS[number];

export type TagSource = 'explicit' | 'inferred';

export interface ResolvedTag {
  tag: string;
  source: TagSource;
}

/**
 * Retourne les tags culturels applicables à un membre.
 *
 * - `source: 'explicit'` si le tag est saisi dans Member.cultural_tags.
 * - `source: 'inferred'` si le tag est auto-détecté (ex: koda = dernier
 *   enfant de la fratrie selon l'ordre du tableau children[] d'un parent).
 *
 * Les tags explicites ont priorité : si un tag est à la fois dans
 * cultural_tags ET détecté automatiquement, il apparaît en 'explicit'.
 */
export function resolveTags(member: Member, members: MemberDict): ResolvedTag[] {
  const explicit = new Set((member.cultural_tags ?? []).filter((t) =>
    (KNOWN_CULTURAL_TAGS as readonly string[]).includes(t),
  ));

  const inferred = new Set<string>();

  // Heuristique koda : dernier de la fratrie chez au moins un parent.
  // "Dernier" = position finale dans children[] du père ou de la mère.
  // On ne croise pas parent.children et Member.id strictement : on prend
  // simplement la position. Si les deux parents mettent l'enfant en
  // dernière position, la détection est très fiable. Sinon, au moins un
  // parent suffit (la famille enregistre généralement l'ordre correctement
  // côté père).
  const isLastOf = (parentId: string | null): boolean => {
    if (!parentId) return false;
    const parent = members[parentId];
    if (!parent || !parent.children || parent.children.length === 0) return false;
    return parent.children[parent.children.length - 1] === member.id;
  };

  if (isLastOf(member.father_id) || isLastOf(member.mother_ref)) {
    inferred.add('koda');
  }

  const result: ResolvedTag[] = [];
  // Explicites d'abord (ordre du tableau), puis les inférés qui ne sont
  // pas déjà explicites.
  for (const t of explicit) result.push({ tag: t, source: 'explicit' });
  for (const t of inferred) {
    if (!explicit.has(t)) result.push({ tag: t, source: 'inferred' });
  }
  return result;
}

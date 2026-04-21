import type { Member, MemberDict } from './types';

/**
 * Construit une phrase de lignage courte pour un membre, utilisée dans
 * les cards Parents de la fiche personne.
 *
 * Forme : "Fils de X, petit-fils de Y, époux de Z"
 * - Fils/Fille selon member.gender
 * - X = père du membre (father_id)
 * - Y = père du père (grand-père paternel)
 * - Z = liste des conjoints (spouses), jointe en français
 *
 * Chaque segment est ajouté seulement si les données sont disponibles.
 */
export function buildLineage(member: Member, members: MemberDict): string {
  const segments: string[] = [];
  const isMale = member.gender === 'M';

  // "Fils/Fille de X" via le père
  const father = member.father_id ? members[member.father_id] : null;
  if (father) {
    segments.push(`${isMale ? 'Fils' : 'Fille'} de ${father.name}`);
  }

  // "petit-fils/fille de Y" via le grand-père paternel
  const grandFather = father?.father_id ? members[father.father_id] : null;
  if (grandFather) {
    segments.push(`${isMale ? 'petit-fils' : 'petite-fille'} de ${grandFather.name}`);
  }

  // Conjoints : "époux/épouse de Z [et W]"
  const spouseNames = (member.spouses ?? [])
    .map((id) => members[id]?.name)
    .filter((n): n is string => Boolean(n));
  if (spouseNames.length > 0) {
    const role = isMale ? 'époux' : 'épouse';
    const joined = formatList(spouseNames);
    segments.push(`${role} de ${joined}`);
  }

  return segments.join(', ');
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} et ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
}

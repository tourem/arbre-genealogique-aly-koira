import type { Member, MemberDict } from './types';

/**
 * Retourne "de " ou "d'" selon que le mot suivant commence par voyelle ou
 * h muet. Utilisé pour produire un français correct : "époux d'Alkamahamane"
 * au lieu de "époux de Alkamahamane".
 *
 * Liste indicative de h aspiré courants en français — les prénoms songhay
 * commençant par H ont généralement un H aspiré (Hamatou, Hamidou, Haoua...),
 * mais l'usage dominant dans le corpus Aly Koïra est l'élision ("d'Hamatou").
 * On élide par défaut devant H ; ajouter ici des exceptions si besoin.
 */
export function articleDevant(name: string): "de " | "d'" {
  const first = (name ?? '').trim().charAt(0).toLowerCase();
  // Supprimer diacritiques éventuels (É, À, Ï...) pour la comparaison
  const normalized = first.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if ('aeiouyh'.includes(normalized)) return "d'";
  return 'de ';
}

function joinWithArticle(verb: string, name: string): string {
  return `${verb} ${articleDevant(name)}${name}`;
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} et ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
}

export interface LineageOptions {
  /** ID du conjoint à exclure de la liste (ex. autre parent affiché dans la même rangée). */
  excludeSpouseId?: string | null;
  /** Nombre max d'ancêtres remontés (père + grand-père + arrière-grand-père = 3). */
  maxAncestors?: number;
}

/**
 * Construit une phrase de lignage courte pour un membre, utilisée dans
 * les cards Parents de la fiche personne.
 *
 * Forme cible : "Fils de X, petit-fils d'Y, époux d'Amina"
 * - Genre de "Fils/Fille" et "époux/épouse" selon member.gender.
 * - Élision automatique devant voyelle/h via articleDevant().
 * - Remonte jusqu'à `maxAncestors` générations (3 par défaut).
 * - Exclut le conjoint `excludeSpouseId` (généralement l'autre parent
 *   affiché dans la même rangée, pour éviter la redondance).
 */
export function buildLineage(
  member: Member,
  members: MemberDict,
  options: LineageOptions = {},
): string {
  const { excludeSpouseId = null, maxAncestors = 3 } = options;
  const segments: string[] = [];
  const isMale = member.gender === 'M';

  // Niveau 1 : père → "Fils/Fille de X"
  const father = member.father_id ? members[member.father_id] : null;
  if (father && maxAncestors >= 1) {
    segments.push(`${isMale ? 'Fils' : 'Fille'}${articleDevant(father.name) === "d'" ? " d'" : ' de '}${father.name}`);
  }

  // Niveaux 2+ : grand-père → arrière-grand-père → ...
  // Labels : petit-fils/fille, arrière-petit-fils/fille, ...
  const descPrefix = (level: number, male: boolean): string => {
    const base = male ? 'petit-fils' : 'petite-fille';
    if (level === 2) return base;
    // "arrière-petit-fils", puis "arrière-arrière-petit-fils" au-delà
    const repeats = level - 2;
    return `${'arrière-'.repeat(repeats)}${base}`;
  };

  let cursor: Member | null = father;
  for (let level = 2; level <= maxAncestors; level++) {
    const next = cursor?.father_id ? members[cursor.father_id] : null;
    if (!next) break;
    segments.push(joinWithArticle(descPrefix(level, isMale), next.name));
    cursor = next;
  }

  // Conjoints : "époux/épouse d'X [et d'Y]"
  // Éviter la redondance avec l'autre parent déjà affiché.
  const spouses = (member.spouses ?? [])
    .filter((id) => id !== excludeSpouseId)
    .map((id) => members[id]?.name)
    .filter((n): n is string => Boolean(n));

  if (spouses.length > 0) {
    const role = isMale ? 'époux' : 'épouse';
    if (spouses.length === 1) {
      segments.push(joinWithArticle(role, spouses[0]));
    } else {
      const joined = formatList(spouses);
      // Quand plusieurs, on garde "de" générique — l'élision de la liste
      // jointe n'est pas triviale (le premier nom peut commencer par voyelle
      // et pas les autres). Le joint "Fatou, Awa et Aïcha" reste lisible.
      segments.push(`${role} de ${joined}`);
    }
  }

  return segments.join(', ');
}

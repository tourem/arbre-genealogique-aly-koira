// react-app/src/lib/parenteSonghay/anthroLabel.ts
import type { Relation } from './types';
import type { RelationGroup } from '../../components/relationship/groupRelations';

type GenderA = 'M' | 'F';

/**
 * Retourne une etiquette anthropologique courte a afficher sous la
 * phrase principale d'AnswerBlock.
 *
 * Ex. "Neveu par voie maternelle — avunculat songhay, deux lignees distinctes"
 *     "Oncle parallele paternel — frere du pere"
 *     "Cousins paralleles — enfants de deux freres"
 *
 * Pour les cas a chemins multiples, on ajoute "— deux lignees distinctes",
 * "— trois lignees distinctes", etc.
 */
export function anthroLabel(
  group: RelationGroup,
  genderA: GenderA,
): string {
  const r = group.paths[0];
  const pathCount = group.paths.length;
  const multiSuffix = pathCount > 1
    ? pathCount === 2 ? ' — deux lignées distinctes'
    : pathCount === 3 ? ' — trois lignées distinctes'
    : ` — ${pathCount} lignées distinctes`
    : '';

  const base = kindLabel(r, genderA, group);
  return base + multiSuffix;
}

function kindLabel(r: Relation, genderA: GenderA, group: RelationGroup): string {
  switch (r.kind) {
    case 'direct-descendant':
      return r.distanceB === 1
        ? 'Lien parent-enfant direct'
        : `Ascendant direct à ${r.distanceA + r.distanceB} générations`;
    case 'direct-ascendant':
      return r.distanceA === 1
        ? 'Lien enfant-parent direct'
        : `Descendant direct sur ${r.distanceA + r.distanceB} générations`;
    case 'parallel':
      // Si groupTerm existe, c'est "arrou hinka izey" (cousins de freres)
      // ou "woy hinka izey" (cousines de soeurs).
      if (group.groupTerm?.includes('arrou')) return 'Cousins parallèles — enfants de deux frères';
      if (group.groupTerm?.includes('woy')) return 'Cousines parallèles — enfants de deux sœurs';
      return 'Fratrie parallèle — enfants du même sexe parental';
    case 'cross':
      // groupTerm "hassey-zee n'da hawey-zee" = cousins croises
      return "Cousins croisés — enfants d'un frère et d'une sœur";
    case 'avuncular': {
      const isHassa = r.termForA === 'hassa' || r.termForB === 'hassa';
      const isTouba = r.termForA === 'touba' || r.termForB === 'touba';
      const isHawa = r.termForA === 'hawa' || r.termForB === 'hawa';
      if (isHassa || isTouba) {
        return 'Neveu par voie maternelle — avunculat songhay';
      }
      if (isHawa) {
        return 'Tante paternelle — relation à terme dédié';
      }
      // Oncle/tante parallele (baba / gna)
      if (r.termForA === 'baba' || r.termForB === 'baba') {
        return 'Oncle parallèle paternel — frère du père';
      }
      if (r.termForA === 'gna' || r.termForB === 'gna') {
        return 'Tante parallèle maternelle — sœur de la mère';
      }
      return 'Avunculat — oncle ou tante';
    }
    case 'distant-vertical':
      return genderA === 'M'
        ? 'Grand-oncle ou ascendant latéral éloigné'
        : 'Grand-tante ou ascendante latérale éloignée';
  }
}

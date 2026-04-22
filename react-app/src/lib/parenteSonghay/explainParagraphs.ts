// react-app/src/lib/parenteSonghay/explainParagraphs.ts
import type { Relation } from './types';
import type { RelationGroup } from '../../components/relationship/groupRelations';
import { articleDevant } from '../lineage';

type Labels = Record<string, string>;

export interface ExplainParagraphs {
  /** Regle generale songhay (independant des noms). HTML autorise. */
  rule: string;
  /** Application au cas concret (avec les noms A et B). HTML autorise. */
  application: string;
  /** Encart savant, contexte anthropologique. HTML autorise. */
  savant: string;
}

/**
 * Construit les trois paragraphes de l'accordeon "Comprendre ce lien".
 * Les chaines peuvent contenir du HTML limite : <em> pour les termes songhay,
 * <strong> pour les emphases. Le consommateur utilise dangerouslySetInnerHTML.
 *
 * IMPORTANT : on n'utilise JAMAIS la formulation "il/elle est nomme(e)" —
 * on resout le genre en dur selon le sexe de A au moment du rendu.
 */
export function explainParagraphs(
  group: RelationGroup,
  nameA: string,
  nameB: string,
  genderA: 'M' | 'F',
  _labels: Labels,
): ExplainParagraphs {
  const r = group.paths[0];
  const pathCount = group.paths.length;
  const aEst = genderA === 'F' ? 'elle est nommée' : 'il est nommé';

  const rule = ruleFor(r, group);
  const application = applicationFor(r, group, nameA, nameB, aEst, pathCount);
  const savant = savantFor(r, group, pathCount);

  return { rule, application, savant };
}

function ruleFor(r: Relation, group: RelationGroup): string {
  switch (r.kind) {
    case 'avuncular': {
      const isHassa = r.termForA === 'hassa' || r.termForB === 'hassa';
      const isTouba = r.termForA === 'touba' || r.termForB === 'touba';
      const isHawa = r.termForA === 'hawa' || r.termForB === 'hawa';
      if (isHassa || isTouba) {
        return "En pays songhay, l'oncle maternel — frère de la mère, appelé <em>hassa</em> — occupe une place sociale particulièrement valorisée. Il est à la fois protecteur et confident, souvent consulté pour les décisions importantes concernant ses neveux et nièces. Ce lien est suffisamment fort pour porter un terme dédié dans les deux sens : l'oncle est <em>hassa</em>, le neveu ou la nièce est <em>touba</em>.";
      }
      if (isHawa) {
        return "La tante paternelle, sœur du père, porte en songhay le terme dédié <em>hawa</em>. L'asymétrie du système est remarquable : il existe un mot spécifique pour cette relation, mais pas de terme réciproque distinct pour ses neveux et nièces — qui restent simplement <em>izé</em>, comme les enfants de la fratrie.";
      }
      // Oncle/tante parallèle
      return "Dans la tradition songhay, les frères du père sont appelés par le même terme que le père lui-même : <em>baba</em>. De même, les sœurs de la mère partagent le terme <em>gna</em> avec elle. Leurs enfants sont donc traités comme des frères et sœurs directs, non comme des cousins. C'est la règle dite de <strong>fusion bifurquée</strong>.";
    }
    case 'parallel': {
      if (group.groupTerm?.includes('arrou')) {
        return "Les enfants de deux frères — <em>arrou hinka izey</em> — ne sont pas considérés comme des cousins en pays songhay, mais comme des frères et sœurs. Cette fusion lexicale s'étend à plusieurs générations : les descendants de lignées paternelles parallèles portent les mêmes termes que la fratrie directe.";
      }
      if (group.groupTerm?.includes('woy')) {
        return "Les enfants de deux sœurs — <em>woy hinka izey</em> — forment, dans la vision songhay, une fratrie étendue. La règle de fusion bifurquée, par les mères cette fois, produit les mêmes obligations et termes d'adresse que pour des frères et sœurs au sens strict.";
      }
      return "Les enfants issus de frères ou de sœurs parallèles (parents de même sexe) sont structurellement assimilés à la fratrie en songhay. Ils portent les termes <em>arma</em> (frère) et <em>woyma</em> (sœur), non ceux réservés aux cousins croisés.";
    }
    case 'cross': {
      return "Les enfants issus d'un frère et d'une sœur — <em>hassey-zee n'da hawey-zee</em> — sont des cousins croisés. Le système songhay les distingue rigoureusement de la fratrie parallèle par le terme dédié <em>baassa</em> : <em>baassa arou</em> au masculin, <em>baassa woy</em> au féminin.";
    }
    case 'direct-descendant':
    case 'direct-ascendant': {
      if (r.distanceA + r.distanceB <= 1) {
        return "Le lien parent-enfant direct est le pilier du système de parenté songhay. Le père est <em>baba</em>, la mère <em>gna</em>, l'enfant <em>izé</em>. Ces termes ont une portée quotidienne et rituelle forte.";
      }
      return "Pour les ascendants et descendants éloignés de plusieurs générations, le songhay utilise les racines <em>kaga</em> (grand-parent) et <em>haama</em> (petit-enfant), répétées pour chaque génération supplémentaire et suffixées de <em>coté baba</em> ou <em>coté gna</em> selon la branche.";
    }
    case 'distant-vertical': {
      return "Les relations verticales éloignées — grands-oncles, grandes-tantes, neveux à plusieurs générations — sont exprimées en songhay par un empilement de termes racines (<em>kaga</em> ou <em>haama</em>) répétés et suffixés par la branche empruntée (<em>coté baba</em> ou <em>coté gna</em>).";
    }
  }
}

function applicationFor(
  r: Relation,
  group: RelationGroup,
  nameA: string,
  nameB: string,
  aEst: string,
  pathCount: number,
): string {
  // Cas multi-chemins (2+ lignees distinctes)
  if (pathCount > 1) {
    const ancestors = group.paths
      .map((p) => p.viaSpouse ? `${p.viaName} &amp; ${p.viaSpouse.name}` : p.viaName)
      .map((n) => `<strong>${n}</strong>`);
    const ancestorsList = ancestors.length === 2
      ? `${ancestors[0]} et ${ancestors[1]}`
      : `${ancestors.slice(0, -1).join(', ')} et ${ancestors[ancestors.length - 1]}`;
    const best = group.paths[0];
    const worst = group.paths[group.paths.length - 1];
    return `<strong>${nameA}</strong> et <strong>${nameB}</strong> sont reliés par <strong>${pathCount} lignées distinctes</strong> — via ${ancestorsList}. Le chemin le plus court remonte sur ${best.distanceA + best.distanceB} générations ; le plus long, sur ${worst.distanceA + worst.distanceB}. Dans l'usage quotidien, c'est la relation la plus proche qui prévaut, mais les autres restent valides et renforcent le lien familial.`;
  }

  // Cas simple : un seul chemin
  const viaName = r.viaSpouse ? `${r.viaName} &amp; ${r.viaSpouse.name}` : r.viaName;
  switch (r.kind) {
    case 'avuncular': {
      const isHassa = r.termForA === 'hassa' || r.termForB === 'hassa';
      const isTouba = r.termForA === 'touba' || r.termForB === 'touba';
      if (isHassa || isTouba) {
        return `Selon la règle de l'avunculat songhay, <strong>${nameA}</strong> et <strong>${nameB}</strong> sont reliés via <strong>${viaName}</strong>. ${aEst[0].toUpperCase()}${aEst.slice(1)} <em>${r.termForA}</em> (neveu par l'oncle maternel), et ${nameB} ${articleDevant(nameA) === "d'" ? "d'" : "de "}${nameA} est <em>${r.termForB}</em> (oncle maternel).`;
      }
      return `${nameA} est <em>${r.termForA}</em> ${articleDevant(nameB)}${nameB}, par l'intermédiaire de <strong>${viaName}</strong>.`;
    }
    case 'parallel':
    case 'cross': {
      return `<strong>${nameA}</strong> et <strong>${nameB}</strong> descendent tous deux de <strong>${viaName}</strong> et sont classés par le système songhay comme <em>${r.termForA}</em> / <em>${r.termForB}</em>${group.groupTerm ? ` (<em>${group.groupTerm}</em>)` : ''}.`;
    }
    case 'direct-descendant':
    case 'direct-ascendant':
    case 'distant-vertical': {
      return `<strong>${nameA}</strong> est <em>${r.termForA}</em> ${articleDevant(nameB)}${nameB} à ${r.distanceA + r.distanceB} génération${r.distanceA + r.distanceB > 1 ? 's' : ''} d'écart.`;
    }
  }
}

function savantFor(r: Relation, _group: RelationGroup, pathCount: number): string {
  if (pathCount > 1) {
    return "Quand deux personnes sont liées par plusieurs chemins généalogiques, on dit qu'elles ont une <strong>parenté multiple</strong>. Dans les sociétés à <strong>endogamie de lignage</strong> comme celle des Aly Koïra, cette configuration est fréquente : elle traduit des alliances matrimoniales croisées entre branches d'une même famille étendue.";
  }
  switch (r.kind) {
    case 'avuncular': {
      const isHassa = r.termForA === 'hassa' || r.termForB === 'hassa';
      const isTouba = r.termForA === 'touba' || r.termForB === 'touba';
      const isHawa = r.termForA === 'hawa' || r.termForB === 'hawa';
      if (isHassa || isTouba) {
        return "L'asymétrie entre <em>hassa</em> (oncle maternel à terme dédié) et <em>baba</em> (oncle paternel fusionné avec le père) est la signature des systèmes à <strong>avunculat</strong>, décrits en anthropologie chez de nombreux peuples soudaniens et bantous.";
      }
      if (isHawa) {
        return "La présence du terme <em>hawa</em> sans réciproque dédié côté neveu est un vestige typologique : le système classifie la tante paternelle comme position spéciale, mais laisse ses descendants dans la catégorie large <em>izé</em>.";
      }
      return "Ce principe de <strong>fusion bifurcative</strong> — les parents de même sexe sont « fusionnés » dans un terme unique — est la marque des systèmes classificatoires de type iroquois.";
    }
    case 'parallel':
      return "Les systèmes de parenté à <strong>fusion des lignées parallèles</strong> (tous les frères du père sont <em>baba</em>, toutes les sœurs de la mère sont <em>gna</em>) sont répertoriés depuis Lewis H. Morgan sous le nom de <strong>système iroquois</strong>.";
    case 'cross':
      return "La distinction rigoureuse entre cousins parallèles (fratrie) et cousins croisés (<em>baassa</em>) ouvre historiquement la voie au <strong>mariage préférentiel entre cousins croisés</strong> dans plusieurs sociétés soudaniennes — pratique qu'on retrouve parfois dans la tradition Aly Koïra.";
    default:
      return "Le corpus songhay de parenté repose sur une économie de <strong>racines terminologiques</strong> (<em>baba, gna, izé, arma, woyma, kaga, haama</em>) combinées par empilement et suffixation pour couvrir l'ensemble des positions généalogiques.";
  }
}

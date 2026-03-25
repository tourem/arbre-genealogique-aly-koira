/**
 * Algorithme de Relations Familiales Songhoy - Version Complète
 *
 * Parcours bidirectionnel de l'arbre généalogique :
 * - Ascendants (père, mère)
 * - Descendants (enfants)
 * - Conjoints (époux/épouses)
 *
 * Cas traités :
 * - SPOUSE : Époux/Épouse directe
 * - PARENT : Parent direct (BABA/NIA)
 * - CHILD : Enfant direct (IZE)
 * - SIBLINGS : Fratrie (ARMA/WAYMA/WEYMA)
 * - HALF_SIBLINGS : Demi-fratrie
 * - COUSINS : Cousins (BAASSEY, ARROUHINKAYE, WAYUHINKAYE)
 * - UNCLE_AUNT : Oncle/Tante ↔ Neveu/Nièce
 * - GRANDPARENT : Grands-parents (KAAGA)
 * - IN_LAWS : Beaux-parents, beaux-frères (TCHI/AROUKOY/ITCHEY)
 */

import type {
  Member,
  MemberDict,
  TermsDict,
  CategoriesDict,
  SonghoyRelationResult,
} from './types';

// ═══════════════════════════════════════════════════════════════════
// Types pour le parcours de graphe
// ═══════════════════════════════════════════════════════════════════

type EdgeType = 'FATHER' | 'MOTHER' | 'CHILD' | 'SPOUSE';

interface PathNode {
  memberId: string;
  edgeType: EdgeType | null; // null for starting node
}

interface PathEntry {
  path: PathNode[];
  visited: Set<string>;
}

// ═══════════════════════════════════════════════════════════════════
// Parcours BFS bidirectionnel
// ═══════════════════════════════════════════════════════════════════

/**
 * Trouve les chemins entre personA et personB en remontant aux ancêtres.
 * IMPORTANT: Ne descend JAMAIS vers les enfants - seulement UP (parents) et SPOUSE.
 * Les relations parent/enfant directes sont vérifiées séparément.
 */
function findAncestorPaths(
  startId: string,
  endId: string,
  dict: MemberDict,
  maxDepth: number = 12,
  maxPaths: number = 10,
): PathNode[][] {
  const results: PathNode[][] = [];
  const queue: PathEntry[] = [{
    path: [{ memberId: startId, edgeType: null }],
    visited: new Set([startId]),
  }];

  let iterations = 0;
  const maxIterations = 5000;

  while (queue.length > 0 && results.length < maxPaths && iterations < maxIterations) {
    iterations++;
    const { path, visited } = queue.shift()!;
    const currentId = path[path.length - 1].memberId;
    const current = dict[currentId];

    if (!current) continue;
    if (path.length > maxDepth) continue;

    // Trouvé !
    if (currentId === endId && path.length > 1) {
      results.push([...path]);
      continue;
    }

    // Explorer les voisins : SEULEMENT parents et conjoints (jamais enfants)
    const neighbors: { id: string; edge: EdgeType }[] = [];

    // Parents (ascendants)
    if (current.father_id && dict[current.father_id]) {
      neighbors.push({ id: current.father_id, edge: 'FATHER' });
    }
    if (current.mother_ref && dict[current.mother_ref]) {
      neighbors.push({ id: current.mother_ref, edge: 'MOTHER' });
    }

    // Conjoints (pour les relations par alliance)
    for (const spouseId of current.spouses || []) {
      if (dict[spouseId]) {
        neighbors.push({ id: spouseId, edge: 'SPOUSE' });
      }
    }

    // PAS d'exploration des enfants ici - évite les faux positifs

    for (const { id, edge } of neighbors) {
      if (!visited.has(id) || id === endId) {
        const newVisited = new Set(visited);
        newVisited.add(id);
        queue.push({
          path: [...path, { memberId: id, edgeType: edge }],
          visited: newVisited,
        });
      }
    }
  }

  return results;
}

/**
 * Collecte tous les ancêtres (uniquement ascendants) pour l'algorithme classique.
 * IMPORTANT: On doit explorer TOUS les chemins possibles, même si un ancêtre
 * a déjà été visité par un autre chemin (pour trouver les relations via
 * différentes branches : père ET mère).
 */
function collectAncestors(
  personId: string,
  dict: MemberDict,
  maxDepth: number = 15,
): Map<string, { path: string[] }[]> {
  const result = new Map<string, { path: string[] }[]>();
  result.set(personId, [{ path: [personId] }]);

  const queue: [string, string[]][] = [];
  const person = dict[personId];
  if (!person) return result;

  // Ensemble pour éviter de stocker des chemins IDENTIQUES (pas juste le même ancêtre)
  const seenPaths = new Set<string>();
  seenPaths.add(personId);

  if (person.father_id && dict[person.father_id]) {
    queue.push([person.father_id, [personId, person.father_id]]);
  }
  if (person.mother_ref && dict[person.mother_ref]) {
    queue.push([person.mother_ref, [personId, person.mother_ref]]);
  }

  while (queue.length > 0) {
    const [currentId, path] = queue.shift()!;

    // Limiter la profondeur pour éviter les boucles infinies
    if (path.length > maxDepth) continue;

    // Créer une clé unique pour ce chemin exact (pas juste l'ancêtre)
    const pathKey = path.join('|');
    if (seenPaths.has(pathKey)) continue;
    seenPaths.add(pathKey);

    // Ajouter ce chemin aux entrées de cet ancêtre
    const entries = result.get(currentId) || [];
    entries.push({ path });
    result.set(currentId, entries);

    const current = dict[currentId];
    if (!current) continue;

    // TOUJOURS explorer les parents, même si l'ancêtre a été visité par un autre chemin
    // Cela permet de trouver tous les chemins possibles à travers l'arbre
    if (current.father_id && dict[current.father_id]) {
      queue.push([current.father_id, [...path, current.father_id]]);
    }
    if (current.mother_ref && dict[current.mother_ref]) {
      queue.push([current.mother_ref, [...path, current.mother_ref]]);
    }
  }

  return result;
}


// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function isElderChild(childAId: string, childBId: string, ancestor: Member): boolean {
  const children = ancestor.children || [];
  const idxA = children.indexOf(childAId);
  const idxB = children.indexOf(childBId);
  if (idxA !== -1 && idxB !== -1) return idxA < idxB;
  return false;
}

function isBranchAElder(pathA: string[], pathB: string[], ancestor: Member): boolean {
  if (pathA.length < 2 || pathB.length < 2) return false;
  const paId = pathA[pathA.length - 2];
  const pbId = pathB[pathB.length - 2];
  return isElderChild(paId, pbId, ancestor);
}

function buildKaagaTermCode(gender: 'M' | 'F', niveauKaaga: number): string {
  const prefix = gender === 'M' ? 'KAAGA' : 'KAAGA_WOY';
  if (niveauKaaga === 1) return prefix;
  if (niveauKaaga === 2) return prefix + '_BERI_DJINA';
  if (niveauKaaga === 3) return prefix + '_BERI_HINKATO';
  if (niveauKaaga === 4) return prefix + '_BERI_HINZANTO';
  if (niveauKaaga === 5) return prefix + '_BERI_TAATCHANTO';
  if (niveauKaaga === 6) return prefix + '_BERI_GOUWANTO';
  return prefix + '_BERI_' + niveauKaaga;
}

// ═══════════════════════════════════════════════════════════════════
// Analyse des chemins pour déterminer les relations
// ═══════════════════════════════════════════════════════════════════

interface PathAnalysis {
  type: 'DIRECT_BLOOD' | 'COMMON_ANCESTOR' | 'SPOUSE' | 'IN_LAW';
  commonNode?: string;
  distanceA: number;
  distanceB: number;
  pathA: string[];
  pathB: string[];
  hasSpouseLink: boolean;
  spouseLinkPosition?: 'START' | 'END' | 'MIDDLE';
}

/**
 * Analyse un chemin pour déterminer le type de relation.
 * Note: Les chemins ne contiennent plus d'arêtes CHILD (on remonte seulement).
 */
function analyzePath(path: PathNode[], _dict: MemberDict): PathAnalysis | null {
  if (path.length < 2) return null;

  const personAId = path[0].memberId;
  const personBId = path[path.length - 1].memberId;

  // Chercher les liens de mariage dans le chemin
  const spouseLinks: number[] = [];
  for (let i = 1; i < path.length; i++) {
    if (path[i].edgeType === 'SPOUSE') {
      spouseLinks.push(i);
    }
  }

  const hasSpouseLink = spouseLinks.length > 0;

  // Chemin direct par mariage
  if (path.length === 2 && path[1].edgeType === 'SPOUSE') {
    return {
      type: 'SPOUSE',
      distanceA: 0,
      distanceB: 0,
      pathA: [personAId],
      pathB: [personBId],
      hasSpouseLink: true,
      spouseLinkPosition: 'START',
    };
  }

  // Relation par alliance (in-law)
  if (hasSpouseLink) {
    const spouseIdx = spouseLinks[0];

    // Trouver le point où commence le lien par alliance
    const pathBeforeSpouse = path.slice(0, spouseIdx + 1).map(p => p.memberId);
    const pathAfterSpouse = path.slice(spouseIdx).map(p => p.memberId);

    return {
      type: 'IN_LAW',
      commonNode: path[spouseIdx].memberId,
      distanceA: spouseIdx,
      distanceB: path.length - spouseIdx - 1,
      pathA: pathBeforeSpouse,
      pathB: pathAfterSpouse,
      hasSpouseLink: true,
      spouseLinkPosition: spouseIdx === 1 ? 'START' : spouseIdx === path.length - 1 ? 'END' : 'MIDDLE',
    };
  }

  // Relation de sang via ancêtre commun
  // Comme on ne descend jamais, le dernier nœud FATHER/MOTHER est le "pic"
  let peakIdx = 0;

  for (let i = 1; i < path.length; i++) {
    const edge = path[i].edgeType;
    if (edge === 'FATHER' || edge === 'MOTHER') {
      peakIdx = i;
    }
  }

  const pathA = path.slice(0, peakIdx + 1).map(p => p.memberId);
  const pathB = path.slice(peakIdx).map(p => p.memberId);

  return {
    type: peakIdx === 0 || peakIdx === path.length - 1 ? 'DIRECT_BLOOD' : 'COMMON_ANCESTOR',
    commonNode: path[peakIdx].memberId,
    distanceA: peakIdx,
    distanceB: path.length - peakIdx - 1,
    pathA,
    pathB,
    hasSpouseLink: false,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Fonction principale
// ═══════════════════════════════════════════════════════════════════

export function findSonghoyRelations(
  personAId: string,
  personBId: string,
  dict: MemberDict,
  terms: TermsDict,
  categories: CategoriesDict,
): SonghoyRelationResult[] {
  if (personAId === personBId) return [];

  const origA = dict[personAId];
  const origB = dict[personBId];
  if (!origA || !origB) return [];

  const results: SonghoyRelationResult[] = [];
  const processedRelations = new Set<string>();

  // ═══════════════════════════════════════════════════════════════
  // 1. RELATIONS DIRECTES entre A et B
  // ═══════════════════════════════════════════════════════════════

  // 1a. Époux/Épouse
  const spousesA = origA.spouses || [];
  const spousesB = origB.spouses || [];
  if (spousesA.includes(personBId) || spousesB.includes(personAId)) {
    const cat = categories['SPOUSE'];
    if (cat) {
      const termAtoB = origA.gender === 'M'
        ? terms['KOURNIO'] || null
        : terms['ALAA_YANO'] || null;
      const termBtoA = origB.gender === 'M'
        ? terms['KOURNIO'] || null
        : terms['ALAA_YANO'] || null;
      results.push({
        commonAncestor: origA,
        category: cat,
        termAtoB, termBtoA,
        pathA: [origA], pathB: [origB],
        details: { distanceA: 0, distanceB: 0, labelFr: 'Époux' },
      });
      processedRelations.add('SPOUSE');
    }
  }

  // 1b. A est parent de B (B est enfant de A)
  const childrenA = origA.children || [];
  if (childrenA.includes(personBId) || origB.father_id === personAId || origB.mother_ref === personAId) {
    const cat = categories['PARENT'];
    if (cat && !processedRelations.has('PARENT-A')) {
      const termAtoB = origA.gender === 'M' ? terms['BABA'] || null : terms['NIA'] || null;
      const termBtoA = terms['IZE'] || null;
      results.push({
        commonAncestor: origA,
        category: cat,
        termAtoB, termBtoA,
        pathA: [origA], pathB: [origB],
        details: { distanceA: 0, distanceB: 1, labelFr: origA.gender === 'M' ? 'Père' : 'Mère' },
      });
      processedRelations.add('PARENT-A');
    }
  }

  // 1c. B est parent de A (A est enfant de B)
  const childrenB = origB.children || [];
  if (childrenB.includes(personAId) || origA.father_id === personBId || origA.mother_ref === personBId) {
    const cat = categories['PARENT'];
    if (cat && !processedRelations.has('PARENT-B')) {
      const termAtoB = terms['IZE'] || null;
      const termBtoA = origB.gender === 'M' ? terms['BABA'] || null : terms['NIA'] || null;
      results.push({
        commonAncestor: origB,
        category: cat,
        termAtoB, termBtoA,
        pathA: [origA], pathB: [origB],
        details: { distanceA: 1, distanceB: 0, labelFr: 'Enfant' },
      });
      processedRelations.add('PARENT-B');
    }
  }

  // 1d. Frères/Sœurs (mêmes parents)
  const samefather = origA.father_id && origA.father_id === origB.father_id;
  const sameMother = origA.mother_ref && origA.mother_ref === origB.mother_ref;
  if (samefather || sameMother) {
    const isHalf = (samefather && !sameMother) || (!samefather && sameMother);
    const catCode = isHalf ? 'HALF_SIBLINGS' : 'SIBLINGS';
    const cat = categories[catCode];
    if (cat && !processedRelations.has('SIBLINGS')) {
      let termCodeAtoB: string;
      let termCodeBtoA: string;

      if (origA.gender === 'M' && origB.gender === 'M') {
        termCodeAtoB = 'ARMA';
        termCodeBtoA = 'ARMA';
      } else if (origA.gender === 'M' && origB.gender === 'F') {
        termCodeAtoB = 'ARMA';
        termCodeBtoA = 'WAYMA';
      } else if (origA.gender === 'F' && origB.gender === 'M') {
        termCodeAtoB = 'WAYMA';
        termCodeBtoA = 'ARMA';
      } else {
        termCodeAtoB = 'WEYMA';
        termCodeBtoA = 'WEYMA';
      }

      const ancestor = dict[origA.father_id || origA.mother_ref || ''];
      results.push({
        commonAncestor: ancestor || origA,
        category: cat,
        termAtoB: terms[termCodeAtoB] || null,
        termBtoA: terms[termCodeBtoA] || null,
        pathA: [origA], pathB: [origB],
        details: { distanceA: 1, distanceB: 1, labelFr: isHalf ? 'Demi-fratrie' : 'Fratrie' },
      });
      processedRelations.add('SIBLINGS');
    }
  }

  // 1e. Beau-frère/Belle-sœur (sibling-in-law)
  // A est marié(e) à un frère/sœur de B, ou B est marié(e) à un frère/sœur de A
  if (!processedRelations.has('SIBLING_IN_LAW')) {
    // Vérifier si A est le conjoint d'un frère/sœur de B
    for (const spouseId of spousesA) {
      const spouse = dict[spouseId];
      if (!spouse) continue;
      const spouseSameFather = spouse.father_id && spouse.father_id === origB.father_id;
      const spouseSameMother = spouse.mother_ref && spouse.mother_ref === origB.mother_ref;
      if (spouseSameFather || spouseSameMother) {
        const cat = categories['SIBLING_IN_LAW'] || categories['IN_LAWS'];
        if (cat) {
          results.push({
            commonAncestor: spouse,
            category: cat,
            termAtoB: terms['ITCHEY'] || null,
            termBtoA: terms['ITCHEY'] || null,
            pathA: [origA, spouse], pathB: [origB],
            details: { distanceA: 1, distanceB: 1, labelFr: 'Beau-frère/Belle-sœur (ITCHEY)' },
          });
          processedRelations.add('SIBLING_IN_LAW');
          break;
        }
      }
    }

    // Vérifier si B est le conjoint d'un frère/sœur de A
    if (!processedRelations.has('SIBLING_IN_LAW')) {
      for (const spouseId of spousesB) {
        const spouse = dict[spouseId];
        if (!spouse) continue;
        const spouseSameFather = spouse.father_id && spouse.father_id === origA.father_id;
        const spouseSameMother = spouse.mother_ref && spouse.mother_ref === origA.mother_ref;
        if (spouseSameFather || spouseSameMother) {
          const cat = categories['SIBLING_IN_LAW'] || categories['IN_LAWS'];
          if (cat) {
            results.push({
              commonAncestor: spouse,
              category: cat,
              termAtoB: terms['ITCHEY'] || null,
              termBtoA: terms['ITCHEY'] || null,
              pathA: [origA], pathB: [spouse, origB],
              details: { distanceA: 1, distanceB: 1, labelFr: 'Beau-frère/Belle-sœur (ITCHEY)' },
            });
            processedRelations.add('SIBLING_IN_LAW');
            break;
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. Trouver les chemins en REMONTANT aux ancêtres (jamais descendre)
  // ═══════════════════════════════════════════════════════════════
  const allPaths = findAncestorPaths(personAId, personBId, dict, 12, 10);

  // ═══════════════════════════════════════════════════════════════
  // 3. Analyser chaque chemin et déterminer la relation
  // ═══════════════════════════════════════════════════════════════
  for (const path of allPaths) {
    const analysis = analyzePath(path, dict);
    if (!analysis) continue;

    // Éviter les doublons
    const relationKey = `${analysis.type}-${analysis.commonNode || 'direct'}-${analysis.distanceA}-${analysis.distanceB}`;
    if (processedRelations.has(relationKey)) continue;
    processedRelations.add(relationKey);

    // Skip spouse (déjà traité)
    if (analysis.type === 'SPOUSE') continue;

    // Traiter selon le type
    if (analysis.type === 'IN_LAW') {
      const result = processInLawRelation(analysis, origA, origB, dict, terms, categories);
      if (result) results.push(result);
    } else {
      const result = processBloodRelation(analysis, origA, origB, dict, terms, categories);
      if (result) results.push(result);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. TOUJOURS explorer via ancêtres communs (toutes les branches)
  // Ceci garantit qu'on trouve les relations via père ET mère des deux côtés
  // ═══════════════════════════════════════════════════════════════
  const classicResults = findRelationsViaCommonAncestors(
    personAId, personBId, dict, terms, categories
  );
  for (const r of classicResults) {
    const key = `${r.category.code}-${r.commonAncestor.id}`;
    if (!processedRelations.has(key)) {
      results.push(r);
      processedRelations.add(key);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. Explorer les 4 combinaisons de parents (père/mère de A ↔ père/mère de B)
  // Ceci permet de trouver des relations via les liens entre parents
  // ═══════════════════════════════════════════════════════════════
  const parentCombinationResults = findRelationsViaParentCombinations(
    origA, origB, dict, terms, categories
  );
  for (const r of parentCombinationResults) {
    const key = `${r.category.code}-${r.commonAncestor?.id || 'parent'}-${r.details.distanceA}-${r.details.distanceB}`;
    if (!processedRelations.has(key)) {
      results.push(r);
      processedRelations.add(key);
    }
  }

  // Note: Les relations grands-parents/petits-enfants sont trouvées via
  // findRelationsViaCommonAncestors (section 4) en remontant aux ancêtres
  // des deux côtés. Pas besoin de descendre aux enfants.

  // Trier par distance totale (plus proche d'abord)
  results.sort((a, b) =>
    (a.details.distanceA + a.details.distanceB) - (b.details.distanceA + b.details.distanceB)
  );

  // Dédupliquer : garder les relations si les ancêtres communs ou chemins sont différents
  // On peut avoir BAASSEY deux fois si les branches passent par des ancêtres différents
  const seenRelations = new Set<string>();
  const dedupedResults: SonghoyRelationResult[] = [];

  for (const r of results) {
    // Clé unique : catégorie + ancêtre commun + distances
    // Ainsi, on garde plusieurs BAASSEY si les ancêtres sont différents
    const relationKey = [
      r.category.code,
      r.commonAncestor?.id || 'direct',
      r.details.distanceA,
      r.details.distanceB,
    ].join('|');

    if (seenRelations.has(relationKey)) {
      continue;
    }

    seenRelations.add(relationKey);
    dedupedResults.push(r);
  }

  return dedupedResults;
}

// ═══════════════════════════════════════════════════════════════════
// Traitement des relations par alliance (beaux-parents, etc.)
// ═══════════════════════════════════════════════════════════════════

function processInLawRelation(
  analysis: PathAnalysis,
  origA: Member,
  origB: Member,
  dict: MemberDict,
  terms: TermsDict,
  categories: CategoriesDict,
): SonghoyRelationResult | null {
  const { distanceA, distanceB, pathA, pathB } = analysis;

  let catCode = 'IN_LAWS';
  let termCodeAtoB: string | null = null;
  let termCodeBtoA: string | null = null;
  let labelFr = 'Alliance';

  // Beau-parent : conjoint du parent
  if (distanceA === 0 && distanceB === 1) {
    // A est le conjoint, B est l'enfant du conjoint
    catCode = 'STEP_PARENT';
    termCodeAtoB = origA.gender === 'M' ? 'TCHI' : 'AROUKOY';
    termCodeBtoA = 'IZE';
    labelFr = origA.gender === 'M' ? 'Beau-père (TCHI)' : 'Belle-mère (AROUKOY)';
  }
  // Parent du conjoint
  else if (distanceA === 1 && distanceB === 0) {
    catCode = 'PARENT_IN_LAW';
    termCodeAtoB = 'IZE'; // Le gendre/belle-fille
    termCodeBtoA = origB.gender === 'M' ? 'TCHI' : 'AROUKOY';
    labelFr = origB.gender === 'M' ? 'Beau-père (TCHI)' : 'Belle-mère (AROUKOY)';
  }
  // Frère/sœur du conjoint (beau-frère/belle-sœur)
  else if (analysis.spouseLinkPosition === 'START' && distanceB === 1) {
    catCode = 'SIBLING_IN_LAW';
    termCodeAtoB = 'ITCHEY';
    termCodeBtoA = 'ITCHEY';
    labelFr = 'Beau-frère/Belle-sœur (ITCHEY)';
  }
  // Conjoint du frère/sœur
  else if (analysis.spouseLinkPosition === 'END' && distanceA === 1) {
    catCode = 'SIBLING_IN_LAW';
    termCodeAtoB = 'ITCHEY';
    termCodeBtoA = 'ITCHEY';
    labelFr = 'Beau-frère/Belle-sœur (ITCHEY)';
  }

  const cat = categories[catCode] || categories['IN_LAWS'];
  if (!cat) return null;

  return {
    commonAncestor: dict[pathA[pathA.length - 1]] || origA,
    category: cat,
    termAtoB: termCodeAtoB ? terms[termCodeAtoB] || null : null,
    termBtoA: termCodeBtoA ? terms[termCodeBtoA] || null : null,
    pathA: pathA.map(id => dict[id]).filter(Boolean),
    pathB: pathB.map(id => dict[id]).filter(Boolean),
    details: { distanceA, distanceB, labelFr },
  };
}

// ═══════════════════════════════════════════════════════════════════
// Traitement des relations de sang via chemins
// ═══════════════════════════════════════════════════════════════════

function processBloodRelation(
  analysis: PathAnalysis,
  origA: Member,
  origB: Member,
  dict: MemberDict,
  terms: TermsDict,
  categories: CategoriesDict,
): SonghoyRelationResult | null {
  const { commonNode, distanceA, distanceB, pathA, pathB } = analysis;

  if (!commonNode) return null;
  const ancestor = dict[commonNode];
  if (!ancestor) return null;

  // Déléguer à la logique classique
  return processClassicRelation(
    ancestor, distanceA, distanceB,
    pathA, pathB,
    origA, origB, dict, terms, categories
  );
}

// ═══════════════════════════════════════════════════════════════════
// Méthode classique via ancêtres communs (original algorithm)
// ═══════════════════════════════════════════════════════════════════

function findRelationsViaCommonAncestors(
  personAId: string,
  personBId: string,
  dict: MemberDict,
  terms: TermsDict,
  categories: CategoriesDict,
): SonghoyRelationResult[] {
  const origA = dict[personAId];
  const origB = dict[personBId];
  if (!origA || !origB) return [];

  const ancestorsA = collectAncestors(personAId, dict);
  const ancestorsB = collectAncestors(personBId, dict);

  const commonIds = new Set<string>();
  for (const [id] of ancestorsA) {
    if (ancestorsB.has(id)) {
      commonIds.add(id);
    }
  }

  const results: SonghoyRelationResult[] = [];
  const seenPathCombinations = new Set<string>();

  for (const ancestorId of commonIds) {
    const ancestor = dict[ancestorId];
    if (!ancestor) continue;

    const entriesA = ancestorsA.get(ancestorId)!;
    const entriesB = ancestorsB.get(ancestorId)!;

    // Traiter TOUTES les combinaisons de chemins, pas seulement le plus court
    // Cela permet de montrer les relations via différentes branches (père ET mère)
    for (const entryA of entriesA) {
      for (const entryB of entriesB) {
        const pathA = entryA.path;
        const pathB = entryB.path;
        const distA = pathA.length - 1;
        const distB = pathB.length - 1;

        if (distA === 0 && distB === 0) continue;

        // Éviter les chemins qui passent par le même parent immédiat
        const paId = distA >= 1 ? pathA[pathA.length - 2] : null;
        const pbId = distB >= 1 ? pathB[pathB.length - 2] : null;
        if (paId && pbId && paId === pbId) continue;

        // Identifier la branche utilisée (2e élément du chemin = père ou mère immédiat)
        const branchA = pathA.length > 1 ? pathA[1] : 'self';
        const branchB = pathB.length > 1 ? pathB[1] : 'self';
        const pathKey = `${ancestorId}|${branchA}|${branchB}`;

        // Éviter les doublons de combinaison branche/ancêtre
        if (seenPathCombinations.has(pathKey)) continue;
        seenPathCombinations.add(pathKey);

        const result = processClassicRelation(
          ancestor, distA, distB,
          pathA, pathB,
          origA, origB, dict, terms, categories
        );

        if (result) results.push(result);
      }
    }
  }

  return results;
}

/**
 * Explore les 4 combinaisons de relations parent-à-parent :
 * 1. Père de A ↔ Père de B
 * 2. Père de A ↔ Mère de B
 * 3. Mère de A ↔ Père de B
 * 4. Mère de A ↔ Mère de B
 *
 * Pour chaque combinaison où les deux parents existent et sont liés,
 * on dérive une relation entre A et B avec distances ajustées (+1 pour chaque).
 */
function findRelationsViaParentCombinations(
  origA: Member,
  origB: Member,
  dict: MemberDict,
  terms: TermsDict,
  categories: CategoriesDict,
): SonghoyRelationResult[] {
  const results: SonghoyRelationResult[] = [];
  const seenCombinations = new Set<string>();

  // Parents de A
  const fatherA = origA.father_id ? dict[origA.father_id] : null;
  const motherA = origA.mother_ref ? dict[origA.mother_ref] : null;

  // Parents de B
  const fatherB = origB.father_id ? dict[origB.father_id] : null;
  const motherB = origB.mother_ref ? dict[origB.mother_ref] : null;

  // Les 4 combinaisons à explorer
  const combinations: [Member | null, Member | null, string, string][] = [
    [fatherA, fatherB, 'père', 'père'],
    [fatherA, motherB, 'père', 'mère'],
    [motherA, fatherB, 'mère', 'père'],
    [motherA, motherB, 'mère', 'mère'],
  ];

  for (const [parentA, parentB, typeA, typeB] of combinations) {
    if (!parentA || !parentB) continue;
    if (parentA.id === parentB.id) continue; // Même parent = déjà traité par fratrie

    // Trouver les relations entre ces deux parents
    const ancestorsPA = collectAncestors(parentA.id, dict);
    const ancestorsPB = collectAncestors(parentB.id, dict);

    // Trouver les ancêtres communs entre les parents
    const commonIds: string[] = [];
    for (const [id] of ancestorsPA) {
      if (ancestorsPB.has(id)) {
        commonIds.push(id);
      }
    }

    for (const ancestorId of commonIds) {
      const ancestor = dict[ancestorId];
      if (!ancestor) continue;

      const entriesPA = ancestorsPA.get(ancestorId)!;
      const entriesPB = ancestorsPB.get(ancestorId)!;

      // Prendre le chemin le plus court pour chaque parent
      const entryPA = entriesPA.reduce((a, b) =>
        a.path.length <= b.path.length ? a : b
      );
      const entryPB = entriesPB.reduce((a, b) =>
        a.path.length <= b.path.length ? a : b
      );

      const distPA = entryPA.path.length - 1;
      const distPB = entryPB.path.length - 1;

      // Distance depuis A et B = distance du parent + 1
      const distA = distPA + 1;
      const distB = distPB + 1;

      // Éviter doublons
      const comboKey = `${ancestorId}|${distA}|${distB}|${typeA}|${typeB}`;
      if (seenCombinations.has(comboKey)) continue;
      seenCombinations.add(comboKey);

      // Construire les chemins complets (A → parent → ... → ancêtre)
      const pathA = [origA.id, ...entryPA.path];
      const pathB = [origB.id, ...entryPB.path];

      // Traiter cette relation
      const result = processClassicRelation(
        ancestor, distA, distB,
        pathA, pathB,
        origA, origB, dict, terms, categories
      );

      if (result) {
        // Ajouter info sur la combinaison de parents utilisée
        result.details.labelFr += ` (via ${typeA} de A ↔ ${typeB} de B)`;
        results.push(result);
      }
    }
  }

  return results;
}

function processClassicRelation(
  ancestor: Member,
  distA: number,
  distB: number,
  pathA: string[],
  pathB: string[],
  origA: Member,
  origB: Member,
  dict: MemberDict,
  terms: TermsDict,
  categories: CategoriesDict,
): SonghoyRelationResult | null {
  let swapped = false;
  let personA = origA;
  let personB = origB;

  // IMPORTANT: Le NIVEAU dans l'arbre = DISTANCE depuis l'ancêtre commun
  //
  // Exemple : Ancêtre → ... → Leilatou → Mahamadou
  //           Ancêtre → ... → Sarata → Hdiaratou
  //
  // Si distA (Mahamadou) = 7 et distB (Hdiaratou) = 7 → même niveau → COUSINS
  // Si distA = 6 et distB = 7 → niveaux différents (diff=1) → ONCLE/NEVEU
  //
  // distA et distB représentent le nombre de "sauts" depuis l'ancêtre commun

  // Normaliser pour que distA <= distB (personA est plus proche de l'ancêtre ou égal)
  if (distA > distB) {
    swapped = true;
    [personA, personB] = [personB, personA];
    [pathA, pathB] = [pathB, pathA];
    [distA, distB] = [distB, distA];
  }

  // La différence de niveau = différence de distance depuis l'ancêtre commun
  const diff = distB - distA;

  const pa = distA >= 1 ? dict[pathA[pathA.length - 2]] : null;
  const pb = distB >= 1 ? dict[pathB[pathB.length - 2]] : null;

  let catCode = '';
  let termCodeAtoB: string | null = null;
  let termCodeBtoA: string | null = null;
  let additionalTermCodeAtoB: string | null = null;
  let additionalTermCodeBtoA: string | null = null;
  let labelFr = '';

  // ÉTAPE 0 : Relation directe
  if (distA === 0) {
    if (distB === 1) {
      catCode = 'PARENT';
      termCodeAtoB = personA.gender === 'M' ? 'BABA' : 'NIA';
      termCodeBtoA = 'IZE';
      labelFr = personA.gender === 'M' ? 'Père' : 'Mère';
    } else {
      catCode = 'GRANDPARENT';
      const niveauKaaga = distB - 1;
      termCodeAtoB = buildKaagaTermCode(personA.gender, niveauKaaga);
      termCodeBtoA = 'HAAMA';
      const termObj = terms[termCodeAtoB];
      labelFr = termObj ? termObj.label_fr : `Ancêtre de niveau ${niveauKaaga}`;
    }
  }
  // CAS 1 : Fratrie
  else if (distA === 1 && distB === 1) {
    const isHalf = personA.father_id === personB.father_id &&
                   personA.mother_ref !== personB.mother_ref &&
                   personA.father_id !== null;

    catCode = isHalf ? 'HALF_SIBLINGS' : 'SIBLINGS';
    labelFr = isHalf ? 'Demi-fratrie — BABA FO IZAYES' : 'Fratrie';

    if (personA.gender === 'M' && personB.gender === 'M') {
      termCodeAtoB = 'ARMA';
      termCodeBtoA = 'ARMA';
    } else if (personA.gender === 'M' && personB.gender === 'F') {
      termCodeAtoB = 'ARMA';
      termCodeBtoA = 'WAYMA';
    } else if (personA.gender === 'F' && personB.gender === 'M') {
      termCodeAtoB = 'WAYMA';
      termCodeBtoA = 'ARMA';
    } else {
      termCodeAtoB = 'WEYMA';
      termCodeBtoA = 'WEYMA';
    }
  }
  // CAS 2 : Cousins - même distance depuis l'ancêtre commun (même niveau dans l'arbre)
  // distA === distB signifie que A et B sont au même niveau
  // distA > 1 pour exclure la fratrie directe (qui serait distA = distB = 1)
  else if (distA === distB && distA > 1) {
    if (!pa || !pb) return null;

    const parentA = dict[pathA[1]];
    const parentB = dict[pathB[1]];
    const sexParentA = parentA?.gender || pa.gender;
    const sexParentB = parentB?.gender || pb.gender;

    // Calculer le degré de cousinage
    const cousinDegree = distA - 1;
    const degreeSuffix = cousinDegree > 1 ? ` (${cousinDegree}e degré)` : '';

    if (sexParentA === 'M' && sexParentB === 'M') {
      catCode = 'COUSINS_PATRI';
      labelFr = `Cousins patrilatéraux — ARROUHINKAYE IZAY${degreeSuffix}`;

      if (personA.gender === 'M' && personB.gender === 'F') {
        termCodeAtoB = 'ARMA';
        termCodeBtoA = 'WAYMA';
      } else if (personA.gender === 'F' && personB.gender === 'M') {
        termCodeAtoB = 'WAYMA';
        termCodeBtoA = 'ARMA';
      } else if (personA.gender === 'F' && personB.gender === 'F') {
        termCodeAtoB = 'WEYMA';
        termCodeBtoA = 'WEYMA';
      } else {
        termCodeAtoB = 'ARMA';
        termCodeBtoA = 'ARMA';
      }
    } else if (sexParentA === 'F' && sexParentB === 'F') {
      catCode = 'COUSINS_MATRI';
      labelFr = `Cousins matrilatéraux — WAYUHINKAYE IZAY${degreeSuffix}`;

      // Termes principaux : ARMA/WEYMA selon le genre (comme la fratrie)
      if (personA.gender === 'M' && personB.gender === 'F') {
        termCodeAtoB = 'ARMA';
        termCodeBtoA = 'WAYMA';
      } else if (personA.gender === 'F' && personB.gender === 'M') {
        termCodeAtoB = 'WAYMA';
        termCodeBtoA = 'ARMA';
      } else if (personA.gender === 'F' && personB.gender === 'F') {
        termCodeAtoB = 'WEYMA';
        termCodeBtoA = 'WEYMA';
      } else {
        termCodeAtoB = 'ARMA';
        termCodeBtoA = 'ARMA';
      }
      // NIA BERO/NIA KEYNA sont réservés aux TANTES, pas aux cousines
    } else {
      catCode = 'COUSINS_CROSS';
      labelFr = `Cousins croisés — BAASSEY${degreeSuffix}`;
      termCodeAtoB = personA.gender === 'F' ? 'BAASSA_WOYO' : 'BAASSARO';
      termCodeBtoA = personB.gender === 'F' ? 'BAASSA_WOYO' : 'BAASSARO';
    }
  }
  // CAS 3 : Générations différentes (diff >= 1)
  // personA est plus proche de l'ancêtre (oncle/tante ou grand-parent)
  // personB est plus éloigné (neveu/nièce ou petit-enfant)
  //
  // IMPORTANT: BAASSEY (cousins croisés) est UNIQUEMENT pour les personnes
  // au MÊME niveau dans l'arbre. Si diff >= 1, c'est une relation
  // oncle/tante ↔ neveu/nièce, PAS des cousins.
  else {
    // Pour déterminer si la relation est paternelle ou maternelle,
    // on regarde l'enfant DIRECT de l'ancêtre commun dans le chemin de B
    const ancestorChildInPathB = pathB.length >= 2 ? dict[pathB[pathB.length - 2]] : null;

    // Le genre de la branche de B détermine si c'est paternel ou maternel
    const branchBGender = ancestorChildInPathB?.gender;

    // Pour l'oncle/tante de B, c'est la branche de B qui détermine paternel/maternel
    // (car c'est via le père ou la mère de la lignée de B)
    const isMaternalForB = branchBGender === 'F';

    const nbSideIsElder = !isBranchAElder(pathA, pathB, ancestor);

    if (diff === 1) {
      // Oncle/Tante ↔ Neveu/Nièce
      // diff === 1 signifie que A est au niveau n, B est au niveau n+1
      // Donc A est comme un(e) oncle/tante pour B

      catCode = 'UNCLE_AUNT';

      if (isMaternalForB) {
        // Connexion maternelle (branche de B via une femme)
        if (personA.gender === 'M') {
          // Homme oncle maternel = HASSA
          termCodeAtoB = 'HASSA';
          termCodeBtoA = 'TOUBA';
          labelFr = 'Oncle maternel — HASSA';
        } else {
          // Femme tante maternelle = NIA BERO/NIA KEYNA selon aînesse
          termCodeAtoB = nbSideIsElder ? 'NIAN_KEYNA_AUNT' : 'NIAN_BERO_AUNT';
          labelFr = nbSideIsElder ? 'Tante maternelle cadette — NIA KEYNA' : 'Tante maternelle aînée — NIA BERO';
          termCodeBtoA = 'IZE';
        }
      } else {
        // Connexion paternelle (branche de B via un homme)
        if (personA.gender === 'M') {
          // Homme oncle paternel = BABA BERO/BABA KATCHA selon aînesse
          termCodeAtoB = nbSideIsElder ? 'BABA_KATCHA_UNCLE' : 'BABA_BERO_UNCLE';
          labelFr = nbSideIsElder ? 'Oncle paternel cadet — BABA KATCHA' : 'Oncle paternel aîné — BABA BERO';
          termCodeBtoA = 'IZE';
        } else {
          // Femme tante paternelle = HAWA
          termCodeAtoB = 'HAWA';
          termCodeBtoA = 'IZE';
          labelFr = 'Tante paternelle — HAWA';
        }
      }
    } else {
      // Grand-parent ou ancêtre plus lointain (genDiff > 1)
      catCode = 'GRANDPARENT';
      const niveauKaaga = diff - 1;
      termCodeAtoB = buildKaagaTermCode(personA.gender, niveauKaaga);
      termCodeBtoA = 'HAAMA';
      const termObj = terms[termCodeAtoB];
      labelFr = termObj ? termObj.label_fr : `Ancêtre de niveau ${niveauKaaga}`;
    }
  }

  const cat = categories[catCode];
  if (!cat) return null;

  let termAtoB = termCodeAtoB ? terms[termCodeAtoB] || null : null;
  let termBtoA = termCodeBtoA ? terms[termCodeBtoA] || null : null;
  let additionalTermAtoB = additionalTermCodeAtoB ? terms[additionalTermCodeAtoB] || null : null;
  let additionalTermBtoA = additionalTermCodeBtoA ? terms[additionalTermCodeBtoA] || null : null;

  if (swapped) {
    [termAtoB, termBtoA] = [termBtoA, termAtoB];
    [additionalTermAtoB, additionalTermBtoA] = [additionalTermBtoA, additionalTermAtoB];
    [pathA, pathB] = [pathB, pathA];
    [distA, distB] = [distB, distA];
  }

  const pathAMembers = pathA.map(id => dict[id]).filter(Boolean);
  const pathBMembers = pathB.map(id => dict[id]).filter(Boolean);

  const result: SonghoyRelationResult = {
    commonAncestor: ancestor,
    category: cat,
    termAtoB,
    termBtoA,
    pathA: pathAMembers,
    pathB: pathBMembers,
    details: { distanceA: distA, distanceB: distB, labelFr },
  };

  if (additionalTermAtoB || additionalTermBtoA) {
    result.additionalTermAtoB = additionalTermAtoB;
    result.additionalTermBtoA = additionalTermBtoA;
  }

  return result;
}

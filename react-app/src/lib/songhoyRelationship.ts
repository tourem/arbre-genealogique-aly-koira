/**
 * Algorithme de Relations Familiales Songhoy
 * Reference : algorithme-relations-songhoy.md
 *
 * ÉTAPE 0 : Relation directe (distA = 0) — BABA / NIA / KAAGA
 * CAS 1 : Fratrie (niveauA = niveauB = 1) — ARMA / WAYMA / WEYMA
 * CAS 2 : Cousins (niveauA = niveauB > 1) — parents directs de A/B determines type
 * CAS 3a: Oncle/Tante (diff = 1) — A.sex + NB.sex determines term
 * CAS 3b: Grand-parent (diff >= 2) — KAAGA levels
 */

import type {
  Member,
  MemberDict,
  TermsDict,
  CategoriesDict,
  SonghoyRelationResult,
} from './types';

// ---- BFS ancestor collection ----

interface AncestorEntry {
  path: string[]; // IDs from person up to ancestor: [personId, ..., ancestorId]
}

/**
 * Collect all ancestors of a person via BFS.
 * Returns Map<ancestorId, AncestorEntry[]> (multiple paths possible).
 */
function collectAncestors(
  personId: string,
  dict: MemberDict,
): Map<string, AncestorEntry[]> {
  const result = new Map<string, AncestorEntry[]>();

  // Person is their own "ancestor" at distance 0
  result.set(personId, [{ path: [personId] }]);

  const queue: [string, string[]][] = []; // [currentId, pathSoFar]
  const visited = new Set<string>([personId]);

  const person = dict[personId];
  if (!person) return result;

  // Seed with parents
  if (person.father_id && dict[person.father_id]) {
    queue.push([person.father_id, [personId, person.father_id]]);
  }
  if (person.mother_ref && dict[person.mother_ref]) {
    queue.push([person.mother_ref, [personId, person.mother_ref]]);
  }

  while (queue.length > 0) {
    const [currentId, path] = queue.shift()!;

    const entries = result.get(currentId) || [];
    entries.push({ path });
    result.set(currentId, entries);

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const current = dict[currentId];
    if (!current) continue;

    if (current.father_id && dict[current.father_id]) {
      queue.push([current.father_id, [...path, current.father_id]]);
    }
    if (current.mother_ref && dict[current.mother_ref]) {
      queue.push([current.mother_ref, [...path, current.mother_ref]]);
    }
  }

  return result;
}

// ---- Elder heuristic ----

/**
 * Determine if childA appears before childB in ancestor's children array.
 * Returns true if childA is elder (appears first).
 */
function isElderChild(
  childAId: string,
  childBId: string,
  ancestor: Member,
): boolean {
  const children = ancestor.children || [];
  const idxA = children.indexOf(childAId);
  const idxB = children.indexOf(childBId);
  if (idxA !== -1 && idxB !== -1) {
    return idxA < idxB;
  }
  return false;
}

/**
 * Compare which branch is elder by looking at the direct children of ancestor
 * on each path (PA and PB).
 */
function isBranchAElder(
  pathA: string[],
  pathB: string[],
  ancestor: Member,
): boolean {
  if (pathA.length < 2 || pathB.length < 2) return false;
  const paId = pathA[pathA.length - 2];
  const pbId = pathB[pathB.length - 2];
  return isElderChild(paId, pbId, ancestor);
}

// ---- KAAGA level term code builder ----

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

// ---- Main function ----

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

  const ancestorsA = collectAncestors(personAId, dict);
  const ancestorsB = collectAncestors(personBId, dict);

  // Find common ancestors
  const commonIds = new Set<string>();
  for (const [id] of ancestorsA) {
    if (ancestorsB.has(id)) {
      commonIds.add(id);
    }
  }

  const results: SonghoyRelationResult[] = [];

  // ═══════════════════════════════════════════════
  // Détection époux / épouse AVANT les ancêtres
  // ═══════════════════════════════════════════════
  const spousesA = origA.spouses || [];
  if (spousesA.includes(personBId)) {
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
    }
  }

  if (commonIds.size === 0) return results;

  for (const ancestorId of commonIds) {
    const ancestor = dict[ancestorId];
    if (!ancestor) continue;

    const entriesA = ancestorsA.get(ancestorId)!;
    const entriesB = ancestorsB.get(ancestorId)!;

    // Use shortest paths
    const bestA = entriesA.reduce((a, b) =>
      a.path.length <= b.path.length ? a : b,
    );
    const bestB = entriesB.reduce((a, b) =>
      a.path.length <= b.path.length ? a : b,
    );

    let pathA = bestA.path;
    let pathB = bestB.path;
    let distA = pathA.length - 1;
    let distB = pathB.length - 1;

    // Skip distance 0 on both sides (same person)
    if (distA === 0 && distB === 0) continue;

    // Get PA and PB (branch nodes = children of ancestor on each side)
    // path = [personId, ..., PA, ancestorId], so PA = path[path.length - 2]
    const paId = distA >= 1 ? pathA[pathA.length - 2] : null;
    const pbId = distB >= 1 ? pathB[pathB.length - 2] : null;

    // Skip if same branch (would be handled by a more recent common ancestor)
    if (paId && pbId && paId === pbId) continue;

    // Normalize: A is always the closer one (lower distance)
    let swapped = false;
    let personA = origA;
    let personB = origB;

    if (distA > distB) {
      swapped = true;
      [personA, personB] = [personB, personA];
      [pathA, pathB] = [pathB, pathA];
      [distA, distB] = [distB, distA];
    }

    const diff = distB - distA;

    // Get PA/PB after potential swap
    const pa = distA >= 1 ? dict[pathA[pathA.length - 2]] : null;
    const pb = distB >= 1 ? dict[pathB[pathB.length - 2]] : null;

    let catCode: string = '';
    let termCodeAtoB: string | null = null;
    let termCodeBtoA: string | null = null;
    let additionalTermCodeAtoB: string | null = null;
    let additionalTermCodeBtoA: string | null = null;
    let labelFr = '';

    // ═══════════════════════════════════════════════
    // ÉTAPE 0 : RELATION DIRECTE (distA = 0)
    // A est l'ancetre lui-meme (parent ou grand-parent direct)
    // ═══════════════════════════════════════════════
    if (distA === 0) {
      if (distB === 1) {
        // Parent direct
        catCode = 'PARENT';
        if (personA.gender === 'M') {
          termCodeAtoB = 'BABA';
          labelFr = 'Pere';
        } else {
          termCodeAtoB = 'NIA';
          labelFr = 'Mere';
        }
        termCodeBtoA = 'IZE';
      } else {
        // Grand-parent direct (distB >= 2)
        catCode = 'GRANDPARENT';
        const niveauKaaga = distB - 1;
        const termCode = buildKaagaTermCode(personA.gender, niveauKaaga);
        termCodeAtoB = termCode;
        termCodeBtoA = 'HAAMA';
        const termObj = terms[termCode];
        labelFr = termObj
          ? termObj.label_fr
          : `Ancetre de niveau ${niveauKaaga}`;
      }
    }

    // ═══════════════════════════════════════════════
    // CAS 1 : FRATRIE (niveauA = niveauB = 1)
    // ═══════════════════════════════════════════════
    else if (distA === 1 && distB === 1) {
      // Check half-siblings
      const isHalf =
        personA.father_id === personB.father_id &&
        personA.mother_ref !== personB.mother_ref &&
        personA.father_id !== null;

      if (isHalf) {
        catCode = 'HALF_SIBLINGS';
        labelFr = 'Demi-fratrie — BABA FO IZAYES';
      } else {
        catCode = 'SIBLINGS';
        labelFr = 'Fratrie';
      }

      // Terms based on sex of A and B
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

    // ═══════════════════════════════════════════════
    // CAS 2 : COUSINS (niveauA = niveauB > 1)
    // ═══════════════════════════════════════════════
    else if (distA === distB && distA > 1) {
      if (!pa || !pb) continue;

      // Parent direct de A et B sur le chemin (pas l'enfant de l'ancêtre)
      const parentA = dict[pathA[1]];
      const parentB = dict[pathB[1]];
      const sexParentA = parentA?.gender || pa.gender;
      const sexParentB = parentB?.gender || pb.gender;

      // 2a. Parents directs ♂♂ → ARROUHINKAYE IZAY (pères frères)
      // Même niveau = termes de fratrie (BABA est réservé au CAS 3a oncle/neveu)
      if (sexParentA === 'M' && sexParentB === 'M') {
        catCode = 'COUSINS_PATRI';
        labelFr = 'Cousins patrilateraux — ARROUHINKAYE IZAY';

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
      }

      // 2b. Parents directs ♀♀ → WAYUHINKAYE IZAY (mères sœurs)
      else if (sexParentA === 'F' && sexParentB === 'F') {
        catCode = 'COUSINS_MATRI';
        labelFr = 'Cousins matrilateraux — WAYUHINKAYE IZAY';

        const paIsElder = isBranchAElder(pathA, pathB, ancestor);
        if (paIsElder) {
          termCodeAtoB = 'NIAN_BERO';
          termCodeBtoA = 'NIAN_KEYNA';
        } else {
          termCodeAtoB = 'NIAN_KEYNA';
          termCodeBtoA = 'NIAN_BERO';
        }

        // Additional: A et B s'appellent ARMA ou WEYMA
        additionalTermCodeAtoB =
          personA.gender === 'F' ? 'WEYMA' : 'ARMA';
        additionalTermCodeBtoA =
          personB.gender === 'F' ? 'WEYMA' : 'ARMA';
      }

      // 2c. Mixte → BAASSEY (cousins croises)
      else {
        catCode = 'COUSINS_CROSS';
        labelFr = 'Cousins croises — BAASSEY';

        termCodeAtoB =
          personA.gender === 'F' ? 'BAASSA_WOYO' : 'BAASSARO';
        termCodeBtoA =
          personB.gender === 'F' ? 'BAASSA_WOYO' : 'BAASSARO';
      }
    }

    // ═══════════════════════════════════════════════
    // CAS 3 : GENERATIONS DIFFERENTES
    // ═══════════════════════════════════════════════
    else {
      // NB = node on B's branch at the same level as A
      // pathB = [personBId, ..., ancestorId]
      // reversed: [ancestorId, ..., personBId]
      // NB at level distA from ancestor = pathB[pathB.length - 1 - distA]
      const nbIndex = pathB.length - 1 - distA;
      const nbId = nbIndex >= 0 ? pathB[nbIndex] : null;
      const nb = nbId ? dict[nbId] : null;

      // ── CAS 3a : diff = 1 (Oncle/Tante ↔ Neveu/Niece) ──
      if (diff === 1) {
        catCode = 'UNCLE_AUNT';

        if (!nb) continue;

        // Compare which side is elder using branch nodes
        const nbSideIsElder = !isBranchAElder(pathA, pathB, ancestor);

        if (personA.gender === 'F' && nb.gender === 'F') {
          // A et NB sont soeurs → A = NIA pour B
          if (nbSideIsElder) {
            termCodeAtoB = 'NIAN_KEYNA_AUNT';
            labelFr = 'Tante maternelle cadette — NIA KEYNA';
          } else {
            termCodeAtoB = 'NIAN_BERO_AUNT';
            labelFr = 'Tante maternelle ainee — NIA BERO';
          }
          termCodeBtoA = 'IZE';
        } else if (personA.gender === 'M' && nb.gender === 'F') {
          // A = frere de la mere de B → A = HASSA pour B
          termCodeAtoB = 'HASSA';
          termCodeBtoA = 'TOUBA';
          labelFr = 'Oncle maternel — HASSA';
        } else if (personA.gender === 'M' && nb.gender === 'M') {
          // A et NB sont freres → A = BABA pour B
          if (nbSideIsElder) {
            termCodeAtoB = 'BABA_KATCHA_UNCLE';
            labelFr = 'Oncle paternel cadet — BABA KATCHA';
          } else {
            termCodeAtoB = 'BABA_BERO_UNCLE';
            labelFr = 'Oncle paternel aine — BABA BERO';
          }
          termCodeBtoA = 'IZE';
        } else {
          // A ♀ + NB ♂ → A = HAWA pour B (tante paternelle)
          termCodeAtoB = 'HAWA';
          termCodeBtoA = 'IZE';
          labelFr = 'Tante paternelle — HAWA';
        }
      }

      // ── CAS 3b : diff >= 2 (Grand-parent ↔ Petit-enfant) ──
      else {
        catCode = 'GRANDPARENT';
        const niveauKaaga = diff - 1;

        const termCode = buildKaagaTermCode(personA.gender, niveauKaaga);
        termCodeAtoB = termCode;
        termCodeBtoA = 'HAAMA';

        const termObj = terms[termCode];
        labelFr = termObj
          ? termObj.label_fr
          : `Ancetre de niveau ${niveauKaaga}`;
      }
    }

    // Get category object
    const cat = categories[catCode];
    if (!cat) continue;

    // Resolve term objects from codes
    let termAtoB = termCodeAtoB ? terms[termCodeAtoB] || null : null;
    let termBtoA = termCodeBtoA ? terms[termCodeBtoA] || null : null;
    let additionalTermAtoB = additionalTermCodeAtoB
      ? terms[additionalTermCodeAtoB] || null
      : null;
    let additionalTermBtoA = additionalTermCodeBtoA
      ? terms[additionalTermCodeBtoA] || null
      : null;

    // If we swapped A and B for normalization, swap terms back
    if (swapped) {
      [termAtoB, termBtoA] = [termBtoA, termAtoB];
      [additionalTermAtoB, additionalTermBtoA] = [
        additionalTermBtoA,
        additionalTermAtoB,
      ];
      [pathA, pathB] = [pathB, pathA];
      [distA, distB] = [distB, distA];
    }

    // Build Member arrays for paths
    const pathAMembers = pathA.map((id) => dict[id]).filter(Boolean);
    const pathBMembers = pathB.map((id) => dict[id]).filter(Boolean);

    const result: SonghoyRelationResult = {
      commonAncestor: ancestor,
      category: cat,
      termAtoB,
      termBtoA,
      pathA: pathAMembers,
      pathB: pathBMembers,
      details: {
        distanceA: distA,
        distanceB: distB,
        labelFr,
      },
    };

    if (additionalTermAtoB || additionalTermBtoA) {
      result.additionalTermAtoB = additionalTermAtoB;
      result.additionalTermBtoA = additionalTermBtoA;
    }

    results.push(result);
  }

  // Sort by total distance (closest relation first)
  results.sort(
    (a, b) =>
      a.details.distanceA +
      a.details.distanceB -
      (b.details.distanceA + b.details.distanceB),
  );

  return results;
}

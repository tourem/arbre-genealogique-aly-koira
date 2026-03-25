/**
 * Tests unitaires pour l'algorithme de relations familiales Songhoy
 *
 * Cas testés :
 * 1. Relations directes (parent/enfant)
 * 2. Fratrie (frères/sœurs)
 * 3. Cousins (patrilatéraux, matrilatéraux, croisés)
 * 4. Oncle/Tante - Neveu/Nièce
 * 5. Grands-parents / Petits-enfants
 * 6. Époux/Épouse
 * 7. Relations par alliance (beaux-parents, beaux-frères)
 * 8. Parcours bidirectionnel (A ancêtre de B)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { findSonghoyRelations } from './songhoyRelationship';
import type { MemberDict, TermsDict, CategoriesDict } from './types';

// ═══════════════════════════════════════════════════════════════════
// Fixtures : Arbre généalogique de test
// ═══════════════════════════════════════════════════════════════════

/**
 * Arbre de test :
 *
 *                    ANCETRE (G0, ♂)
 *                    │
 *         ┌─────────┴─────────┐
 *         │                   │
 *     PERE_A (G1, ♂)      TANTE (G1, ♀)
 *     ═ MERE_A (♀)        ═ ONCLE_EXT (♂)
 *         │                   │
 *    ┌────┴────┐         COUSIN_C (G2, ♂)
 *    │         │
 * FILS_A    FILLE_A
 * (G2, ♂)   (G2, ♀)
 * ═ EPOUSE_A   │
 *    │      PETIT_FILS
 * PETIT_A   (G3, ♂)
 * (G3, ♂)
 *
 * Également :
 * - MERE_B avec enfants FILS_B et FILLE_B (cousins matrilatéraux)
 * - ONCLE_PAT (frère de PERE_A) avec COUSIN_PAT (cousins patrilatéraux)
 */

function createTestFamily(): MemberDict {
  const members: MemberDict = {};

  // Génération 0 - Ancêtre
  members['ancetre'] = {
    id: 'ancetre',
    name: 'Ancêtre',
    first_name: null,
    alias: null,
    gender: 'M',
    generation: 0,
    father_id: null,
    mother_ref: null,
    spouses: ['ancetre_epouse'],
    children: ['pere_a', 'tante', 'oncle_pat'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['ancetre_epouse'] = {
    id: 'ancetre_epouse',
    name: 'Épouse Ancêtre',
    first_name: null,
    alias: null,
    gender: 'F',
    generation: 0,
    father_id: null,
    mother_ref: null,
    spouses: ['ancetre'],
    children: ['pere_a', 'tante', 'oncle_pat'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  // Génération 1 - Enfants de l'ancêtre
  members['pere_a'] = {
    id: 'pere_a',
    name: 'Père A',
    first_name: null,
    alias: null,
    gender: 'M',
    generation: 1,
    father_id: 'ancetre',
    mother_ref: 'ancetre_epouse',
    spouses: ['mere_a'],
    children: ['fils_a', 'fille_a'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['mere_a'] = {
    id: 'mere_a',
    name: 'Mère A',
    first_name: null,
    alias: null,
    gender: 'F',
    generation: 1,
    father_id: null,
    mother_ref: null,
    spouses: ['pere_a'],
    children: ['fils_a', 'fille_a'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['tante'] = {
    id: 'tante',
    name: 'Tante',
    first_name: null,
    alias: null,
    gender: 'F',
    generation: 1,
    father_id: 'ancetre',
    mother_ref: 'ancetre_epouse',
    spouses: ['oncle_ext'],
    children: ['cousin_c'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['oncle_ext'] = {
    id: 'oncle_ext',
    name: 'Oncle Externe',
    first_name: null,
    alias: null,
    gender: 'M',
    generation: 1,
    father_id: null,
    mother_ref: null,
    spouses: ['tante'],
    children: ['cousin_c'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['oncle_pat'] = {
    id: 'oncle_pat',
    name: 'Oncle Paternel',
    first_name: null,
    alias: null,
    gender: 'M',
    generation: 1,
    father_id: 'ancetre',
    mother_ref: 'ancetre_epouse',
    spouses: ['tante_pat'],
    children: ['cousin_pat'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['tante_pat'] = {
    id: 'tante_pat',
    name: 'Épouse Oncle Pat',
    first_name: null,
    alias: null,
    gender: 'F',
    generation: 1,
    father_id: null,
    mother_ref: null,
    spouses: ['oncle_pat'],
    children: ['cousin_pat'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  // Génération 2 - Petits-enfants
  members['fils_a'] = {
    id: 'fils_a',
    name: 'Fils A',
    first_name: null,
    alias: null,
    gender: 'M',
    generation: 2,
    father_id: 'pere_a',
    mother_ref: 'mere_a',
    spouses: ['epouse_fils_a'],
    children: ['petit_a'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['epouse_fils_a'] = {
    id: 'epouse_fils_a',
    name: 'Épouse Fils A',
    first_name: null,
    alias: null,
    gender: 'F',
    generation: 2,
    father_id: null,
    mother_ref: null,
    spouses: ['fils_a'],
    children: ['petit_a'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['fille_a'] = {
    id: 'fille_a',
    name: 'Fille A',
    first_name: null,
    alias: null,
    gender: 'F',
    generation: 2,
    father_id: 'pere_a',
    mother_ref: 'mere_a',
    spouses: [],
    children: ['petit_fils'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['cousin_c'] = {
    id: 'cousin_c',
    name: 'Cousin C',
    first_name: null,
    alias: null,
    gender: 'M',
    generation: 2,
    father_id: 'oncle_ext',
    mother_ref: 'tante',
    spouses: [],
    children: [],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['cousin_pat'] = {
    id: 'cousin_pat',
    name: 'Cousin Paternel',
    first_name: null,
    alias: null,
    gender: 'M',
    generation: 2,
    father_id: 'oncle_pat',
    mother_ref: 'tante_pat',
    spouses: [],
    children: [],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  // Génération 3 - Arrière-petits-enfants
  members['petit_a'] = {
    id: 'petit_a',
    name: 'Petit A',
    first_name: null,
    alias: null,
    gender: 'M',
    generation: 3,
    father_id: 'fils_a',
    mother_ref: 'epouse_fils_a',
    spouses: [],
    children: [],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['petit_fils'] = {
    id: 'petit_fils',
    name: 'Petit Fils',
    first_name: null,
    alias: null,
    gender: 'M',
    generation: 3,
    father_id: null,
    mother_ref: 'fille_a',
    spouses: [],
    children: [],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  // Famille pour cousins matrilatéraux
  members['grand_mere_mat'] = {
    id: 'grand_mere_mat',
    name: 'Grand-mère Maternelle',
    first_name: null,
    alias: null,
    gender: 'F',
    generation: 0,
    father_id: null,
    mother_ref: null,
    spouses: [],
    children: ['mere_b', 'mere_c'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['mere_b'] = {
    id: 'mere_b',
    name: 'Mère B',
    first_name: null,
    alias: null,
    gender: 'F',
    generation: 1,
    father_id: null,
    mother_ref: 'grand_mere_mat',
    spouses: [],
    children: ['fils_b'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['mere_c'] = {
    id: 'mere_c',
    name: 'Mère C',
    first_name: null,
    alias: null,
    gender: 'F',
    generation: 1,
    father_id: null,
    mother_ref: 'grand_mere_mat',
    spouses: [],
    children: ['fils_c'],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['fils_b'] = {
    id: 'fils_b',
    name: 'Fils B',
    first_name: null,
    alias: null,
    gender: 'M',
    generation: 2,
    father_id: null,
    mother_ref: 'mere_b',
    spouses: [],
    children: [],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  members['fils_c'] = {
    id: 'fils_c',
    name: 'Fils C',
    first_name: null,
    alias: null,
    gender: 'M',
    generation: 2,
    father_id: null,
    mother_ref: 'mere_c',
    spouses: [],
    children: [],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
  };

  return members;
}

// Mock terms et categories
function createMockTerms(): TermsDict {
  const termCodes = [
    'BABA', 'NIA', 'IZE', 'ARMA', 'WAYMA', 'WEYMA',
    'KAAGA', 'KAAGA_WOY', 'HAAMA',
    'HASSA', 'TOUBA', 'HAWA',
    'BABA_BERO_UNCLE', 'BABA_KATCHA_UNCLE',
    'NIAN_BERO', 'NIAN_KEYNA', 'NIAN_BERO_AUNT', 'NIAN_KEYNA_AUNT',
    'BAASSARO', 'BAASSA_WOYO',
    'KOURNIO', 'ALAA_YANO',
    'TCHI', 'AROUKOY', 'ITCHEY',
  ];

  const terms: TermsDict = {};
  for (const code of termCodes) {
    terms[code] = {
      id: code.toLowerCase(),
      category_code: 'TEST',
      term_code: code,
      term_songhoy: code.toLowerCase(),
      prononciation: null,
      label_fr: code.replace(/_/g, ' '),
      description: null,
      speaker_gender: 'ANY',
      target_gender: 'ANY',
      context_condition: null,
      is_active: true,
      display_order: 0,
    };
  }
  return terms;
}

function createMockCategories(): CategoriesDict {
  const catCodes = [
    'PARENT', 'SIBLINGS', 'HALF_SIBLINGS', 'GRANDPARENT',
    'COUSINS_PATRI', 'COUSINS_MATRI', 'COUSINS_CROSS',
    'UNCLE_AUNT', 'SPOUSE', 'IN_LAWS', 'STEP_PARENT',
    'PARENT_IN_LAW', 'SIBLING_IN_LAW',
  ];

  const cats: CategoriesDict = {};
  for (const code of catCodes) {
    cats[code] = {
      code,
      label_songhoy: null,
      label_fr: code.replace(/_/g, ' '),
      description: null,
      sort_order: 0,
    };
  }
  return cats;
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe('findSonghoyRelations', () => {
  let members: MemberDict;
  let terms: TermsDict;
  let categories: CategoriesDict;

  beforeEach(() => {
    members = createTestFamily();
    terms = createMockTerms();
    categories = createMockCategories();
  });

  describe('Relations directes (Parent/Enfant)', () => {
    it('devrait trouver la relation père → fils', () => {
      const results = findSonghoyRelations('pere_a', 'fils_a', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      const parentRel = results.find(r => r.category.code === 'PARENT');
      expect(parentRel).toBeDefined();
      expect(parentRel?.termAtoB?.term_code).toBe('BABA');
      expect(parentRel?.termBtoA?.term_code).toBe('IZE');
    });

    it('devrait trouver la relation mère → fils', () => {
      const results = findSonghoyRelations('mere_a', 'fils_a', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      const parentRel = results.find(r => r.category.code === 'PARENT');
      expect(parentRel).toBeDefined();
      expect(parentRel?.termAtoB?.term_code).toBe('NIA');
    });

    it('devrait trouver la relation fils → père (inverse)', () => {
      const results = findSonghoyRelations('fils_a', 'pere_a', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      const parentRel = results.find(r => r.category.code === 'PARENT');
      expect(parentRel).toBeDefined();
      expect(parentRel?.termAtoB?.term_code).toBe('IZE');
      expect(parentRel?.termBtoA?.term_code).toBe('BABA');
    });
  });

  describe('Fratrie (Frères/Sœurs)', () => {
    it('devrait trouver la relation frère ↔ sœur', () => {
      const results = findSonghoyRelations('fils_a', 'fille_a', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      const siblingRel = results.find(r => r.category.code === 'SIBLINGS');
      expect(siblingRel).toBeDefined();
      // Dans la terminologie Songhoy : homme (A) vers femme (B)
      // ARMA = terme utilisé par un homme pour parler de son frère/sœur
      // WAYMA = terme utilisé par une femme pour parler de son frère
      expect(siblingRel?.termAtoB?.term_code).toBe('ARMA'); // homme → sœur
      expect(siblingRel?.termBtoA?.term_code).toBe('WAYMA'); // femme → frère
    });

    it('devrait trouver la relation entre frères (père et oncle)', () => {
      const results = findSonghoyRelations('pere_a', 'oncle_pat', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      const siblingRel = results.find(r => r.category.code === 'SIBLINGS');
      expect(siblingRel).toBeDefined();
      expect(siblingRel?.termAtoB?.term_code).toBe('ARMA');
      expect(siblingRel?.termBtoA?.term_code).toBe('ARMA');
    });
  });

  describe('Cousins', () => {
    it('devrait trouver les cousins croisés (BAASSEY) - père/tante', () => {
      // fils_a (père = pere_a ♂) et cousin_c (mère = tante ♀)
      const results = findSonghoyRelations('fils_a', 'cousin_c', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      const cousinRel = results.find(r => r.category.code === 'COUSINS_CROSS');
      expect(cousinRel).toBeDefined();
      expect(cousinRel?.details.labelFr).toContain('BAASSEY');
    });

    it('devrait trouver les cousins patrilatéraux (ARROUHINKAYE)', () => {
      // fils_a (père = pere_a ♂) et cousin_pat (père = oncle_pat ♂)
      const results = findSonghoyRelations('fils_a', 'cousin_pat', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      const cousinRel = results.find(r => r.category.code === 'COUSINS_PATRI');
      expect(cousinRel).toBeDefined();
      expect(cousinRel?.details.labelFr).toContain('ARROUHINKAYE');
    });

    it('devrait trouver les cousins matrilatéraux (WAYUHINKAYE)', () => {
      // fils_b (mère = mere_b ♀) et fils_c (mère = mere_c ♀)
      const results = findSonghoyRelations('fils_b', 'fils_c', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      const cousinRel = results.find(r => r.category.code === 'COUSINS_MATRI');
      expect(cousinRel).toBeDefined();
      expect(cousinRel?.details.labelFr).toContain('WAYUHINKAYE');
    });
  });

  describe('Oncle/Tante - Neveu/Nièce', () => {
    it('devrait trouver la relation oncle paternel → neveu', () => {
      const results = findSonghoyRelations('oncle_pat', 'fils_a', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      const uncleRel = results.find(r => r.category.code === 'UNCLE_AUNT');
      expect(uncleRel).toBeDefined();
      // oncle_pat est frère de pere_a, donc oncle paternel de fils_a
    });

    it('devrait trouver la relation tante → neveu (cousins croisés parent)', () => {
      const results = findSonghoyRelations('tante', 'fils_a', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      const uncleRel = results.find(r => r.category.code === 'UNCLE_AUNT');
      expect(uncleRel).toBeDefined();
      expect(uncleRel?.termAtoB?.term_code).toBe('HAWA'); // tante paternelle
    });
  });

  describe('Grands-parents', () => {
    it('devrait trouver la relation grand-père → petit-fils', () => {
      const results = findSonghoyRelations('ancetre', 'fils_a', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      const grandparentRel = results.find(r => r.category.code === 'GRANDPARENT');
      expect(grandparentRel).toBeDefined();
      expect(grandparentRel?.termAtoB?.term_code).toBe('KAAGA');
      expect(grandparentRel?.termBtoA?.term_code).toBe('HAAMA');
    });

    it('devrait trouver la relation arrière-grand-père → arrière-petit-fils', () => {
      const results = findSonghoyRelations('ancetre', 'petit_a', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      const grandparentRel = results.find(r => r.category.code === 'GRANDPARENT');
      expect(grandparentRel).toBeDefined();
    });
  });

  describe('Époux/Épouse', () => {
    it('devrait trouver la relation mari ↔ femme', () => {
      const results = findSonghoyRelations('pere_a', 'mere_a', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      const spouseRel = results.find(r => r.category.code === 'SPOUSE');
      expect(spouseRel).toBeDefined();
      // KOURNIO = terme pour désigner son conjoint (épouse)
      // ALAA_YANO = terme utilisé par une femme pour désigner son mari
      expect(spouseRel?.termAtoB?.term_code).toBe('KOURNIO'); // mari appelle sa femme
      expect(spouseRel?.termBtoA?.term_code).toBe('ALAA_YANO'); // femme appelle son mari
    });

    it('ne devrait PAS retourner de fausse relation KAAGA pour des époux co-parents', () => {
      // fils_a et epouse_fils_a sont époux ET co-parents de petit_a
      // L'algorithme NE DOIT PAS trouver de fausse relation KAAGA/ancêtre
      // (mais peut trouver d'autres relations si leurs parents sont liés)
      const results = findSonghoyRelations('fils_a', 'epouse_fils_a', members, terms, categories);

      // Doit avoir au moins la relation SPOUSE
      expect(results.length).toBeGreaterThan(0);
      const spouseRel = results.find(r => r.category.code === 'SPOUSE');
      expect(spouseRel).toBeDefined();

      // NE DOIT PAS avoir de GRANDPARENT/KAAGA via les enfants communs
      const kaagaRel = results.find(r => r.category.code === 'GRANDPARENT');
      expect(kaagaRel).toBeUndefined();
    });

    it('ne devrait pas confondre co-parents avec ancêtres (sens inverse)', () => {
      const results = findSonghoyRelations('epouse_fils_a', 'fils_a', members, terms, categories);

      // Doit avoir la relation SPOUSE
      const spouseRel = results.find(r => r.category.code === 'SPOUSE');
      expect(spouseRel).toBeDefined();

      // NE DOIT PAS avoir de GRANDPARENT/KAAGA
      const kaagaRel = results.find(r => r.category.code === 'GRANDPARENT');
      expect(kaagaRel).toBeUndefined();
    });
  });

  describe('Relations par alliance (In-Laws)', () => {
    it('devrait trouver la relation beau-père (père du conjoint)', () => {
      // epouse_fils_a → pere_a (père de son mari fils_a)
      const results = findSonghoyRelations('epouse_fils_a', 'pere_a', members, terms, categories);

      // Il devrait y avoir une relation par alliance
      expect(results.length).toBeGreaterThan(0);
    });

    it('devrait trouver la relation beau-frère/belle-sœur', () => {
      // epouse_fils_a → fille_a (sœur de son mari fils_a)
      const results = findSonghoyRelations('epouse_fils_a', 'fille_a', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Parcours descendant (A ancêtre de B)', () => {
    it('devrait trouver la relation quand A est ancêtre direct de B via enfants', () => {
      const results = findSonghoyRelations('ancetre', 'petit_a', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      // ancetre est arrière-grand-père de petit_a
      const rel = results.find(r =>
        r.category.code === 'GRANDPARENT' || r.details.distanceA === 0
      );
      expect(rel).toBeDefined();
    });

    it('devrait trouver la relation inverse (B ancêtre de A)', () => {
      const results = findSonghoyRelations('petit_a', 'ancetre', members, terms, categories);

      expect(results.length).toBeGreaterThan(0);
      // petit_a est arrière-petit-fils de ancetre
      const rel = results.find(r => r.category.code === 'GRANDPARENT');
      expect(rel).toBeDefined();
    });
  });

  describe('Pas de doublons', () => {
    it('ne devrait pas retourner de doublons pour le même ancêtre commun', () => {
      const results = findSonghoyRelations('fils_a', 'cousin_pat', members, terms, categories);

      // Vérifier qu'il n'y a pas de doublons par catégorie + ancêtre + distances
      // (on peut avoir la même catégorie si les ancêtres sont différents)
      const keys = results.map(r =>
        `${r.category.code}|${r.commonAncestor?.id || 'direct'}|${r.details.distanceA}|${r.details.distanceB}`
      );
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });

    it('peut retourner plusieurs BAASSEY si les branches sont différentes', () => {
      // Ce test vérifie que des cousins via différents ancêtres
      // peuvent avoir plusieurs relations du même type
      const results = findSonghoyRelations('fils_a', 'cousin_c', members, terms, categories);

      // On accepte plusieurs relations si les ancêtres communs sont différents
      const cousinRelations = results.filter(r => r.category.code.includes('COUSIN'));
      if (cousinRelations.length > 1) {
        // Vérifier que les ancêtres communs sont différents
        const ancestorIds = cousinRelations.map(r => r.commonAncestor?.id);
        const uniqueAncestors = new Set(ancestorIds);
        expect(uniqueAncestors.size).toBe(ancestorIds.length);
      }
    });
  });

  describe('Cas limites', () => {
    it('devrait retourner un tableau vide pour la même personne', () => {
      const results = findSonghoyRelations('fils_a', 'fils_a', members, terms, categories);
      expect(results).toEqual([]);
    });

    it('devrait retourner un tableau vide pour des personnes inexistantes', () => {
      const results = findSonghoyRelations('inexistant', 'fils_a', members, terms, categories);
      expect(results).toEqual([]);
    });

    it('devrait gérer les personnes sans lien familial', () => {
      // oncle_ext n'a pas de lien de sang avec grand_mere_mat
      const results = findSonghoyRelations('oncle_ext', 'grand_mere_mat', members, terms, categories);
      // Peut retourner vide ou des relations par alliance
      expect(Array.isArray(results)).toBe(true);
    });
  });
});

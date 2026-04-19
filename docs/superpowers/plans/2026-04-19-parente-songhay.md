# Liens de parenté Songhay — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refonte totale de la fonctionnalité « Liens de parenté Songhay » : moteur TypeScript pur conforme au spec, UX page + modal popup responsive, sous-arbre SVG hybride, vocabulaire externalisé en DB avec fallback code.

**Architecture :**
- Moteur pur dans `lib/parenteSonghay/` (aucune dépendance React/Supabase) avec tests unitaires couvrant les 14 cas du document de référence.
- UI : page `/parente` avec 2 autocompletes → ouvre auto un modal responsive (bottom-sheet mobile, modal centré desktop) avec 2 onglets (graphique / détaillée).
- Libellés : défauts dans `labels.ts`, override optionnel via une table DB minimale `parente_labels` + écran admin.
- Suppression de l'ancien système (`songhoyRelationship.ts`, 3 tables DB, ancien admin screen).

**Tech Stack :** TypeScript, React 19, Vite, Vitest, Supabase (Postgres + RLS), CSS vanilla scopé (tokens Royal Gold existants), SVG natif pour le sous-arbre.

**Documents de référence :**
- `docs/superpowers/specs/2026-04-19-parente-songhay-design.md` (spec validé)
- `parente/algorithme-parente-songhay.md` (algorithme source)
- `parente/prompt-claude-code-feature-parente-alykoira.md` (exigences UX)

---

## Conventions

- **TDD strict** : test rouge → implémentation minimale → test vert → commit.
- **Commits atomiques** : chaque commit doit laisser l'app compilable (`npm run build`) et les tests verts (`npm run test:run`).
- Travail dans `react-app/` (cwd de la plupart des commandes). Chemins relatifs depuis la racine du repo sauf mention contraire.
- **Lint** : `npm run lint` avant chaque commit si le temps le permet (pas bloquant mais conseillé).
- Le plan assume que l'agent démarre sur la branche `main` avec le working tree propre (le spec a déjà été committé en `f18be78`).

---

## Carte des fichiers (vue d'ensemble)

### Création

```
react-app/src/lib/parenteSonghay/
├── types.ts
├── labels.ts
├── applyLabels.ts
├── applyLabels.test.ts
├── enumeratePaths.ts
├── enumeratePaths.test.ts
├── findLCAInstances.ts
├── findLCAInstances.test.ts
├── buildTerms.ts
├── buildTerms.test.ts
├── classify.ts
├── classify.test.ts
├── explain.ts
├── explain.test.ts
├── index.ts
├── index.test.ts
└── fixtures/
    └── testFamily.ts        (fixture Sira/Modibo/Hadja/Cheick/Bakary/...)

react-app/src/hooks/
└── useParenteLabels.tsx     (hook + Provider, en .tsx car exporte du JSX)

react-app/src/components/relationship/
├── PersonPicker.tsx
├── ParenteResultModal.tsx
├── SubTreeSvg.tsx
├── RelationSelector.tsx
├── DetailedView.tsx
├── ReciprocalStatements.tsx
├── TechnicalDetails.tsx
└── PedagogicalExplanation.tsx

react-app/src/components/admin/
└── ParenteLabelsSection.tsx

supabase/migrations/
└── 013_parente_labels.sql
```

### Modification

- `react-app/src/App.tsx` (wrapper `<ParenteLabelsProvider>`)
- `react-app/src/pages/ParentePage.tsx` (réécriture complète)
- `react-app/src/pages/AdminPage.tsx` (swap `TermsManagementSection` → `ParenteLabelsSection`)
- `react-app/src/lib/types.ts` (retrait des types obsolètes)
- `react-app/src/styles/global.css` (nettoyage classes obsolètes + ajout nouvelles)

### Suppression

- `react-app/src/lib/songhoyRelationship.ts`
- `react-app/src/lib/songhoyRelationship.test.ts`
- `react-app/src/hooks/useRelationTerms.ts`
- `react-app/src/components/relationship/MemberAutocomplete.tsx`
- `react-app/src/components/relationship/PersonSelect.tsx` (si orphelin)
- `react-app/src/components/relationship/RelationshipResult.tsx`
- `react-app/src/components/relationship/RelationCard.tsx`
- `react-app/src/components/relationship/RelationPathGraph.tsx`
- `react-app/src/components/relationship/TreePathModal.tsx`
- `react-app/src/components/admin/TermsManagementSection.tsx`

---

## Phase 1 — Moteur de parenté (TypeScript pur, commit `feat(parente): moteur`)

### Task 1 : Types et constantes du moteur

**Files:**
- Create: `react-app/src/lib/parenteSonghay/types.ts`

- [ ] **Step 1 : Écrire le fichier de types**

```ts
// react-app/src/lib/parenteSonghay/types.ts

export type Sex = 'M' | 'F';
export type Hop = 'P' | 'M';

export type RelationKind =
  | 'direct-descendant'
  | 'direct-ascendant'
  | 'parallel'
  | 'cross'
  | 'avuncular'
  | 'distant-vertical';

/** Personne minimale consommée par le moteur. */
export interface Person {
  id: string;
  name: string;
  sex: Sex;
  fatherId: string | null;
  motherId: string | null;
}

/** Dict {id → Person} — forme interne du moteur. */
export type PersonDict = Record<string, Person>;

/** Un chemin ancestral d'une personne. */
export interface AncestorPath {
  ancestor: string;
  hops: Hop[];
}

/** Une instance (candidate) de LCA entre A et B. */
export interface LCAInstance {
  ancestor: string;
  pathA: Hop[];
  pathB: Hop[];
}

/** Relation computed between A and B. */
export interface Relation {
  termForA: string;
  termForB: string;
  kind: RelationKind;
  via: string;
  viaName: string;
  pathA: Hop[];
  pathB: Hop[];
  distanceA: number;
  distanceB: number;
  proximityScore: number;
  balanceScore: number;
}

export interface MissingParent {
  personId: string;
  missing: 'father' | 'mother';
}

export type RelationResult =
  | { kind: 'same-person' }
  | { kind: 'no-link' }
  | { kind: 'incomplete'; missingParents: MissingParent[] }
  | { kind: 'relations'; relations: Relation[] };

export const MAX_DEPTH = 20;
```

- [ ] **Step 2 : Vérifier que le fichier compile**

Run: `cd react-app && npx tsc --noEmit -p tsconfig.app.json`
Expected: pas d'erreur liée à ce fichier.

- [ ] **Step 3 : Pas de commit encore** — ce fichier sera committé avec les suivants du moteur.

---

### Task 2 : Libellés par défaut

**Files:**
- Create: `react-app/src/lib/parenteSonghay/labels.ts`

- [ ] **Step 1 : Écrire `labels.ts` avec tous les défauts**

```ts
// react-app/src/lib/parenteSonghay/labels.ts

/**
 * Libellés par défaut (source de vérité commitée).
 * Clés hiérarchiques : term.* | gloss.* | explain.*
 * Placeholders dans explain.* : {nameA} {nameB} {termA} {termB} {lca} {dA} {dB}
 */
export const defaultLabels: Record<string, string> = {
  // ─── Termes Songhay atomiques ───
  'term.baba': 'baba',
  'term.gna': 'gna',
  'term.ize': 'izé',
  'term.arma': 'arma',
  'term.woyma': 'woyma',
  'term.baassa_arou': 'baassa arou',
  'term.baassa_woy': 'baassa woy',
  'term.hassa': 'hassa',
  'term.touba': 'touba',
  'term.hawa': 'hawa',
  'term.kaga_arou': 'kaga arou',
  'term.kaga_woy': 'kaga woy',
  'term.haama': 'haama',
  'term.cote_baba': 'coté baba',
  'term.cote_gna': 'coté gna',

  // ─── Gloses françaises (affichées sous les termes dans le sous-arbre) ───
  'gloss.baba': 'père',
  'gloss.gna': 'mère',
  'gloss.ize': 'enfant',
  'gloss.arma': 'frère',
  'gloss.woyma': 'sœur',
  'gloss.baassa_arou': 'cousin croisé',
  'gloss.baassa_woy': 'cousine croisée',
  'gloss.hassa': 'oncle maternel',
  'gloss.touba': 'neveu via oncle maternel',
  'gloss.hawa': 'tante paternelle',
  'gloss.kaga_arou': 'grand-père / ancêtre',
  'gloss.kaga_woy': 'grand-mère / ancêtre',
  'gloss.haama': 'petit-enfant / descendant',

  // ─── Explications pédagogiques (templates avec placeholders) ───
  'explain.direct-descendant.parent':
    '{nameA} est {termA} direct de {nameB} : lien parent → enfant de premier niveau.',
  'explain.direct-descendant.ancestor':
    '{nameA} est {termA} de {nameB} ({dA} générations d\'écart). En pays songhay, on répète le mot « kaga » pour chaque génération supplémentaire et on précise le côté (paternel ou maternel) selon la branche par laquelle on remonte.',
  'explain.direct-ascendant.child':
    '{nameA} est {termA} direct de {nameB} : enfant de premier niveau.',
  'explain.direct-ascendant.descendant':
    '{nameA} est {termA} de {nameB} (descendant sur {dA} générations). Le terme « haama » se répète pour chaque génération supplémentaire.',
  'explain.parallel':
    '{nameA} et {nameB} descendent de {lca} par des parents de même sexe (fratrie parallèle). Dans le système soudanais songhay, les enfants de deux frères — ou de deux sœurs — sont fusionnés avec la fratrie : ils portent les mêmes termes « arma » / « woyma » que de vrais frères et sœurs.',
  'explain.cross':
    '{nameA} et {nameB} descendent de {lca} par des parents de sexes opposés (lien croisé). Le système songhay distingue rigoureusement ces cousins croisés de la fratrie parallèle : ils portent le terme dédié « baassa arou » / « baassa woy ».',
  'explain.avuncular.parallel':
    '{nameA} est {termA} de {nameB} : oncle ou tante parallèle, c\'est-à-dire frère-équivalent du parent de même sexe. Par la règle de fusion bifurquée, il/elle est nommé(e) comme le parent direct.',
  'explain.avuncular.hassa':
    'En pays songhay, l\'oncle maternel porte un nom dédié — « hassa » — qui marque son rôle social spécial (avunculat soudanais). Le neveu / la nièce par cette relation est « touba ». Cette asymétrie lexicale ne s\'applique qu\'à l\'oncle maternel, pas à la tante paternelle.',
  'explain.avuncular.hawa':
    '« hawa » désigne la tante paternelle (sœur-équivalente du père). L\'asymétrie du système : il existe un terme dédié pour la tante paternelle (« hawa ») mais pas de terme réciproque spécial pour son neveu/nièce, qui reste simplement « izé ».',
  'explain.distant-vertical':
    '{nameA} est {termA} de {nameB} : grand-oncle / grand-tante ou relation éloignée de {dA} générations d\'écart. Le mot « kaga » se répète pour chaque génération supplémentaire, suffixé par « coté baba » ou « coté gna » selon la branche par laquelle on remonte.',
};
```

- [ ] **Step 2 : Vérifier que le fichier compile**

Run: `cd react-app && npx tsc --noEmit -p tsconfig.app.json`
Expected: pas d'erreur.

---

### Task 3 : applyLabels (merge overrides → défauts)

**Files:**
- Create: `react-app/src/lib/parenteSonghay/applyLabels.ts`
- Test: `react-app/src/lib/parenteSonghay/applyLabels.test.ts`

- [ ] **Step 1 : Écrire le test (rouge)**

```ts
// react-app/src/lib/parenteSonghay/applyLabels.test.ts
import { describe, it, expect } from 'vitest';
import { applyLabels } from './applyLabels';
import { defaultLabels } from './labels';

describe('applyLabels', () => {
  it('returns defaults when overrides is empty', () => {
    const result = applyLabels({});
    expect(result).toEqual(defaultLabels);
  });

  it('overrides a single key without touching others', () => {
    const result = applyLabels({ 'term.hassa': 'Hassa-custom' });
    expect(result['term.hassa']).toBe('Hassa-custom');
    expect(result['term.touba']).toBe(defaultLabels['term.touba']);
    expect(result['term.baba']).toBe(defaultLabels['term.baba']);
  });

  it('ignores overrides for keys unknown in defaults (silent drop)', () => {
    const result = applyLabels({ 'unknown.key': 'ignored' });
    expect(result).toEqual(defaultLabels);
    expect(result).not.toHaveProperty('unknown.key');
  });

  it('accepts multiple overrides at once', () => {
    const result = applyLabels({
      'term.hassa': 'H',
      'gloss.hassa': 'o.m.',
    });
    expect(result['term.hassa']).toBe('H');
    expect(result['gloss.hassa']).toBe('o.m.');
  });
});
```

- [ ] **Step 2 : Lancer le test — il doit échouer (module inexistant)**

Run: `cd react-app && npx vitest run src/lib/parenteSonghay/applyLabels.test.ts`
Expected: FAIL (`Cannot find module './applyLabels'`).

- [ ] **Step 3 : Implémenter `applyLabels.ts`**

```ts
// react-app/src/lib/parenteSonghay/applyLabels.ts
import { defaultLabels } from './labels';

/**
 * Merge des overrides par-dessus les libellés par défaut.
 * Les clés inconnues dans les défauts sont ignorées silencieusement
 * (résilience : un override orphelin ne casse pas le dict).
 */
export function applyLabels(
  overrides: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = { ...defaultLabels };
  for (const key of Object.keys(overrides)) {
    if (key in defaultLabels) {
      result[key] = overrides[key];
    }
  }
  return result;
}
```

- [ ] **Step 4 : Relancer les tests — verts**

Run: `cd react-app && npx vitest run src/lib/parenteSonghay/applyLabels.test.ts`
Expected: 4 tests PASS.

---

### Task 4 : enumeratePaths (DFS ancêtres)

**Files:**
- Create: `react-app/src/lib/parenteSonghay/enumeratePaths.ts`
- Test: `react-app/src/lib/parenteSonghay/enumeratePaths.test.ts`

- [ ] **Step 1 : Écrire les tests (rouge)**

```ts
// react-app/src/lib/parenteSonghay/enumeratePaths.test.ts
import { describe, it, expect } from 'vitest';
import { enumeratePaths } from './enumeratePaths';
import type { PersonDict } from './types';

const tiny: PersonDict = {
  me:     { id: 'me',     name: 'Me',     sex: 'M', fatherId: 'dad', motherId: 'mom' },
  dad:    { id: 'dad',    name: 'Dad',    sex: 'M', fatherId: 'gpa', motherId: null  },
  mom:    { id: 'mom',    name: 'Mom',    sex: 'F', fatherId: null,  motherId: null  },
  gpa:    { id: 'gpa',    name: 'Gpa',    sex: 'M', fatherId: null,  motherId: null  },
};

describe('enumeratePaths', () => {
  it('includes the person herself as distance-0 path', () => {
    const paths = enumeratePaths('me', tiny);
    const selfPath = paths.find(p => p.ancestor === 'me');
    expect(selfPath).toBeDefined();
    expect(selfPath!.hops).toEqual([]);
  });

  it('finds father with P hop', () => {
    const paths = enumeratePaths('me', tiny);
    const dad = paths.find(p => p.ancestor === 'dad');
    expect(dad?.hops).toEqual(['P']);
  });

  it('finds mother with M hop', () => {
    const paths = enumeratePaths('me', tiny);
    const mom = paths.find(p => p.ancestor === 'mom');
    expect(mom?.hops).toEqual(['M']);
  });

  it('finds grandfather through father', () => {
    const paths = enumeratePaths('me', tiny);
    const gpa = paths.find(p => p.ancestor === 'gpa');
    expect(gpa?.hops).toEqual(['P', 'P']);
  });

  it('respects max_depth and protects against cycles', () => {
    const cyclic: PersonDict = {
      a: { id: 'a', name: 'A', sex: 'M', fatherId: 'b', motherId: null },
      b: { id: 'b', name: 'B', sex: 'M', fatherId: 'a', motherId: null },
    };
    const paths = enumeratePaths('a', cyclic, 5);
    expect(paths.length).toBeLessThanOrEqual(6);
  });

  it('enumerates all branches when both parents set', () => {
    const paths = enumeratePaths('me', tiny);
    const ancestors = paths.map(p => p.ancestor).sort();
    expect(ancestors).toEqual(['dad', 'gpa', 'me', 'mom']);
  });
});
```

- [ ] **Step 2 : Lancer, voir rouge**

Run: `cd react-app && npx vitest run src/lib/parenteSonghay/enumeratePaths.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Implémenter**

```ts
// react-app/src/lib/parenteSonghay/enumeratePaths.ts
import { MAX_DEPTH } from './types';
import type { AncestorPath, Hop, PersonDict } from './types';

/**
 * DFS récursif : énumère tous les chemins ancestraux d'une personne.
 * Inclut la personne elle-même (hops=[]).
 * Protection cycles via maxDepth.
 */
export function enumeratePaths(
  personId: string,
  dict: PersonDict,
  maxDepth: number = MAX_DEPTH,
): AncestorPath[] {
  const results: AncestorPath[] = [];

  function dfs(currentId: string, hops: Hop[]): void {
    results.push({ ancestor: currentId, hops: [...hops] });
    if (hops.length >= maxDepth) return;
    const person = dict[currentId];
    if (!person) return;
    if (person.fatherId && dict[person.fatherId]) {
      dfs(person.fatherId, [...hops, 'P']);
    }
    if (person.motherId && dict[person.motherId]) {
      dfs(person.motherId, [...hops, 'M']);
    }
  }

  dfs(personId, []);
  return results;
}
```

- [ ] **Step 4 : Tests verts**

Run: `cd react-app && npx vitest run src/lib/parenteSonghay/enumeratePaths.test.ts`
Expected: 6 tests PASS.

---

### Task 5 : findLCAInstances (produit cartésien + filtre minimalité)

**Files:**
- Create: `react-app/src/lib/parenteSonghay/findLCAInstances.ts`
- Test: `react-app/src/lib/parenteSonghay/findLCAInstances.test.ts`

- [ ] **Step 1 : Tests (rouge)**

```ts
// react-app/src/lib/parenteSonghay/findLCAInstances.test.ts
import { describe, it, expect } from 'vitest';
import { findLCAInstances } from './findLCAInstances';
import type { AncestorPath } from './types';

describe('findLCAInstances', () => {
  it('returns empty when no common ancestor', () => {
    const a: AncestorPath[] = [{ ancestor: 'a', hops: [] }];
    const b: AncestorPath[] = [{ ancestor: 'b', hops: [] }];
    expect(findLCAInstances(a, b)).toEqual([]);
  });

  it('finds a simple LCA', () => {
    const a: AncestorPath[] = [
      { ancestor: 'a', hops: [] },
      { ancestor: 'lca', hops: ['P'] },
    ];
    const b: AncestorPath[] = [
      { ancestor: 'b', hops: [] },
      { ancestor: 'lca', hops: ['M'] },
    ];
    const result = findLCAInstances(a, b);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      ancestor: 'lca', pathA: ['P'], pathB: ['M'],
    });
  });

  it('excludes non-minimal instances (closer ancestor dominates)', () => {
    // A → p1 → top
    // B → p1 → top
    // minimal: via p1 (pathA=[P], pathB=[P])
    // non-minimal: via top (pathA=[P,P], pathB=[P,P])
    const a: AncestorPath[] = [
      { ancestor: 'a', hops: [] },
      { ancestor: 'p1', hops: ['P'] },
      { ancestor: 'top', hops: ['P', 'P'] },
    ];
    const b: AncestorPath[] = [
      { ancestor: 'b', hops: [] },
      { ancestor: 'p1', hops: ['P'] },
      { ancestor: 'top', hops: ['P', 'P'] },
    ];
    const result = findLCAInstances(a, b);
    expect(result).toHaveLength(1);
    expect(result[0].ancestor).toBe('p1');
  });

  it('keeps both instances when paths differ (bilateral)', () => {
    // A and B share lca1 via P on both, AND lca2 via M on both — distinct
    const a: AncestorPath[] = [
      { ancestor: 'a', hops: [] },
      { ancestor: 'lca1', hops: ['P'] },
      { ancestor: 'lca2', hops: ['M'] },
    ];
    const b: AncestorPath[] = [
      { ancestor: 'b', hops: [] },
      { ancestor: 'lca1', hops: ['P'] },
      { ancestor: 'lca2', hops: ['M'] },
    ];
    const result = findLCAInstances(a, b);
    expect(result).toHaveLength(2);
  });
});
```

- [ ] **Step 2 : Rouge**

Run: `cd react-app && npx vitest run src/lib/parenteSonghay/findLCAInstances.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Implémenter**

```ts
// react-app/src/lib/parenteSonghay/findLCAInstances.ts
import type { AncestorPath, Hop, LCAInstance } from './types';

function isPrefix(shorter: Hop[], longer: Hop[]): boolean {
  if (shorter.length >= longer.length) return false;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) return false;
  }
  return true;
}

/**
 * Pour chaque ancêtre commun, produit toutes les combinaisons de chemins,
 * puis filtre les instances non-minimales.
 * Une instance (X, pathA, pathB) est non-minimale s'il existe une autre
 * instance (Y, pathA', pathB') telle que pathA' est un préfixe strict de pathA
 * ET pathB' est un préfixe strict de pathB.
 */
export function findLCAInstances(
  pathsA: AncestorPath[],
  pathsB: AncestorPath[],
): LCAInstance[] {
  const byAncestorA = new Map<string, AncestorPath[]>();
  const byAncestorB = new Map<string, AncestorPath[]>();
  for (const p of pathsA) {
    const list = byAncestorA.get(p.ancestor) ?? [];
    list.push(p);
    byAncestorA.set(p.ancestor, list);
  }
  for (const p of pathsB) {
    const list = byAncestorB.get(p.ancestor) ?? [];
    list.push(p);
    byAncestorB.set(p.ancestor, list);
  }

  const candidates: LCAInstance[] = [];
  for (const [ancestor, listA] of byAncestorA) {
    const listB = byAncestorB.get(ancestor);
    if (!listB) continue;
    for (const a of listA) {
      for (const b of listB) {
        candidates.push({ ancestor, pathA: a.hops, pathB: b.hops });
      }
    }
  }

  // Filtre : une instance (X, pA, pB) est non-minimale si une autre (Y, pA', pB')
  // existe avec pA' préfixe strict de pA ET pB' préfixe strict de pB.
  return candidates.filter((inst) => {
    for (const other of candidates) {
      if (other === inst) continue;
      if (isPrefix(other.pathA, inst.pathA) && isPrefix(other.pathB, inst.pathB)) {
        return false;
      }
    }
    return true;
  });
}
```

- [ ] **Step 4 : Tests verts**

Run: `cd react-app && npx vitest run src/lib/parenteSonghay/findLCAInstances.test.ts`
Expected: 4 tests PASS.

---

### Task 6 : buildTerms (composition des strings Songhay)

**Files:**
- Create: `react-app/src/lib/parenteSonghay/buildTerms.ts`
- Test: `react-app/src/lib/parenteSonghay/buildTerms.test.ts`

- [ ] **Step 1 : Tests (rouge)**

```ts
// react-app/src/lib/parenteSonghay/buildTerms.test.ts
import { describe, it, expect } from 'vitest';
import {
  buildDirectParentTerm,
  buildDirectChildTerm,
  buildKagaTerm,
  buildHaamaTerm,
  buildSiblingTerm,
  buildCrossCousinTerm,
  buildCoteSuffix,
} from './buildTerms';
import { defaultLabels } from './labels';

describe('buildTerms', () => {
  const L = defaultLabels;

  it('direct parent term (father)', () => {
    expect(buildDirectParentTerm('M', L)).toBe('baba');
  });

  it('direct parent term (mother)', () => {
    expect(buildDirectParentTerm('F', L)).toBe('gna');
  });

  it('direct child term is always izé', () => {
    expect(buildDirectChildTerm(L)).toBe('izé');
  });

  it('kaga term with 1 generation repeats once + cote suffix', () => {
    expect(buildKagaTerm('M', 1, 'P', L)).toBe('kaga arou coté baba');
    expect(buildKagaTerm('F', 1, 'M', L)).toBe('kaga woy coté gna');
  });

  it('kaga term with 3 generations repeats kaga 3 times', () => {
    expect(buildKagaTerm('M', 3, 'P', L)).toBe('kaga kaga kaga arou coté baba');
  });

  it('haama term with 1 repetition', () => {
    expect(buildHaamaTerm(1, L)).toBe('haama');
  });

  it('haama term with 3 repetitions', () => {
    expect(buildHaamaTerm(3, L)).toBe('haama haama haama');
  });

  it('sibling term arma for male', () => {
    expect(buildSiblingTerm('M', L)).toBe('arma');
  });

  it('sibling term woyma for female', () => {
    expect(buildSiblingTerm('F', L)).toBe('woyma');
  });

  it('cross cousin term baassa arou for male', () => {
    expect(buildCrossCousinTerm('M', L)).toBe('baassa arou');
  });

  it('cross cousin term baassa woy for female', () => {
    expect(buildCrossCousinTerm('F', L)).toBe('baassa woy');
  });

  it('cote suffix maps hop P → coté baba, M → coté gna', () => {
    expect(buildCoteSuffix('P', L)).toBe('coté baba');
    expect(buildCoteSuffix('M', L)).toBe('coté gna');
  });
});
```

- [ ] **Step 2 : Rouge**

Run: `cd react-app && npx vitest run src/lib/parenteSonghay/buildTerms.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Implémenter**

```ts
// react-app/src/lib/parenteSonghay/buildTerms.ts
import type { Hop, Sex } from './types';

type Labels = Record<string, string>;

export function buildDirectParentTerm(parentSex: Sex, L: Labels): string {
  return parentSex === 'M' ? L['term.baba'] : L['term.gna'];
}

export function buildDirectChildTerm(L: Labels): string {
  return L['term.ize'];
}

export function buildCoteSuffix(firstHop: Hop, L: Labels): string {
  return firstHop === 'P' ? L['term.cote_baba'] : L['term.cote_gna'];
}

/**
 * Construit "kaga [kaga...] arou/woy coté baba/gna".
 * nbKaga >= 1 (niveau 1 = grand-parent, niveau 2 = arrière-grand-parent, etc.)
 */
export function buildKagaTerm(
  ancestorSex: Sex,
  nbKaga: number,
  firstHopOfDescendant: Hop,
  L: Labels,
): string {
  const kagaWord = L[ancestorSex === 'M' ? 'term.kaga_arou' : 'term.kaga_woy'];
  // kaga_arou = "kaga arou" ; on veut nbKaga répétitions du mot "kaga" avant "arou"
  // pour nbKaga=1 : "kaga arou" ; pour nbKaga=2 : "kaga kaga arou"
  const parts = kagaWord.split(' ');
  const lastWord = parts[parts.length - 1]; // "arou" ou "woy"
  const prefixes = Array(nbKaga).fill(parts[0]); // n fois "kaga"
  const base = [...prefixes, lastWord].join(' ');
  return `${base} ${buildCoteSuffix(firstHopOfDescendant, L)}`;
}

/** Construit "haama" ou "haama haama ..." selon la répétition. */
export function buildHaamaTerm(nbRepeat: number, L: Labels): string {
  return Array(nbRepeat).fill(L['term.haama']).join(' ');
}

export function buildSiblingTerm(personSex: Sex, L: Labels): string {
  return personSex === 'M' ? L['term.arma'] : L['term.woyma'];
}

export function buildCrossCousinTerm(personSex: Sex, L: Labels): string {
  return personSex === 'M' ? L['term.baassa_arou'] : L['term.baassa_woy'];
}
```

- [ ] **Step 4 : Tests verts**

Run: `cd react-app && npx vitest run src/lib/parenteSonghay/buildTerms.test.ts`
Expected: 12 tests PASS.

---

### Task 7 : Fixture de test (arbre Sira / Modibo / Hadja / …)

**Files:**
- Create: `react-app/src/lib/parenteSonghay/fixtures/testFamily.ts`

- [ ] **Step 1 : Écrire la fixture complète (28 personnes du spec §6)**

```ts
// react-app/src/lib/parenteSonghay/fixtures/testFamily.ts
import type { PersonDict } from '../types';

/**
 * Arbre de référence du spec algorithme-parente-songhay.md §6.
 * 28 personnes sur 7 générations, incluant des unions intergénérationnelles
 * (Cheick a 2 chemins vers Sira) et des branches parallèle/croisée.
 */
export function makeTestFamily(): PersonDict {
  const p = (id: string, name: string, sex: 'M' | 'F', fatherId: string | null, motherId: string | null) =>
    ({ id, name, sex, fatherId, motherId });

  const dict: PersonDict = {};
  const add = (...persons: ReturnType<typeof p>[]) => {
    for (const person of persons) dict[person.id] = person;
  };

  // G0
  add(p('sira', 'Sira', 'F', null, null));

  // G1 — enfants de Sira
  add(
    p('modibo', 'Modibo', 'M', null, 'sira'),
    p('hadja',  'Hadja',  'F', null, 'sira'),
  );

  // G2 — enfants de Modibo
  add(
    p('drissa', 'Drissa', 'M', 'modibo', null),
    p('sekou',  'Sékou',  'M', 'modibo', null),
    p('awa',    'Awa',    'F', 'modibo', null),
  );

  // G2 — enfants de Hadja
  add(
    p('bourama',  'Bourama',  'M', null, 'hadja'),
    p('tieman',   'Tiéman',   'M', null, 'hadja'),
    p('niamoye',  'Niamoye',  'F', null, 'hadja'),
  );

  // G3 — enfants de Sékou
  add(
    p('bakary',  'Bakary',  'M', 'sekou', null),
    p('adama',   'Adama',   'M', 'sekou', null),
    p('djeneba', 'Djéneba', 'F', 'sekou', null),
  );

  // G3 — enfants de Awa
  add(p('khadidia', 'Khadidia', 'F', null, 'awa'));

  // G3 — enfants de Tiéman
  add(
    p('koniba', 'Koniba', 'M', 'tieman', null),
  );

  // G3 — enfants de Niamoye
  add(p('mariam', 'Mariam', 'F', null, 'niamoye'));

  // Cheick : fils de Bourama (père, branche Hadja) et Djéneba (mère, branche Sékou) — double chemin vers Sira.
  add(p('cheick', 'Cheick', 'M', 'bourama', 'djeneba'));

  // G4 — enfants de Bakary
  add(p('lassana', 'Lassana', 'M', 'bakary', null));

  // G4 — enfants de Koniba
  add(
    p('yaya',  'Yaya',  'M', 'koniba', null),
    p('lalla', 'Lalla', 'F', 'koniba', null),
  );

  // G4 — enfants de Cheick
  add(p('aissata', 'Aïssata', 'F', 'cheick', null));

  // G4 — enfants de Djéneba (Rokia)
  add(p('rokia', 'Rokia', 'F', null, 'djeneba'));

  // G5 — enfants de Lassana
  add(
    p('soumaila', 'Soumaïla', 'M', 'lassana', null),
    p('assa',     'Assa',     'F', 'lassana', null),
  );

  // G5 — enfants de Yaya / Lalla
  add(p('maimouna', 'Maïmouna', 'F', 'yaya', null));

  // G5 — enfants de Rokia
  add(p('issouf', 'Issouf', 'M', null, 'rokia'));

  // G6 — enfants de Soumaïla
  add(
    p('boubou', 'Boubou', 'M', 'soumaila', null),
    p('safi',   'Safi',   'F', 'soumaila', null),
  );

  // G6 — enfants de Issouf
  add(p('nene', 'Néné', 'F', 'issouf', null));

  return dict;
}
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `cd react-app && npx tsc --noEmit -p tsconfig.app.json`
Expected: pas d'erreur.

---

### Task 8 : classify (dispatch central)

**Files:**
- Create: `react-app/src/lib/parenteSonghay/classify.ts`
- Test: `react-app/src/lib/parenteSonghay/classify.test.ts`

- [ ] **Step 1 : Tests — cas de base (rouge)**

```ts
// react-app/src/lib/parenteSonghay/classify.test.ts
import { describe, it, expect } from 'vitest';
import { classifyInstance } from './classify';
import { makeTestFamily } from './fixtures/testFamily';
import { defaultLabels } from './labels';

const dict = makeTestFamily();
const L = defaultLabels;

describe('classify — direct descendant', () => {
  it('Sira ↔ Modibo (parent direct, dA=0, dB=1)', () => {
    const r = classifyInstance(
      dict.sira, dict.modibo,
      { ancestor: 'sira', pathA: [], pathB: ['M'] },
      dict, L,
    );
    if (!('termForA' in r)) throw new Error('expected Relation');
    expect(r.termForA).toBe('gna');
    expect(r.termForB).toBe('izé');
    expect(r.kind).toBe('direct-descendant');
  });

  it('Sira ↔ Sékou (kaga-arou, dist=2)', () => {
    const r = classifyInstance(
      dict.sira, dict.sekou,
      { ancestor: 'sira', pathA: [], pathB: ['P', 'M'] },
      dict, L,
    );
    if (!('termForA' in r)) throw new Error('expected Relation');
    expect(r.termForA).toBe('kaga woy coté baba');
    expect(r.termForB).toBe('haama');
    expect(r.kind).toBe('direct-descendant');
  });
});

describe('classify — same generation', () => {
  it('Modibo ↔ Hadja (vrais frère et sœur via Sira)', () => {
    const r = classifyInstance(
      dict.modibo, dict.hadja,
      { ancestor: 'sira', pathA: ['M'], pathB: ['M'] },
      dict, L,
    );
    if (!('termForA' in r)) throw new Error();
    expect(r.termForA).toBe('arma');
    expect(r.termForB).toBe('woyma');
    expect(r.kind).toBe('parallel');
  });

  it('Khadidia ↔ Djéneba (cousines croisées via Modibo)', () => {
    const r = classifyInstance(
      dict.khadidia, dict.djeneba,
      { ancestor: 'modibo', pathA: ['M', 'P'], pathB: ['P', 'P'] },
      dict, L,
    );
    if (!('termForA' in r)) throw new Error();
    expect(r.termForA).toBe('baassa woy');
    expect(r.termForB).toBe('baassa woy');
    expect(r.kind).toBe('cross');
  });
});

describe('classify — avuncular', () => {
  it('Bakary ↔ Cheick via Sékou (hassa/touba)', () => {
    const r = classifyInstance(
      dict.bakary, dict.cheick,
      { ancestor: 'sekou', pathA: ['P'], pathB: ['M', 'P'] },
      dict, L,
    );
    if (!('termForA' in r)) throw new Error();
    expect(r.termForA).toBe('hassa');
    expect(r.termForB).toBe('touba');
    expect(r.kind).toBe('avuncular');
  });

  it('Djéneba ↔ Lassana (hawa/izé)', () => {
    const r = classifyInstance(
      dict.djeneba, dict.lassana,
      { ancestor: 'sekou', pathA: ['P'], pathB: ['P', 'P'] },
      dict, L,
    );
    if (!('termForA' in r)) throw new Error();
    expect(r.termForA).toBe('hawa');
    expect(r.termForB).toBe('izé');
    expect(r.kind).toBe('avuncular');
  });
});

describe('classify — incomplete path', () => {
  it('returns incomplete when a required parent is null', () => {
    const short: typeof dict = {
      ...dict,
      orphan: { id: 'orphan', name: 'Orphan', sex: 'M', fatherId: null, motherId: null },
    };
    const r = classifyInstance(
      short.orphan, short.modibo,
      { ancestor: 'unknown', pathA: ['P'], pathB: ['P'] },
      short, L,
    );
    expect(r).toEqual({ incomplete: true, missing: expect.any(Array) });
  });
});
```

- [ ] **Step 2 : Rouge**

Run: `cd react-app && npx vitest run src/lib/parenteSonghay/classify.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Implémenter classify.ts**

```ts
// react-app/src/lib/parenteSonghay/classify.ts
import type { LCAInstance, MissingParent, Person, PersonDict, Relation } from './types';
import {
  buildCrossCousinTerm,
  buildDirectChildTerm,
  buildDirectParentTerm,
  buildHaamaTerm,
  buildKagaTerm,
  buildSiblingTerm,
} from './buildTerms';

type Labels = Record<string, string>;
export type ClassifyResult =
  | Omit<Relation, 'via' | 'viaName' | 'pathA' | 'pathB' | 'distanceA' | 'distanceB' | 'proximityScore' | 'balanceScore'>
  | { incomplete: true; missing: MissingParent[] };

function parentOf(p: Person, dict: PersonDict, hop: 'P' | 'M'): Person | null {
  const id = hop === 'P' ? p.fatherId : p.motherId;
  return id ? dict[id] ?? null : null;
}

function classifyDescendant(
  ancestor: Person,
  descendant: Person,
  distance: number,
  firstHop: 'P' | 'M',
  L: Labels,
  reverse: boolean,
): ClassifyResult {
  let termAncestor: string;
  let termDescendant: string;
  if (distance === 1) {
    termAncestor = buildDirectParentTerm(ancestor.sex, L);
    termDescendant = buildDirectChildTerm(L);
  } else {
    termAncestor = buildKagaTerm(ancestor.sex, distance - 1, firstHop, L);
    termDescendant = buildHaamaTerm(distance - 1, L);
  }
  if (reverse) {
    return { kind: 'direct-ascendant', termForA: termDescendant, termForB: termAncestor };
  }
  return { kind: 'direct-descendant', termForA: termAncestor, termForB: termDescendant };
}

function classifySameGen(A: Person, B: Person, instance: LCAInstance, dict: PersonDict, L: Labels): ClassifyResult {
  const parentA = parentOf(A, dict, instance.pathA[0]);
  const parentB = parentOf(B, dict, instance.pathB[0]);
  const missing: MissingParent[] = [];
  if (!parentA) missing.push({ personId: A.id, missing: instance.pathA[0] === 'P' ? 'father' : 'mother' });
  if (!parentB) missing.push({ personId: B.id, missing: instance.pathB[0] === 'P' ? 'father' : 'mother' });
  if (missing.length) return { incomplete: true, missing };
  if (parentA!.sex === parentB!.sex) {
    return { kind: 'parallel', termForA: buildSiblingTerm(A.sex, L), termForB: buildSiblingTerm(B.sex, L) };
  }
  return { kind: 'cross', termForA: buildCrossCousinTerm(A.sex, L), termForB: buildCrossCousinTerm(B.sex, L) };
}

function classifyDelta(
  A: Person, B: Person, instance: LCAInstance, dict: PersonDict, L: Labels,
): ClassifyResult {
  const dA = instance.pathA.length;
  const dB = instance.pathB.length;
  const supIsA = dA < dB;
  const sup = supIsA ? A : B;
  const inf = supIsA ? B : A;
  const pathInf = supIsA ? instance.pathB : instance.pathA;
  const dSup = Math.min(dA, dB);
  const dInf = Math.max(dA, dB);
  const delta = dInf - dSup;

  let termSup: string;
  let termInf: string;

  if (delta === 1) {
    const parentInfTop = parentOf(inf, dict, pathInf[0]);
    if (!parentInfTop) {
      return { incomplete: true, missing: [{ personId: inf.id, missing: pathInf[0] === 'P' ? 'father' : 'mother' }] };
    }
    if (sup.sex === parentInfTop.sex) {
      termSup = buildDirectParentTerm(sup.sex, L);
      termInf = buildDirectChildTerm(L);
    } else if (sup.sex === 'M') {
      termSup = L['term.hassa'];
      termInf = L['term.touba'];
    } else {
      termSup = L['term.hawa'];
      termInf = buildDirectChildTerm(L);
    }
    const r: ClassifyResult = { kind: 'avuncular', termForA: supIsA ? termSup : termInf, termForB: supIsA ? termInf : termSup };
    return r;
  }

  // delta >= 2 : grand-oncle, arrière-grand-oncle, ...
  const nbKaga = delta - 1;
  termSup = buildKagaTerm(sup.sex, nbKaga, pathInf[0], L);
  termInf = buildHaamaTerm(nbKaga, L);
  return { kind: 'distant-vertical', termForA: supIsA ? termSup : termInf, termForB: supIsA ? termInf : termSup };
}

export function classifyInstance(
  A: Person, B: Person, instance: LCAInstance, dict: PersonDict, L: Labels,
): ClassifyResult {
  const dA = instance.pathA.length;
  const dB = instance.pathB.length;
  if (dA === 0) {
    return classifyDescendant(A, B, dB, instance.pathB[0] ?? 'P', L, false);
  }
  if (dB === 0) {
    return classifyDescendant(B, A, dA, instance.pathA[0] ?? 'P', L, true);
  }
  if (dA === dB) {
    return classifySameGen(A, B, instance, dict, L);
  }
  return classifyDelta(A, B, instance, dict, L);
}
```

- [ ] **Step 4 : Tests verts**

Run: `cd react-app && npx vitest run src/lib/parenteSonghay/classify.test.ts`
Expected: 6 tests PASS.

---

### Task 9 : explain (génération de l'explication pédagogique)

**Files:**
- Create: `react-app/src/lib/parenteSonghay/explain.ts`
- Test: `react-app/src/lib/parenteSonghay/explain.test.ts`

- [ ] **Step 1 : Tests (rouge)**

```ts
// react-app/src/lib/parenteSonghay/explain.test.ts
import { describe, it, expect } from 'vitest';
import { explainRelation } from './explain';
import { defaultLabels } from './labels';
import type { Relation } from './types';

const mkRelation = (over: Partial<Relation> = {}): Relation => ({
  termForA: 'hassa', termForB: 'touba',
  kind: 'avuncular',
  via: 'lca', viaName: 'LCA',
  pathA: ['P'], pathB: ['M', 'P'],
  distanceA: 1, distanceB: 2,
  proximityScore: 3, balanceScore: 2,
  ...over,
});

describe('explainRelation', () => {
  it('picks avuncular.hassa template when termForA is hassa', () => {
    const r = mkRelation({ termForA: 'hassa', termForB: 'touba' });
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text).toContain('hassa');
    expect(text.toLowerCase()).toContain('oncle maternel');
  });

  it('picks avuncular.hawa template when termForA is hawa', () => {
    const r = mkRelation({ termForA: 'hawa', termForB: 'izé' });
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text).toContain('hawa');
  });

  it('picks parallel template', () => {
    const r = mkRelation({ kind: 'parallel', termForA: 'arma', termForB: 'woyma', pathA: ['P'], pathB: ['M'], distanceA: 1, distanceB: 1, proximityScore: 2, balanceScore: 1 });
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text.toLowerCase()).toContain('parallèle');
  });

  it('picks cross template', () => {
    const r = mkRelation({ kind: 'cross', termForA: 'baassa arou', termForB: 'baassa woy' });
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text.toLowerCase()).toContain('baassa');
  });

  it('picks distant-vertical template', () => {
    const r = mkRelation({ kind: 'distant-vertical', termForA: 'kaga kaga arou coté baba', termForB: 'haama haama', distanceA: 1, distanceB: 3, proximityScore: 4, balanceScore: 3 });
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text).toContain('kaga');
  });

  it('substitutes placeholders', () => {
    const r = mkRelation();
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text).not.toContain('{');
    expect(text).not.toContain('}');
  });

  it('picks direct-descendant parent for distance 1', () => {
    const r = mkRelation({ kind: 'direct-descendant', termForA: 'baba', termForB: 'izé', pathA: [], pathB: ['P'], distanceA: 0, distanceB: 1, proximityScore: 1, balanceScore: 1 });
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text).toContain('Alice');
    expect(text).toContain('Bob');
  });
});
```

- [ ] **Step 2 : Rouge**

Run: `cd react-app && npx vitest run src/lib/parenteSonghay/explain.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Implémenter explain.ts**

```ts
// react-app/src/lib/parenteSonghay/explain.ts
import type { Relation } from './types';

type Labels = Record<string, string>;

function interpolate(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => (key in vars ? String(vars[key]) : `{${key}}`));
}

function pickTemplate(r: Relation, L: Labels): string {
  switch (r.kind) {
    case 'direct-descendant':
      return r.distanceB === 1 ? L['explain.direct-descendant.parent'] : L['explain.direct-descendant.ancestor'];
    case 'direct-ascendant':
      return r.distanceA === 1 ? L['explain.direct-ascendant.child'] : L['explain.direct-ascendant.descendant'];
    case 'parallel':
      return L['explain.parallel'];
    case 'cross':
      return L['explain.cross'];
    case 'avuncular': {
      const term = r.termForA === L['term.hassa'] || r.termForB === L['term.hassa']
        ? 'hassa'
        : r.termForA === L['term.hawa'] || r.termForB === L['term.hawa']
        ? 'hawa'
        : 'parallel';
      if (term === 'hassa') return L['explain.avuncular.hassa'];
      if (term === 'hawa') return L['explain.avuncular.hawa'];
      return L['explain.avuncular.parallel'];
    }
    case 'distant-vertical':
      return L['explain.distant-vertical'];
  }
}

export function explainRelation(r: Relation, nameA: string, nameB: string, L: Labels): string {
  const tpl = pickTemplate(r, L);
  return interpolate(tpl, {
    nameA, nameB,
    termA: r.termForA, termB: r.termForB,
    lca: r.viaName,
    dA: r.distanceA, dB: r.distanceB,
  });
}
```

- [ ] **Step 4 : Tests verts**

Run: `cd react-app && npx vitest run src/lib/parenteSonghay/explain.test.ts`
Expected: 7 tests PASS.

---

### Task 10 : index.ts — orchestrateur + adaptateur Member → Person

**Files:**
- Create: `react-app/src/lib/parenteSonghay/index.ts`

- [ ] **Step 1 : Implémenter l'orchestrateur**

```ts
// react-app/src/lib/parenteSonghay/index.ts
import type { Member, MemberDict } from '../types';
import { classifyInstance } from './classify';
import { enumeratePaths } from './enumeratePaths';
import { findLCAInstances } from './findLCAInstances';
import { defaultLabels } from './labels';
import type { Person, PersonDict, Relation, RelationResult } from './types';

export * from './types';
export { defaultLabels } from './labels';
export { applyLabels } from './applyLabels';
export { explainRelation } from './explain';

function toPerson(m: Member): Person {
  return { id: m.id, name: m.name, sex: m.gender, fatherId: m.father_id, motherId: m.mother_ref };
}

function toPersonDict(members: MemberDict): PersonDict {
  const out: PersonDict = {};
  for (const id of Object.keys(members)) out[id] = toPerson(members[id]);
  return out;
}

export function computeRelations(
  idA: string,
  idB: string,
  members: MemberDict,
  labels: Record<string, string> = defaultLabels,
): RelationResult {
  if (idA === idB) return { kind: 'same-person' };
  if (!members[idA] || !members[idB]) return { kind: 'no-link' };
  const dict = toPersonDict(members);
  const A = dict[idA];
  const B = dict[idB];
  const pathsA = enumeratePaths(idA, dict);
  const pathsB = enumeratePaths(idB, dict);
  const instances = findLCAInstances(pathsA, pathsB);
  if (instances.length === 0) return { kind: 'no-link' };

  const relations: Relation[] = [];
  const missingMap = new Map<string, 'father' | 'mother'>();

  for (const inst of instances) {
    const classification = classifyInstance(A, B, inst, dict, labels);
    if ('incomplete' in classification) {
      for (const m of classification.missing) missingMap.set(m.personId + ':' + m.missing, m.missing);
      continue;
    }
    const ancestorPerson = dict[inst.ancestor];
    relations.push({
      termForA: classification.termForA,
      termForB: classification.termForB,
      kind: classification.kind,
      via: inst.ancestor,
      viaName: ancestorPerson?.name ?? inst.ancestor,
      pathA: inst.pathA,
      pathB: inst.pathB,
      distanceA: inst.pathA.length,
      distanceB: inst.pathB.length,
      proximityScore: inst.pathA.length + inst.pathB.length,
      balanceScore: Math.max(inst.pathA.length, inst.pathB.length),
    });
  }

  if (relations.length === 0 && missingMap.size > 0) {
    return {
      kind: 'incomplete',
      missingParents: Array.from(missingMap.entries()).map(([k, missing]) => ({
        personId: k.split(':')[0], missing,
      })),
    };
  }
  if (relations.length === 0) return { kind: 'no-link' };

  // Tri par proximité puis équilibre
  relations.sort((a, b) =>
    a.proximityScore !== b.proximityScore
      ? a.proximityScore - b.proximityScore
      : a.balanceScore - b.balanceScore,
  );

  // Déduplication (termForA, termForB, via)
  const seen = new Set<string>();
  const unique = relations.filter((r) => {
    const key = `${r.termForA}|${r.termForB}|${r.via}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { kind: 'relations', relations: unique };
}
```

- [ ] **Step 2 : Vérifier la compilation (après index.ts)**

Run: `cd react-app && npx tsc --noEmit -p tsconfig.app.json`
Expected: pas d'erreur.

---

### Task 11 : Tests d'intégration — 14 cas du spec

**Files:**
- Create: `react-app/src/lib/parenteSonghay/index.test.ts`

- [ ] **Step 1 : Écrire les tests d'intégration**

```ts
// react-app/src/lib/parenteSonghay/index.test.ts
import { describe, it, expect } from 'vitest';
import { computeRelations } from './index';
import { makeTestFamily } from './fixtures/testFamily';
import type { Member, MemberDict } from '../types';

function toMemberDict(dict: ReturnType<typeof makeTestFamily>): MemberDict {
  const out: MemberDict = {};
  for (const id of Object.keys(dict)) {
    const p = dict[id];
    out[id] = {
      id: p.id, name: p.name, first_name: null, alias: null,
      gender: p.sex, generation: 0,
      father_id: p.fatherId, mother_ref: p.motherId,
      spouses: [], children: [], photo_url: null, note: null,
      birth_city: null, birth_country: null, village: null,
    } as Member;
  }
  return out;
}

const members = toMemberDict(makeTestFamily());

function firstTerms(idA: string, idB: string) {
  const r = computeRelations(idA, idB, members);
  if (r.kind !== 'relations') throw new Error(`expected relations, got ${r.kind}`);
  return { termA: r.relations[0].termForA, termB: r.relations[0].termForB, relations: r.relations };
}

describe('computeRelations — Cas de test du spec', () => {
  it('Modibo ↔ Hadja → arma / woyma', () => {
    const { termA, termB } = firstTerms('modibo', 'hadja');
    expect(termA).toBe('arma');
    expect(termB).toBe('woyma');
  });

  it('Bakary ↔ Adama → arma / arma', () => {
    const { termA, termB } = firstTerms('bakary', 'adama');
    expect(termA).toBe('arma');
    expect(termB).toBe('arma');
  });

  it('Drissa ↔ Awa → arma / woyma', () => {
    const { termA, termB } = firstTerms('drissa', 'awa');
    expect(termA).toBe('arma');
    expect(termB).toBe('woyma');
  });

  it('Sira ↔ Modibo → gna / izé', () => {
    const { termA, termB } = firstTerms('sira', 'modibo');
    expect(termA).toBe('gna');
    expect(termB).toBe('izé');
  });

  it('Modibo ↔ Sékou → baba / izé', () => {
    const { termA, termB } = firstTerms('modibo', 'sekou');
    expect(termA).toBe('baba');
    expect(termB).toBe('izé');
  });

  it('Sira ↔ Sékou → kaga woy coté baba / haama', () => {
    const { termA, termB } = firstTerms('sira', 'sekou');
    expect(termA).toBe('kaga woy coté baba');
    expect(termB).toBe('haama');
  });

  it('Sira ↔ Bakary → kaga kaga woy coté baba / haama haama', () => {
    const { termA, termB } = firstTerms('sira', 'bakary');
    expect(termA).toBe('kaga kaga woy coté baba');
    expect(termB).toBe('haama haama');
  });

  it('Modibo ↔ Lassana → kaga kaga arou coté baba / haama haama', () => {
    const { termA, termB } = firstTerms('modibo', 'lassana');
    expect(termA).toBe('kaga kaga arou coté baba');
    expect(termB).toBe('haama haama');
  });

  it('Sira ↔ Boubou → kaga×5 coté baba / haama×5', () => {
    const { termA, termB } = firstTerms('sira', 'boubou');
    expect(termA).toBe('kaga kaga kaga kaga kaga woy coté baba');
    expect(termB).toBe('haama haama haama haama haama');
  });

  it('Bakary ↔ Cheick returns ≥2 relations, first = hassa/touba via Sékou', () => {
    const r = computeRelations('bakary', 'cheick', members);
    if (r.kind !== 'relations') throw new Error();
    expect(r.relations.length).toBeGreaterThanOrEqual(2);
    expect(r.relations[0].termForA).toBe('hassa');
    expect(r.relations[0].termForB).toBe('touba');
    expect(r.relations[0].viaName).toBe('Sékou');
    expect(r.relations[1].termForA).toBe('arma');
    expect(r.relations[1].termForB).toBe('arma');
    expect(r.relations[1].viaName).toBe('Sira');
  });

  it('Djéneba ↔ Lassana → hawa / izé', () => {
    const { termA, termB } = firstTerms('djeneba', 'lassana');
    expect(termA).toBe('hawa');
    expect(termB).toBe('izé');
  });

  it('Bakary ↔ Koniba → arma / arma', () => {
    const { termA, termB } = firstTerms('bakary', 'koniba');
    expect(termA).toBe('arma');
    expect(termB).toBe('arma');
  });

  it('Soumaïla ↔ Aïssata → arma / woyma', () => {
    const { termA, termB } = firstTerms('soumaila', 'aissata');
    expect(termA).toBe('arma');
    expect(termB).toBe('woyma');
  });

  it('Boubou ↔ Néné → arma / woyma', () => {
    const { termA, termB } = firstTerms('boubou', 'nene');
    expect(termA).toBe('arma');
    expect(termB).toBe('woyma');
  });

  it('returns no-link when no common ancestor', () => {
    const extraMembers: MemberDict = {
      ...members,
      stranger: {
        ...members.sira, id: 'stranger', name: 'Stranger',
        father_id: null, mother_ref: null,
      },
    };
    const r = computeRelations('stranger', 'bakary', extraMembers);
    expect(r.kind).toBe('no-link');
  });

  it('Khadidia ↔ Niamoye → izé / gna', () => {
    const { termA, termB } = firstTerms('khadidia', 'niamoye');
    expect(termA).toBe('izé');
    expect(termB).toBe('gna');
  });

  it('Khadidia ↔ Mariam → woyma / woyma', () => {
    const { termA, termB } = firstTerms('khadidia', 'mariam');
    expect(termA).toBe('woyma');
    expect(termB).toBe('woyma');
  });

  it('Khadidia ↔ Djéneba → baassa woy / baassa woy', () => {
    const { termA, termB } = firstTerms('khadidia', 'djeneba');
    expect(termA).toBe('baassa woy');
    expect(termB).toBe('baassa woy');
  });

  it('returns same-person when idA === idB', () => {
    const r = computeRelations('sira', 'sira', members);
    expect(r).toEqual({ kind: 'same-person' });
  });
});
```

- [ ] **Step 2 : Lancer tous les tests**

Run: `cd react-app && npx vitest run src/lib/parenteSonghay/`
Expected: tous PASS (applyLabels ×4, enumeratePaths ×6, findLCAInstances ×4, buildTerms ×12, classify ×6, explain ×7, index ×19 ≈ **58 tests verts**).

- [ ] **Step 3 : Commit — fin de la phase moteur**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add react-app/src/lib/parenteSonghay/
git commit -m "$(cat <<'EOF'
feat(parente): moteur de calcul songhay conforme au spec

New pure TypeScript engine under lib/parenteSonghay/ implementing the
Songhay kinship algorithm from algorithme-parente-songhay.md:
- types, labels, applyLabels, enumeratePaths, findLCAInstances,
  buildTerms, classify, explain, index orchestrator
- 58 tests passing covering the 14 spec test cases (Sira/Modibo/
  Hadja/Cheick/Bakary/Khadidia/Mariam/etc), including the key
  Cheick↔Bakary multi-relation case.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — SQL migration + provider labels

### Task 12 : Migration SQL `013_parente_labels.sql`

**Files:**
- Create: `supabase/migrations/013_parente_labels.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
-- supabase/migrations/013_parente_labels.sql
DROP TABLE IF EXISTS term_audit_log;
DROP TABLE IF EXISTS relation_terms;
DROP TABLE IF EXISTS relation_categories;
DROP FUNCTION IF EXISTS update_relation_terms_updated_at();

CREATE TABLE parente_labels (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_parente_labels_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_parente_labels_updated_at ON parente_labels;
CREATE TRIGGER trg_parente_labels_updated_at
  BEFORE UPDATE ON parente_labels
  FOR EACH ROW EXECUTE FUNCTION update_parente_labels_updated_at();

ALTER TABLE parente_labels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'parente_labels_read') THEN
    CREATE POLICY "parente_labels_read" ON parente_labels
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'parente_labels_admin_write') THEN
    CREATE POLICY "parente_labels_admin_write" ON parente_labels
      FOR ALL TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;
```

- [ ] **Step 2 : Ne pas exécuter automatiquement** — informer l'utilisateur en fin d'implémentation que la migration s'applique manuellement sur la DB distante (convention du projet).

---

### Task 13 : Hook + Provider useParenteLabels

**Files:**
- Create: `react-app/src/hooks/useParenteLabels.tsx`
- Modify: `react-app/src/App.tsx`

- [ ] **Step 1 : Écrire le hook et le Provider**

```tsx
// react-app/src/hooks/useParenteLabels.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { applyLabels, defaultLabels } from '../lib/parenteSonghay';

interface ParenteLabelsContextValue {
  labels: Record<string, string>;
  overrides: Record<string, string>;
  defaults: Record<string, string>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ParenteLabelsContext = createContext<ParenteLabelsContextValue | null>(null);

export function ParenteLabelsProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('parente_labels').select('key, value');
    if (err) {
      console.warn('[parente] labels fetch failed, falling back to defaults:', err.message);
      setError(err.message);
      setOverrides({});
    } else {
      const dict: Record<string, string> = {};
      for (const row of data ?? []) {
        dict[(row as { key: string }).key] = (row as { value: string }).value;
      }
      setOverrides(dict);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const labels = useMemo(() => applyLabels(overrides), [overrides]);

  const value: ParenteLabelsContextValue = {
    labels, overrides, defaults: defaultLabels, loading, error, refetch,
  };

  return (
    <ParenteLabelsContext.Provider value={value}>{children}</ParenteLabelsContext.Provider>
  );
}

export function useParenteLabels(): ParenteLabelsContextValue {
  const ctx = useContext(ParenteLabelsContext);
  if (!ctx) throw new Error('useParenteLabels must be used within ParenteLabelsProvider');
  return ctx;
}
```

- [ ] **Step 2 : Monter le Provider dans `App.tsx`**

Edit `react-app/src/App.tsx` :
- Ajouter l'import : `import { ParenteLabelsProvider } from './hooks/useParenteLabels';`
- Wrapper `<BrowserRouter>...</BrowserRouter>` à l'intérieur de `<MembersProvider>` par `<ParenteLabelsProvider>` :

```tsx
  return (
    <MembersProvider>
      <ParenteLabelsProvider>
        <BrowserRouter>
          <div className="app">
            <Header />
            <ConnStatus />
            <main>
              <Routes>
                <Route path="/" element={<FamillePage />} />
                <Route path="/recherche" element={<RecherchePage />} />
                <Route path="/parente" element={<ParentePage />} />
                <Route path="/contribuer" element={<ContribuerPage />} />
                <Route path="/mes-suggestions" element={<MesSuggestionsPage />} />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  }
                />
              </Routes>
            </main>
            <BottomNav />
          </div>
        </BrowserRouter>
      </ParenteLabelsProvider>
    </MembersProvider>
  );
```

- [ ] **Step 3 : Vérifier le build**

Run: `cd react-app && npm run build`
Expected: build OK.

- [ ] **Step 4 : Commit**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add supabase/migrations/013_parente_labels.sql react-app/src/hooks/useParenteLabels.tsx react-app/src/App.tsx
git commit -m "$(cat <<'EOF'
feat(parente): hook et provider pour les libelles externalises

- SQL migration 013 replaces the old 3-table system (relation_categories,
  relation_terms, term_audit_log) with a single minimal parente_labels
  override table.
- ParenteLabelsProvider fetches the table on mount and merges
  overrides over lib/parenteSonghay/labels.ts defaults. Silent fallback
  to defaults when the DB call fails.
- App.tsx mounts the new provider.

NOTE: the SQL migration must be applied manually on the remote DB.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---


## Phase 3 — UI : PersonPicker (commit `feat(parente): composant PersonPicker`)

### Task 14 : PersonPicker (autocomplete accent-insensible)

**Files:**
- Create: `react-app/src/components/relationship/PersonPicker.tsx`

- [ ] **Step 1 : Écrire le composant**

```tsx
// react-app/src/components/relationship/PersonPicker.tsx
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { MemberDict } from '../../lib/types';

interface Props {
  label: string;
  value: string | null;
  members: MemberDict;
  onChange: (id: string | null) => void;
  side: 'a' | 'b';
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
}

export default function PersonPicker({ label, value, members, onChange, side }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const all = useMemo(
    () =>
      Object.values(members).sort((a, b) =>
        a.generation !== b.generation ? a.generation - b.generation : a.name.localeCompare(b.name, 'fr'),
      ),
    [members],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return all.slice(0, 10);
    const q = normalize(query.trim());
    const terms = q.split(/\s+/);
    const scored = all
      .map((m) => {
        const hay = normalize(`${m.name} ${m.first_name ?? ''} ${m.alias ?? ''} ${m.note ?? ''}`);
        if (!terms.every((t) => hay.includes(t))) return null;
        let score = 0;
        for (const t of terms) {
          if (normalize(m.name).startsWith(t) || (m.alias && normalize(m.alias).startsWith(t))) score += 3;
          else if (normalize(m.name).split(/\s+/).some((w) => w.startsWith(t))) score += 2;
          else score += 1;
        }
        return { m, score };
      })
      .filter(Boolean) as { m: (typeof all)[number]; score: number }[];
    scored.sort((a, b) => b.score - a.score || a.m.name.localeCompare(b.m.name, 'fr'));
    return scored.slice(0, 10).map((s) => s.m);
  }, [query, all]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setActiveIdx(0); }, [query]);

  const selected = value ? members[value] : null;

  const handleSelect = (id: string) => {
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
    onChange(id);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[activeIdx]) handleSelect(filtered[activeIdx].id); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div className={`parente-pc ${side}`} ref={containerRef}>
      <div className="parente-pc-l">{label}</div>

      {selected && !open ? (
        <div className="parente-pc-r" onClick={() => { setQuery(''); setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}>
          <div className={`parente-av ${selected.gender === 'F' ? 'f' : 'm'}`}>
            {initials(selected.name)}
            <span className="parente-av-g">G{selected.generation}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="parente-pc-nm" title={selected.name}>{selected.name}</div>
            <div className="parente-pc-mt">
              <span>{selected.gender === 'F' ? '\u2640' : '\u2642'}</span>{' '}Génération {selected.generation}
            </div>
          </div>
          <button
            className="parente-pc-clear"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            aria-label="Effacer la sélection"
          >&times;</button>
        </div>
      ) : (
        <div className="member-search-input-wrap">
          <span className="member-search-icon">{'\uD83D\uDD0D'}</span>
          <input
            ref={inputRef}
            type="text"
            className="member-search-input"
            placeholder="Rechercher un membre..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKey}
            aria-label={label}
          />
          {query && (
            <button className="member-search-clear" onClick={() => setQuery('')} aria-label="Effacer">&times;</button>
          )}
        </div>
      )}

      {open && (
        <div className="member-search-dropdown" role="listbox">
          {filtered.length === 0 ? (
            <div className="member-search-empty">Aucun résultat</div>
          ) : (
            filtered.map((m, idx) => (
              <div
                key={m.id}
                className={`member-search-item${idx === activeIdx ? ' active' : ''}${m.id === value ? ' selected' : ''}`}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => handleSelect(m.id)}
              >
                <span className="member-search-name">
                  {m.name}
                  {m.alias ? <span className="member-search-alias"> ({m.alias})</span> : null}
                </span>
                <span className="member-search-gender">{m.gender === 'F' ? '\u2640' : '\u2642'}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier le build**

Run: `cd react-app && npm run build`
Expected: build OK (le composant n'est pas encore importé par la page mais doit compiler).

- [ ] **Step 3 : Commit**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add react-app/src/components/relationship/PersonPicker.tsx
git commit -m "$(cat <<'EOF'
feat(parente): composant PersonPicker avec autocomplete accent-insensible

Replaces MemberAutocomplete (old) with a simpler, keyboard-navigable
picker. Case-insensitive, accent-insensitive (NFD normalization),
prefix+substring matching over name+first_name+alias+note. Arrow keys
navigate, Enter selects, Escape closes. Visual accent per side (a/b).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — UI : Sous-composants du modal

### Task 15 : SubTreeSvg (rendu SVG hybride + zoom/pan)

**Files:**
- Create: `react-app/src/components/relationship/SubTreeSvg.tsx`

Ce composant rend un sous-arbre pour UNE relation. Nœuds en HTML (via positionnement absolu), arêtes et badges P/M en SVG overlay, le tout wrappé dans un `<div>` qui porte `transform: translate(px, py) scale(zoom)`.

- [ ] **Step 1 : Écrire le composant complet**

```tsx
// react-app/src/components/relationship/SubTreeSvg.tsx
import { useEffect, useMemo, useRef, useState, useCallback, type PointerEvent, type WheelEvent } from 'react';
import type { Member } from '../../lib/types';
import type { Relation } from '../../lib/parenteSonghay';
import { useParenteLabels } from '../../hooks/useParenteLabels';

interface Props {
  relation: Relation;
  personA: Member;
  personB: Member;
  ancestor: Member;
  getMember: (id: string) => Member | undefined;
}

interface NodeBox {
  id: string;
  name: string;
  role: 'A' | 'B' | 'LCA' | 'mid';
  sex: 'M' | 'F';
  x: number;
  y: number;
  term?: string;
  gloss?: string;
}

interface EdgeLine {
  x1: number; y1: number; x2: number; y2: number;
  label: 'P' | 'M';
  mx: number; my: number;
}

const NODE_W = 150;
const NODE_H = 72;
const V_GAP = 100;   // espace vertical entre générations
const H_SIDE_OFFSET = 110; // décalage horizontal gauche/droite depuis le centre

function gloss(term: string, L: Record<string, string>): string | undefined {
  // Cherche une clé gloss.X dont le term.X correspond au terme donné (pour les termes atomiques).
  for (const k of Object.keys(L)) {
    if (k.startsWith('term.') && L[k] === term) {
      const glossKey = k.replace('term.', 'gloss.');
      if (L[glossKey]) return L[glossKey];
    }
  }
  return undefined;
}

export default function SubTreeSvg({ relation, personA, personB, ancestor, getMember }: Props) {
  const { labels } = useParenteLabels();
  const { boxes, edges, width, height } = useMemo(() => layout(relation, personA, personB, ancestor, getMember, labels),
    [relation, personA, personB, ancestor, getMember, labels]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ startX: number; startY: number; startPan: { x: number; y: number } } | null>(null);

  const resetView = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = viewportRef.current;
      const vw = el?.clientWidth || 800;
      const vh = el?.clientHeight || 440;
      const sx = vw / (width + 40);
      const sy = vh / (height + 40);
      const z = Math.max(0.3, Math.min(3, Math.min(sx, sy)));
      setZoom(z);
      setPan({ x: (vw - width * z) / 2, y: 20 });
    }));
  }, [width, height]);

  useEffect(() => { resetView(); }, [resetView]);

  const onPointerDown = (e: PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging({ startX: e.clientX, startY: e.clientY, startPan: pan });
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    setPan({ x: dragging.startPan.x + (e.clientX - dragging.startX), y: dragging.startPan.y + (e.clientY - dragging.startY) });
  };
  const onPointerUp = () => setDragging(null);

  const onWheel = (e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setZoom((z) => Math.max(0.3, Math.min(3, z * delta)));
  };

  return (
    <div className="parente-subtree-wrap">
      <div
        ref={viewportRef}
        className={`parente-subtree-viewport${dragging ? ' dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className="parente-subtree-inner"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width, height }}
        >
          <svg width={width} height={height} className="parente-subtree-svg">
            {edges.map((e, i) => (
              <g key={`edge-${i}`}>
                <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} className="parente-edge" />
                <g transform={`translate(${e.mx - 10}, ${e.my - 9})`}>
                  <rect width="20" height="18" rx="4" className="parente-edge-pm-bg" />
                  <text x="10" y="13" textAnchor="middle" className="parente-edge-pm-text">{e.label}</text>
                </g>
              </g>
            ))}
          </svg>
          {boxes.map((b) => (
            <div
              key={b.id}
              className={`parente-node role-${b.role} sex-${b.sex}`}
              style={{ left: b.x, top: b.y, width: NODE_W, height: NODE_H }}
              role="button"
              aria-label={`${b.name}, ${b.sex === 'F' ? 'femme' : 'homme'}`}
            >
              <div className="parente-node-name">{b.name}</div>
              {b.role !== 'mid' && (
                <div className="parente-node-tag">{b.role}</div>
              )}
              {b.term && (
                <div className="parente-node-term">
                  <em lang="son">« {b.term} »</em>
                  {b.gloss && <div className="parente-node-gloss">{b.gloss}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="parente-zoom-controls">
        <button onClick={() => setZoom((z) => Math.max(0.3, z / 1.15))} aria-label="Dézoomer">−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(3, z * 1.15))} aria-label="Zoomer">+</button>
        <button onClick={resetView} aria-label="Réinitialiser">⟲</button>
      </div>

      <div className="parente-legend">
        <span className="legend-item"><span className="dot a" /> Personne A</span>
        <span className="legend-item"><span className="dot b" /> Personne B</span>
        <span className="legend-item"><span className="dot lca" /> Ancêtre commun</span>
        <span className="legend-item"><span className="dot-pm">P</span> chaîne paternelle</span>
        <span className="legend-item"><span className="dot-pm">M</span> chaîne maternelle</span>
      </div>
    </div>
  );
}

function layout(
  r: Relation, A: Member, B: Member, lca: Member,
  getMember: (id: string) => Member | undefined,
  L: Record<string, string>,
): { boxes: NodeBox[]; edges: EdgeLine[]; width: number; height: number } {
  // La branche A remonte depuis A (bas-gauche) vers LCA (haut-centre).
  // pathA contient les hops (P ou M) de A vers LCA. Longueur = dA.
  // Ancêtres intermédiaires sont A.fatherId/motherId puis de proche en proche.
  const chainA: Member[] = [A];
  let cursor: Member | undefined = A;
  for (const hop of r.pathA) {
    if (!cursor) break;
    const nextId = hop === 'P' ? cursor.father_id : cursor.mother_ref;
    const next = nextId ? getMember(nextId) ?? undefined : undefined;
    if (!next) break;
    chainA.push(next);
    cursor = next;
  }
  const chainB: Member[] = [B];
  cursor = B;
  for (const hop of r.pathB) {
    if (!cursor) break;
    const nextId = hop === 'P' ? cursor.father_id : cursor.mother_ref;
    const next = nextId ? getMember(nextId) ?? undefined : undefined;
    if (!next) break;
    chainB.push(next);
    cursor = next;
  }

  // LCA est le dernier élément de chainA (et de chainB).
  const dA = r.distanceA;
  const dB = r.distanceB;
  const depth = Math.max(dA, dB);

  // LCA en haut centre. On prend un centre horizontal à x=H_SIDE_OFFSET + NODE_W/2
  const centerX = H_SIDE_OFFSET;
  const width = 2 * H_SIDE_OFFSET + NODE_W;
  const height = (depth + 1) * V_GAP + NODE_H;

  const boxes: NodeBox[] = [];
  const edges: EdgeLine[] = [];

  // Place LCA
  const lcaBox: NodeBox = {
    id: lca.id, name: lca.name, role: 'LCA', sex: lca.gender,
    x: centerX, y: 20,
  };
  boxes.push(lcaBox);

  // Chaîne A (gauche) : du LCA descendant vers A
  // chainA[0] = A (niveau depth), chainA[dA] = LCA (niveau 0)
  for (let i = 1; i <= dA; i++) {
    const member = chainA[dA - i]; // descend
    const level = i;
    const isA = i === dA;
    const x = dA === 0 ? centerX : centerX - H_SIDE_OFFSET * (1 - (dA === 1 ? 0 : (i - 1) / (dA - 1) * 0)); // simple: toutes à -H_SIDE_OFFSET
    const finalX = dA === 1 ? centerX - H_SIDE_OFFSET : centerX - H_SIDE_OFFSET;
    const y = 20 + level * V_GAP;
    const termA = isA ? r.termForA : undefined;
    boxes.push({
      id: member.id, name: member.name,
      role: isA ? 'A' : 'mid', sex: member.gender,
      x: finalX, y,
      term: termA,
      gloss: termA ? gloss(termA, L) : undefined,
    });
    // Arête depuis parent (niveau i-1) vers ce nœud (niveau i)
    const parentBox = boxes[boxes.length - 2]; // ajouté juste avant OU LCA
    const parentX = i === 1 ? lcaBox.x : parentBox.x;
    const parentY = i === 1 ? lcaBox.y : parentBox.y;
    const hop = r.pathA[dA - i]; // hop entre parent et child
    edges.push({
      x1: parentX + NODE_W / 2, y1: parentY + NODE_H,
      x2: finalX + NODE_W / 2,  y2: y,
      label: hop,
      mx: (parentX + finalX) / 2 + NODE_W / 2,
      my: (parentY + NODE_H + y) / 2,
    });
  }

  // Chaîne B (droite)
  for (let i = 1; i <= dB; i++) {
    const member = chainB[dB - i];
    const isB = i === dB;
    const finalX = centerX + H_SIDE_OFFSET;
    const y = 20 + i * V_GAP;
    const termB = isB ? r.termForB : undefined;
    boxes.push({
      id: member.id, name: member.name,
      role: isB ? 'B' : 'mid', sex: member.gender,
      x: finalX, y,
      term: termB,
      gloss: termB ? gloss(termB, L) : undefined,
    });
    const parentX = i === 1 ? lcaBox.x : finalX;
    const parentY = i === 1 ? lcaBox.y : 20 + (i - 1) * V_GAP;
    const hop = r.pathB[dB - i];
    edges.push({
      x1: parentX + NODE_W / 2, y1: parentY + NODE_H,
      x2: finalX + NODE_W / 2,  y2: y,
      label: hop,
      mx: (parentX + finalX) / 2 + NODE_W / 2,
      my: (parentY + NODE_H + y) / 2,
    });
  }

  return { boxes, edges, width, height };
}
```

- [ ] **Step 2 : Ajouter le CSS minimal dans `global.css`**

Edit `react-app/src/styles/global.css` — ajouter à la fin (avant la dernière balise `}` de media queries ou tout simplement en fin de fichier) :

```css
/* ========== Parenté — modal et sous-arbre ========== */
.parente-subtree-wrap { position: relative; }
.parente-subtree-viewport { position: relative; width: 100%; height: 440px; overflow: hidden; cursor: grab; background: var(--sh-deep, #0c1020); border: 1px solid var(--sh-bdr, rgba(255,255,255,0.06)); border-radius: 12px; }
.parente-subtree-viewport.dragging { cursor: grabbing; }
.parente-subtree-inner { position: relative; transform-origin: top left; }
.parente-subtree-svg { position: absolute; top: 0; left: 0; pointer-events: none; }
.parente-edge { stroke: rgba(212,168,83,0.35); stroke-width: 1.5; fill: none; }
.parente-edge-pm-bg { fill: rgba(255,255,255,0.08); stroke: rgba(255,255,255,0.15); }
.parente-edge-pm-text { fill: #ece8e0; font-size: 11px; font-family: var(--sh-sans, sans-serif); }

.parente-node { position: absolute; border-radius: 12px; padding: 8px 12px; display: flex; flex-direction: column; gap: 2px; justify-content: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); }
.parente-node.role-A { background: rgba(112,144,255,0.12); border-color: rgba(112,144,255,0.4); }
.parente-node.role-B { background: rgba(224,132,90,0.12); border-color: rgba(224,132,90,0.4); }
.parente-node.role-LCA { background: rgba(212,168,83,0.16); border-color: rgba(212,168,83,0.45); }
.parente-node-name { font-weight: 600; font-size: 13px; color: #ece8e0; line-height: 1.15; }
.parente-node-tag { position: absolute; top: -8px; right: -8px; background: var(--sh-gold, #d4a853); color: #111; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 999px; }
.parente-node-term { margin-top: 4px; }
.parente-node-term em { font-family: var(--sh-serif, Georgia, serif); font-style: italic; color: var(--sh-terra, #e0845a); font-size: 13px; }
.parente-node-gloss { font-size: 9px; color: #888; }

.parente-zoom-controls { position: absolute; bottom: 12px; right: 12px; display: flex; gap: 6px; align-items: center; background: rgba(0,0,0,0.6); padding: 6px 10px; border-radius: 999px; font-size: 12px; color: #ece8e0; backdrop-filter: blur(6px); }
.parente-zoom-controls button { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: inherit; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; font-size: 13px; display: grid; place-items: center; }
.parente-zoom-controls button:hover { background: rgba(255,255,255,0.08); }

.parente-legend { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 10px; font-size: 11px; color: #888; }
.parente-legend .dot { display: inline-block; width: 10px; height: 10px; border-radius: 999px; margin-right: 4px; vertical-align: middle; }
.parente-legend .dot.a { background: rgba(112,144,255,0.5); }
.parente-legend .dot.b { background: rgba(224,132,90,0.5); }
.parente-legend .dot.lca { background: rgba(212,168,83,0.55); }
.parente-legend .dot-pm { display: inline-block; width: 18px; height: 18px; border-radius: 4px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); text-align: center; font-size: 10px; line-height: 16px; margin-right: 4px; vertical-align: middle; }
```

- [ ] **Step 3 : Vérifier le build (pas d'usage encore du composant)**

Run: `cd react-app && npm run build`
Expected: build OK.

---

### Task 16 : RelationSelector (pills avec troncature à 3)

**Files:**
- Create: `react-app/src/components/relationship/RelationSelector.tsx`

- [ ] **Step 1 : Écrire le composant**

```tsx
// react-app/src/components/relationship/RelationSelector.tsx
import { useEffect, useState } from 'react';
import type { Relation } from '../../lib/parenteSonghay';

interface Props {
  relations: Relation[];
  activeIndex: number;
  onChange: (index: number) => void;
}

const DEFAULT_VISIBLE = 3;

export default function RelationSelector({ relations, activeIndex, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Si l'utilisateur navigue au clavier vers un index >= DEFAULT_VISIBLE, déplier automatiquement.
  useEffect(() => {
    if (activeIndex >= DEFAULT_VISIBLE) setExpanded(true);
  }, [activeIndex]);

  // Réinitialiser expanded si la liste change
  useEffect(() => { setExpanded(false); }, [relations]);

  if (relations.length <= 1) return null;

  const visible = expanded ? relations : relations.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = relations.length - DEFAULT_VISIBLE;

  return (
    <div className="parente-selector" role="tablist" aria-label="Relations trouvées">
      {visible.map((r, i) => (
        <button
          key={`${r.via}-${i}`}
          type="button"
          role="tab"
          aria-selected={i === activeIndex}
          className={`parente-selector-pill${i === activeIndex ? ' active' : ''}`}
          onClick={() => onChange(i)}
        >
          <span className="pill-num">{String(i + 1).padStart(2, '0')}</span>
          <span className="pill-terms">{r.termForA} / {r.termForB}</span>
          <span className="pill-via">via {r.viaName}</span>
        </button>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          className="parente-selector-more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? '− Masquer' : `+ Voir les ${hiddenCount} autre${hiddenCount > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : Ajouter le CSS**

Append to `react-app/src/styles/global.css` :

```css
.parente-selector { display: flex; gap: 8px; padding: 12px 0; overflow-x: auto; flex-wrap: wrap; }
.parente-selector-pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; background: rgba(212,168,83,0.1); border: 1px solid rgba(212,168,83,0.25); color: var(--sh-gold, #d4a853); font-size: 11px; cursor: pointer; font-family: var(--sh-sans, sans-serif); white-space: nowrap; }
.parente-selector-pill.active { background: var(--sh-gold, #d4a853); color: #111; border-color: var(--sh-gold, #d4a853); font-weight: 600; }
.parente-selector-pill .pill-num { font-weight: 700; opacity: 0.7; }
.parente-selector-pill .pill-terms { font-family: var(--sh-serif, Georgia, serif); font-style: italic; }
.parente-selector-pill .pill-via { opacity: 0.7; font-size: 10px; }
.parente-selector-more { padding: 8px 14px; border-radius: 999px; background: transparent; border: 1px dashed rgba(255,255,255,0.15); color: #9ca3af; font-size: 11px; cursor: pointer; }
.parente-selector-more:hover { background: rgba(255,255,255,0.04); color: #ece8e0; }
```

- [ ] **Step 3 : Build**

Run: `cd react-app && npm run build`
Expected: OK.

---

### Task 17 : ReciprocalStatements

**Files:**
- Create: `react-app/src/components/relationship/ReciprocalStatements.tsx`

- [ ] **Step 1 : Écrire le composant**

```tsx
// react-app/src/components/relationship/ReciprocalStatements.tsx
import type { Relation } from '../../lib/parenteSonghay';

interface Props {
  relation: Relation;
  nameA: string;
  nameB: string;
}

export default function ReciprocalStatements({ relation, nameA, nameB }: Props) {
  return (
    <div className="parente-reciprocal">
      <div className="parente-reciprocal-row">
        <strong>{nameA}</strong>
        <span className="verb">est</span>
        <em lang="son" className="term">{relation.termForA}</em>
        <span className="verb">pour</span>
        <strong>{nameB}</strong>
      </div>
      <div className="parente-reciprocal-row">
        <strong>{nameB}</strong>
        <span className="verb">est</span>
        <em lang="son" className="term">{relation.termForB}</em>
        <span className="verb">pour</span>
        <strong>{nameA}</strong>
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : CSS**

```css
.parente-reciprocal { display: flex; flex-direction: column; gap: 8px; padding: 16px; background: rgba(212,168,83,0.06); border-left: 3px solid var(--sh-gold, #d4a853); border-radius: 6px; margin-bottom: 14px; }
.parente-reciprocal-row { font-size: 15px; color: #ece8e0; line-height: 1.4; display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; }
.parente-reciprocal-row .verb { color: #888; font-size: 13px; }
.parente-reciprocal-row .term { font-family: var(--sh-serif, Georgia, serif); font-style: italic; color: var(--sh-terra, #e0845a); font-size: 17px; }
```

---

### Task 18 : TechnicalDetails

**Files:**
- Create: `react-app/src/components/relationship/TechnicalDetails.tsx`

- [ ] **Step 1 : Écrire**

```tsx
// react-app/src/components/relationship/TechnicalDetails.tsx
import type { Relation, Hop } from '../../lib/parenteSonghay';
import type { Member } from '../../lib/types';

interface Props {
  relation: Relation;
  personA: Member;
  personB: Member;
  getMember: (id: string) => Member | undefined;
}

function describeChain(start: Member, hops: Hop[], getMember: (id: string) => Member | undefined): string {
  const segments: string[] = [start.name];
  let cursor: Member | undefined = start;
  for (const hop of hops) {
    if (!cursor) break;
    const parentId = hop === 'P' ? cursor.father_id : cursor.mother_ref;
    const parent = parentId ? getMember(parentId) : undefined;
    if (!parent) break;
    const relationWord = hop === 'P' ? 'père' : 'mère';
    const possessive = parent.gender === 'F' ? 'sa' : 'son';
    segments.push(`${possessive} ${relationWord} ${parent.name}`);
    cursor = parent;
  }
  return segments.join(' → ');
}

export default function TechnicalDetails({ relation, personA, personB, getMember }: Props) {
  const pathADesc = describeChain(personA, relation.pathA, getMember);
  const pathBDesc = describeChain(personB, relation.pathB, getMember);

  return (
    <div className="parente-tech-details">
      <div className="tech-title">Détails techniques</div>
      <dl>
        <dt>Chemin A</dt><dd>{pathADesc}</dd>
        <dt>Chemin B</dt><dd>{pathBDesc}</dd>
        <dt>Distances</dt><dd>dA = {relation.distanceA}, dB = {relation.distanceB}</dd>
        <dt>Proximité</dt><dd>{relation.proximityScore}</dd>
        <dt>Équilibre</dt><dd>{relation.balanceScore}</dd>
      </dl>
    </div>
  );
}
```

- [ ] **Step 2 : CSS**

```css
.parente-tech-details { padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; font-size: 12px; color: #9ca3af; margin-bottom: 14px; }
.parente-tech-details .tech-title { text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px; margin-bottom: 8px; color: #6b7280; }
.parente-tech-details dl { display: grid; grid-template-columns: 90px 1fr; gap: 4px 12px; margin: 0; }
.parente-tech-details dt { color: #6b7280; }
.parente-tech-details dd { color: #ece8e0; margin: 0; }
```

---

### Task 19 : PedagogicalExplanation

**Files:**
- Create: `react-app/src/components/relationship/PedagogicalExplanation.tsx`

- [ ] **Step 1 : Écrire**

```tsx
// react-app/src/components/relationship/PedagogicalExplanation.tsx
import { explainRelation, type Relation } from '../../lib/parenteSonghay';
import { useParenteLabels } from '../../hooks/useParenteLabels';

interface Props {
  relation: Relation;
  nameA: string;
  nameB: string;
}

export default function PedagogicalExplanation({ relation, nameA, nameB }: Props) {
  const { labels } = useParenteLabels();
  const text = explainRelation(relation, nameA, nameB, labels);
  return (
    <div className="parente-explain">
      <p>{text}</p>
    </div>
  );
}
```

- [ ] **Step 2 : CSS**

```css
.parente-explain { padding: 14px 16px; background: rgba(212,168,83,0.05); border-radius: 6px; font-family: var(--sh-serif, Georgia, serif); font-style: italic; font-size: 14px; color: #ece8e0; line-height: 1.6; }
```

---

### Task 20 : DetailedView (regroupe les 3 sous-composants, scrollable, gère troncature 3 cards par défaut)

**Files:**
- Create: `react-app/src/components/relationship/DetailedView.tsx`

- [ ] **Step 1 : Écrire**

```tsx
// react-app/src/components/relationship/DetailedView.tsx
import { useState, useEffect, useRef } from 'react';
import type { Relation } from '../../lib/parenteSonghay';
import type { Member } from '../../lib/types';
import ReciprocalStatements from './ReciprocalStatements';
import TechnicalDetails from './TechnicalDetails';
import PedagogicalExplanation from './PedagogicalExplanation';

interface Props {
  relations: Relation[];
  personA: Member;
  personB: Member;
  activeIndex: number;
  getMember: (id: string) => Member | undefined;
}

const DEFAULT_VISIBLE = 3;

export default function DetailedView({ relations, personA, personB, activeIndex, getMember }: Props) {
  const [expanded, setExpanded] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => { setExpanded(false); }, [relations]);
  useEffect(() => {
    if (activeIndex >= DEFAULT_VISIBLE) setExpanded(true);
    cardRefs.current[activeIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeIndex]);

  const visible = expanded ? relations : relations.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = relations.length - DEFAULT_VISIBLE;

  return (
    <div className="parente-detailed">
      {visible.map((r, i) => (
        <div
          key={`${r.via}-${i}`}
          ref={(el) => { cardRefs.current[i] = el; }}
          className={`parente-detailed-card${i === activeIndex ? ' active' : ''}`}
        >
          <div className="card-header">
            <span className="card-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="card-title">
              {i === 0 ? 'Lien principal' : `Lien ${String(i + 1).padStart(2, '0')}`}
            </span>
            <span className="card-via">via {r.viaName}</span>
          </div>
          <ReciprocalStatements relation={r} nameA={personA.name} nameB={personB.name} />
          <TechnicalDetails relation={r} personA={personA} personB={personB} getMember={getMember} />
          <PedagogicalExplanation relation={r} nameA={personA.name} nameB={personB.name} />
        </div>
      ))}
      {hiddenCount > 0 && !expanded && (
        <button className="parente-detailed-more" onClick={() => setExpanded(true)}>
          + Voir les {hiddenCount} autre{hiddenCount > 1 ? 's' : ''} relation{hiddenCount > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : CSS**

```css
.parente-detailed { display: flex; flex-direction: column; gap: 18px; }
.parente-detailed-card { padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; transition: border-color 0.2s; }
.parente-detailed-card.active { border-color: rgba(212,168,83,0.35); }
.parente-detailed-card .card-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.parente-detailed-card .card-num { font-weight: 700; color: var(--sh-gold, #d4a853); font-size: 14px; }
.parente-detailed-card .card-title { font-family: var(--sh-serif, Georgia, serif); color: #ece8e0; font-size: 14px; }
.parente-detailed-card .card-via { margin-left: auto; color: #6b7280; font-size: 11px; }
.parente-detailed-more { padding: 10px 18px; border-radius: 999px; background: transparent; border: 1px dashed rgba(255,255,255,0.15); color: #9ca3af; font-size: 12px; cursor: pointer; align-self: center; }
```

---

### Task 21 : ParenteResultModal (assemblage + responsive + états spéciaux)

**Files:**
- Create: `react-app/src/components/relationship/ParenteResultModal.tsx`

- [ ] **Step 1 : Écrire le composant**

```tsx
// react-app/src/components/relationship/ParenteResultModal.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RelationResult } from '../../lib/parenteSonghay';
import type { Member } from '../../lib/types';
import RelationSelector from './RelationSelector';
import SubTreeSvg from './SubTreeSvg';
import DetailedView from './DetailedView';

interface Props {
  result: RelationResult;
  personA: Member;
  personB: Member;
  getMember: (id: string) => Member | undefined;
  onClose: () => void;
}

type Tab = 'graphic' | 'detailed';

export default function ParenteResultModal({ result, personA, personB, getMember, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState<Tab>('graphic');

  useEffect(() => { setActiveIndex(0); setTab('graphic'); }, [result]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (result.kind === 'relations') {
        if (e.key === 'ArrowLeft') setActiveIndex((i) => Math.max(0, i - 1));
        if (e.key === 'ArrowRight') setActiveIndex((i) => Math.min(result.relations.length - 1, i + 1));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [result, onClose]);

  const content = (
    <>
      <div className="parente-modal-backdrop" onClick={onClose} />
      <div className="parente-modal" role="dialog" aria-modal="true" aria-labelledby="parente-modal-title">
        <div className="parente-modal-handle" aria-hidden="true" />
        <div className="parente-modal-header">
          <div>
            <h2 id="parente-modal-title">Liens de parenté</h2>
            <p className="parente-modal-subtitle">{personA.name} ↔ {personB.name}</p>
          </div>
          <button className="parente-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <div className="parente-modal-body">
          {result.kind === 'no-link' && (
            <div className="parente-empty">
              <div className="parente-empty-title">Aucun lien de parenté trouvé</div>
              <p>Aucun lien de parenté trouvé entre <strong>{personA.name}</strong> et <strong>{personB.name}</strong> dans la base. Ils n'ont aucun ancêtre commun connu.</p>
              <p className="parente-empty-hint">Cela peut être dû à des branches familiales déconnectées ou à des données manquantes.</p>
            </div>
          )}

          {result.kind === 'incomplete' && (
            <div className="parente-empty warn">
              <div className="parente-empty-title">Calcul incomplet</div>
              <p>La généalogie n'est pas suffisamment renseignée pour déterminer ce lien.</p>
              <ul>
                {result.missingParents.map((m, i) => {
                  const person = getMember(m.personId);
                  return (
                    <li key={i}>
                      Compléter le <strong>{m.missing === 'father' ? 'père' : 'mère'}</strong> de{' '}
                      <strong>{person?.name ?? m.personId}</strong> pourrait permettre le calcul.
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {result.kind === 'relations' && (
            <>
              <RelationSelector
                relations={result.relations}
                activeIndex={activeIndex}
                onChange={setActiveIndex}
              />

              <div className="parente-modal-tabs" role="tablist">
                <button
                  role="tab"
                  aria-selected={tab === 'graphic'}
                  className={`parente-modal-tab${tab === 'graphic' ? ' active' : ''}`}
                  onClick={() => setTab('graphic')}
                >Vue graphique</button>
                <button
                  role="tab"
                  aria-selected={tab === 'detailed'}
                  className={`parente-modal-tab${tab === 'detailed' ? ' active' : ''}`}
                  onClick={() => setTab('detailed')}
                >Vue détaillée</button>
              </div>

              {tab === 'graphic' && result.relations[activeIndex] && (
                (() => {
                  const active = result.relations[activeIndex];
                  const ancestor = getMember(active.via);
                  if (!ancestor) return <div className="parente-empty">Ancêtre {active.via} introuvable</div>;
                  return (
                    <SubTreeSvg
                      relation={active}
                      personA={personA}
                      personB={personB}
                      ancestor={ancestor}
                      getMember={getMember}
                    />
                  );
                })()
              )}

              {tab === 'detailed' && (
                <DetailedView
                  relations={result.relations}
                  personA={personA}
                  personB={personB}
                  activeIndex={activeIndex}
                  getMember={getMember}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
```

- [ ] **Step 2 : CSS (modal responsive)**

Append to `global.css` :

```css
.parente-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; animation: fade-in 0.15s ease-out; }
.parente-modal { position: fixed; z-index: 1001; background: var(--sh-card, #111830); color: #ece8e0; display: flex; flex-direction: column; }
.parente-modal-handle { display: none; }
.parente-modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.parente-modal-header h2 { margin: 0; font-family: var(--sh-serif, Georgia, serif); font-size: 1.2rem; color: var(--sh-gold, #d4a853); }
.parente-modal-subtitle { margin: 4px 0 0; font-size: 0.85rem; color: #9ca3af; }
.parente-modal-close { background: transparent; border: 0; color: #9ca3af; font-size: 24px; cursor: pointer; line-height: 1; padding: 4px 8px; }
.parente-modal-close:hover { color: #ece8e0; }
.parente-modal-body { flex: 1; overflow-y: auto; padding: 18px 22px; }
.parente-modal-tabs { display: flex; gap: 4px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 14px; }
.parente-modal-tab { padding: 10px 14px; background: transparent; border: 0; color: #9ca3af; cursor: pointer; font-size: 13px; position: relative; font-family: inherit; }
.parente-modal-tab.active { color: var(--sh-gold, #d4a853); }
.parente-modal-tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: var(--sh-gold, #d4a853); }

.parente-empty { padding: 24px; text-align: center; color: #9ca3af; }
.parente-empty.warn { background: rgba(224,132,90,0.08); border-left: 3px solid var(--sh-terra, #e0845a); border-radius: 6px; text-align: left; }
.parente-empty-title { font-family: var(--sh-serif, Georgia, serif); font-size: 18px; color: #ece8e0; margin-bottom: 8px; }
.parente-empty-hint { font-size: 12px; color: #6b7280; margin-top: 10px; }
.parente-empty ul { margin: 10px 0 0 20px; padding: 0; }
.parente-empty li { margin-bottom: 6px; }

/* Desktop : modal centré */
@media (min-width: 768px) {
  .parente-modal { top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(920px, 92vw); max-height: 86vh; border-radius: 16px; box-shadow: 0 20px 80px rgba(0,0,0,0.5); animation: modal-zoom 0.18s ease-out; }
}

/* Mobile : bottom sheet plein écran */
@media (max-width: 767px) {
  .parente-modal { top: 0; left: 0; right: 0; bottom: 0; width: 100%; border-radius: 0; animation: sheet-up 0.2s ease-out; }
  .parente-modal-handle { display: block; width: 40px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 999px; margin: 10px auto 0; }
  .parente-modal-header { padding: 12px 18px; }
  .parente-modal-body { padding: 14px 18px 40px; }
  .parente-subtree-viewport { height: 320px; }
}

@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes modal-zoom { from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
@keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
```

- [ ] **Step 3 : Build**

Run: `cd react-app && npm run build`
Expected: OK.

- [ ] **Step 4 : Commit Phase 3+4 (tout l'UI sauf page)**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add react-app/src/components/relationship/ react-app/src/styles/global.css
git commit -m "$(cat <<'EOF'
feat(parente): modal responsive + sous-arbre SVG + vue detaillee

- ParenteResultModal : portal into document.body, responsive
  (centered modal ≥768px, full-screen bottom sheet <768px), tabs
  (Vue graphique / Vue détaillée), keyboard nav (Escape closes,
  Arrow keys change active relation), empty states for no-link
  and incomplete.
- SubTreeSvg : hybrid HTML nodes + SVG edges/badges, zoom/pan
  via pointer events and Ctrl+wheel, double-rAF reset to avoid
  zoom=0 bug on open.
- RelationSelector : pills scrollables, default-hide beyond 3
  with "+ Voir les N autres" toggle; auto-expand when keyboard
  arrow nav reaches beyond visible range.
- DetailedView : reciprocal statements, technical details,
  pedagogical explanation generated dynamically. Default shows 3
  cards, scroll-into-view when active index changes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Page & admin

### Task 22 : Réécriture de ParentePage

**Files:**
- Modify: `react-app/src/pages/ParentePage.tsx`

- [ ] **Step 1 : Réécrire le fichier en entier**

```tsx
// react-app/src/pages/ParentePage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useMembersContext } from '../context/MembersContext';
import { computeRelations } from '../lib/parenteSonghay';
import { useParenteLabels } from '../hooks/useParenteLabels';
import PersonPicker from '../components/relationship/PersonPicker';
import ParenteResultModal from '../components/relationship/ParenteResultModal';

export default function ParentePage() {
  const { members, loading } = useMembersContext();
  const { labels, loading: labelsLoading } = useParenteLabels();

  const [personAId, setPersonAId] = useState<string | null>(null);
  const [personBId, setPersonBId] = useState<string | null>(null);
  const [modalDismissed, setModalDismissed] = useState(false);

  const result = useMemo(() => {
    if (!personAId || !personBId) return null;
    if (personAId === personBId) return { kind: 'same-person' as const };
    return computeRelations(personAId, personBId, members, labels);
  }, [personAId, personBId, members, labels]);

  useEffect(() => { setModalDismissed(false); }, [personAId, personBId]);

  const personA = personAId ? members[personAId] : null;
  const personB = personBId ? members[personBId] : null;
  const showModal = result !== null && result.kind !== 'same-person' && !modalDismissed && !!personA && !!personB;
  const showReopenBtn = result !== null && result.kind !== 'same-person' && modalDismissed;

  if (loading || labelsLoading) {
    return (
      <div className="page active parente-page">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div>Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page active parente-page">
      <div className="scroll" tabIndex={0}>
        <div className="parente-hdr">
          <div className="parente-hdr-i">{'\uD83C\uDF33'}</div>
          <div>
            <h1>Parenté</h1>
            <small>Liens familiaux · Terminologie Songhay</small>
          </div>
        </div>

        <div className="parente-sel">
          <PersonPicker
            label="Personne A"
            value={personAId}
            members={members}
            onChange={setPersonAId}
            side="a"
          />
          <PersonPicker
            label="Personne B"
            value={personBId}
            members={members}
            onChange={setPersonBId}
            side="b"
          />
        </div>

        {!personAId || !personBId ? (
          <div className="empty">
            <div className="empty-icon">{'\u{1F446}'}</div>
            <div className="empty-text">Sélectionnez deux personnes pour calculer leurs liens de parenté.</div>
          </div>
        ) : personAId === personBId ? (
          <div className="parente-flash">
            <div className="parente-flash-n">!</div>
            <div className="parente-flash-t">C'est la même personne.</div>
          </div>
        ) : showReopenBtn ? (
          <div className="parente-reopen">
            <button className="parente-reopen-btn" onClick={() => setModalDismissed(false)}>
              Voir les liens
            </button>
          </div>
        ) : null}

        {showModal && personA && personB && result && (
          <ParenteResultModal
            result={result}
            personA={personA}
            personB={personB}
            getMember={(id) => members[id]}
            onClose={() => setModalDismissed(true)}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Ajouter le CSS pour le bouton « Voir les liens »**

```css
.parente-reopen { display: flex; justify-content: center; margin-top: 24px; }
.parente-reopen-btn { padding: 12px 24px; border-radius: 999px; background: var(--sh-gold, #d4a853); color: #111; border: 0; font-weight: 600; cursor: pointer; font-size: 14px; }
.parente-reopen-btn:hover { filter: brightness(1.05); }
```

- [ ] **Step 3 : Build**

Run: `cd react-app && npm run build`
Expected: build OK. Note : le build peut encore échouer temporairement à cause de l'ancien code qui réfère `SonghoyRelationResult` — on le nettoiera en Task 25.

Si le build échoue, on ignore temporairement (commit quand même, le nettoyage final corrige) — **sauf si** l'erreur vient du nouveau code, auquel cas il faut la corriger.

- [ ] **Step 4 : Commit**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add react-app/src/pages/ParentePage.tsx react-app/src/styles/global.css
git commit -m "$(cat <<'EOF'
refactor(parente): integration dans ParentePage

Replace the old ParentePage with a new implementation wired to the
new engine (computeRelations) and the new UI components
(PersonPicker + ParenteResultModal). Modal opens automatically when
both persons are selected and differ. Closing the modal shows a
"Voir les liens" button to reopen without losing the selection.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 23 : ParenteLabelsSection (écran admin)

**Files:**
- Create: `react-app/src/components/admin/ParenteLabelsSection.tsx`

- [ ] **Step 1 : Écrire le composant**

```tsx
// react-app/src/components/admin/ParenteLabelsSection.tsx
import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useParenteLabels } from '../../hooks/useParenteLabels';

type Category = 'term' | 'gloss' | 'explain';

const CATEGORY_LABELS: Record<Category, string> = {
  term: 'Termes Songhay',
  gloss: 'Gloses françaises',
  explain: 'Explications pédagogiques',
};

function categoryOf(key: string): Category | null {
  if (key.startsWith('term.')) return 'term';
  if (key.startsWith('gloss.')) return 'gloss';
  if (key.startsWith('explain.')) return 'explain';
  return null;
}

export default function ParenteLabelsSection() {
  const { defaults, overrides, refetch, loading } = useParenteLabels();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const out: Record<Category, string[]> = { term: [], gloss: [], explain: [] };
    for (const key of Object.keys(defaults)) {
      const cat = categoryOf(key);
      if (cat) out[cat].push(key);
    }
    for (const cat of Object.keys(out) as Category[]) out[cat].sort();
    return out;
  }, [defaults]);

  const effectiveValue = (key: string): string => draft[key] ?? overrides[key] ?? defaults[key];
  const isOverridden = (key: string): boolean => key in overrides;
  const isDirty = (key: string): boolean => key in draft;

  const handleChange = (key: string, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const handleResetOne = async (key: string) => {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('parente_labels').delete().eq('key', key);
    if (err) setError(err.message);
    setDraft((d) => { const copy = { ...d }; delete copy[key]; return copy; });
    await refetch();
    setSaving(false);
  };

  const handleResetAll = async () => {
    if (!confirm('Réinitialiser tous les libellés aux valeurs par défaut ? Les overrides seront supprimés.')) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('parente_labels').delete().neq('key', '');
    if (err) setError(err.message);
    setDraft({});
    await refetch();
    setSaving(false);
  };

  const handleSave = async () => {
    const rows = Object.keys(draft)
      .filter((k) => draft[k] !== defaults[k] || isOverridden(k))
      .map((k) => ({ key: k, value: draft[k] }));
    // Clés remises à la valeur par défaut → supprimer de la DB
    const resetKeys = Object.keys(draft).filter((k) => draft[k] === defaults[k] && isOverridden(k));

    setSaving(true);
    setError(null);

    if (resetKeys.length > 0) {
      const { error: err } = await supabase.from('parente_labels').delete().in('key', resetKeys);
      if (err) { setError(err.message); setSaving(false); return; }
    }
    if (rows.length > 0) {
      const { error: err } = await supabase.from('parente_labels').upsert(rows, { onConflict: 'key' });
      if (err) { setError(err.message); setSaving(false); return; }
    }
    setDraft({});
    await refetch();
    setSaving(false);
  };

  if (loading) return <div>Chargement...</div>;

  const hasChanges = Object.keys(draft).length > 0;

  return (
    <div className="admin-parente-labels">
      {error && <div className="admin-error">{error}</div>}

      {(['term', 'gloss', 'explain'] as Category[]).map((cat) => (
        <section key={cat} className="admin-labels-group">
          <h3>{CATEGORY_LABELS[cat]}</h3>
          <div className="admin-labels-table">
            {groups[cat].map((key) => {
              const isTextarea = cat === 'explain';
              const val = effectiveValue(key);
              const def = defaults[key];
              return (
                <div key={key} className={`admin-labels-row${isOverridden(key) ? ' overridden' : ''}${isDirty(key) ? ' dirty' : ''}`}>
                  <div className="row-key">
                    <code>{key}</code>
                    {isOverridden(key) && <span className="badge">personnalisé</span>}
                  </div>
                  <div className="row-value">
                    {isTextarea ? (
                      <textarea value={val} onChange={(e) => handleChange(key, e.target.value)} rows={3} />
                    ) : (
                      <input type="text" value={val} onChange={(e) => handleChange(key, e.target.value)} />
                    )}
                    {val !== def && <div className="row-default">Défaut : {def}</div>}
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      title="Réinitialiser au défaut"
                      onClick={() => handleResetOne(key)}
                      disabled={!isOverridden(key) || saving}
                    >↺</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="admin-labels-footer">
        <button type="button" onClick={handleSave} disabled={!hasChanges || saving} className="btn-primary">
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
        <button type="button" onClick={handleResetAll} disabled={saving} className="btn-danger">
          Tout réinitialiser
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : CSS minimal**

```css
.admin-parente-labels { display: flex; flex-direction: column; gap: 24px; }
.admin-labels-group h3 { font-family: var(--sh-serif, Georgia, serif); margin-bottom: 12px; color: var(--sh-gold, #d4a853); }
.admin-labels-table { display: flex; flex-direction: column; gap: 8px; }
.admin-labels-row { display: grid; grid-template-columns: 200px 1fr 40px; gap: 12px; align-items: flex-start; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.02); }
.admin-labels-row.overridden { background: rgba(212,168,83,0.06); }
.admin-labels-row.dirty { box-shadow: inset 0 0 0 1px var(--sh-terra, #e0845a); }
.admin-labels-row .row-key code { font-size: 11px; color: #9ca3af; }
.admin-labels-row .badge { display: inline-block; margin-left: 8px; font-size: 9px; padding: 2px 6px; background: rgba(212,168,83,0.2); color: var(--sh-gold, #d4a853); border-radius: 999px; }
.admin-labels-row input, .admin-labels-row textarea { width: 100%; padding: 6px 10px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #ece8e0; font-family: inherit; font-size: 13px; }
.admin-labels-row .row-default { font-size: 10px; color: #6b7280; margin-top: 4px; }
.admin-labels-row .row-actions button { width: 32px; height: 32px; border-radius: 6px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #9ca3af; cursor: pointer; }
.admin-labels-row .row-actions button:disabled { opacity: 0.3; cursor: not-allowed; }
.admin-labels-footer { display: flex; gap: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); }
.admin-labels-footer .btn-primary { padding: 10px 20px; background: var(--sh-gold, #d4a853); color: #111; border: 0; border-radius: 8px; font-weight: 600; cursor: pointer; }
.admin-labels-footer .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.admin-labels-footer .btn-danger { padding: 10px 20px; background: transparent; color: #f87171; border: 1px solid rgba(248,113,113,0.3); border-radius: 8px; cursor: pointer; }
.admin-error { padding: 10px; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); border-radius: 6px; color: #f87171; }
```

- [ ] **Step 3 : Wire dans AdminPage**

Edit `react-app/src/pages/AdminPage.tsx` :
- Remplacer l'import `TermsManagementSection` par `ParenteLabelsSection` :

```diff
-import TermsManagementSection from '../components/admin/TermsManagementSection';
+import ParenteLabelsSection from '../components/admin/ParenteLabelsSection';
```

- Renommer l'onglet `'terms'` → `'parente'` dans le type `AdminTab`, dans `TAB_LABELS` et dans les arrays `['suggestions', ...]` :

```diff
-type AdminTab = 'suggestions' | 'members' | 'history' | 'users' | 'terms';
+type AdminTab = 'suggestions' | 'members' | 'history' | 'users' | 'parente';
```

```diff
 const TAB_LABELS: Record<AdminTab, string> = {
   suggestions: 'Suggestions',
   members: 'Membres',
   history: 'Fusions',
   users: 'Utilisateurs',
-  terms: 'Termes',
+  parente: 'Parenté',
 };
```

```diff
-          {(['suggestions', 'members', 'history', 'users', 'terms'] as AdminTab[]).map((t) => (
+          {(['suggestions', 'members', 'history', 'users', 'parente'] as AdminTab[]).map((t) => (
```

```diff
-        {tab === 'terms' && <TermsManagementSection />}
+        {tab === 'parente' && <ParenteLabelsSection />}
```

- [ ] **Step 4 : Build (peut encore échouer à cause de TermsManagementSection non supprimé — normal, Task 25 nettoie)**

Run: `cd react-app && npm run build`
Si échec uniquement lié à `TermsManagementSection`, c'est attendu. Si échec sur `ParenteLabelsSection`, corriger.

- [ ] **Step 5 : Commit**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add react-app/src/components/admin/ParenteLabelsSection.tsx react-app/src/pages/AdminPage.tsx react-app/src/styles/global.css
git commit -m "$(cat <<'EOF'
feat(admin): ecran de gestion des libelles de parente

New ParenteLabelsSection with 3 groups (Termes Songhay, Gloses
françaises, Explications pédagogiques). Editable inline, per-row
reset button, global "Tout réinitialiser" with confirmation.
Overrides are persisted as rows in parente_labels; resets delete the
row (falls back to lib/parenteSonghay/labels.ts defaults). AdminPage
tab renamed terms → parente.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Nettoyage final

### Task 24 : Supprimer l'ancien système + nettoyer types.ts

**Files:**
- Delete (9 files) + Modify `types.ts`

- [ ] **Step 1 : Supprimer les fichiers obsolètes**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira/react-app
rm src/lib/songhoyRelationship.ts
rm src/lib/songhoyRelationship.test.ts
rm src/hooks/useRelationTerms.ts
rm src/components/relationship/MemberAutocomplete.tsx
rm src/components/relationship/RelationshipResult.tsx
rm src/components/relationship/RelationCard.tsx
rm src/components/relationship/RelationPathGraph.tsx
rm src/components/relationship/TreePathModal.tsx
rm src/components/admin/TermsManagementSection.tsx
```

Vérifier si `PersonSelect.tsx` est orphelin :

Run: `cd react-app && grep -rn "PersonSelect" src/`
Si aucun résultat : `rm src/components/relationship/PersonSelect.tsx`. Sinon laisser.

- [ ] **Step 2 : Nettoyer `lib/types.ts`**

Supprimer les types obsolètes (conserver `Member`, `MemberDict`, `ContributionData`, `UserRole`, `UserProfile`, `Suggestion`, et tout ce qui concerne le merge — ne supprimer QUE les types parenté) :

Edit `react-app/src/lib/types.ts` : retirer les interfaces/types suivants :
- `RelationResult` (l'ancien avec `anc, path1, path2, d1, d2`)
- `RelationCategory`
- `RelationTerm`
- `TermsDict`
- `CategoriesDict`
- `AncestorInfo`
- `SonghoyRelationResult`

Garder le reste intact.

- [ ] **Step 3 : Rechercher les imports cassés**

Run: `cd react-app && npm run build 2>&1 | grep -E "error TS|Cannot find" | head -20`

Pour chaque erreur : localiser le fichier et supprimer l'import ou la référence.

Fichiers candidats à vérifier :
- `src/lib/relationship.ts` (ancien helper, probablement à supprimer aussi si orphelin) — grep d'abord.

- [ ] **Step 4 : Vérifier le build**

Run: `cd react-app && npm run build`
Expected: build complet réussi.

- [ ] **Step 5 : Vérifier les tests**

Run: `cd react-app && npm run test:run`
Expected: tous les tests verts.

- [ ] **Step 6 : Nettoyer les classes CSS obsolètes (optionnel)**

Dans `src/styles/global.css`, rechercher les classes utilisées uniquement par les composants supprimés :
- `.parente-form`, `.parente-select-group`, `.parente-select`, `.parente-vs`, `.parente-btn` (ancien `ParentePage` — le nouveau ne les utilise pas)
- `.parente-rc`, `.parente-rh`, `.parente-rb`, `.parente-rr`, `.parente-ra`, `.parente-rt`, `.parente-arrow`, `.parente-sg`, `.parente-td`, `.parente-hp`, `.parente-nd`, `.parente-nc`, `.parente-nn`, `.parente-ng`, `.parente-co`, `.parente-ab`, `.parente-ab-st`, `.parente-add`, `.parente-add-label`, `.parente-tree-btn` (anciens `RelationCard`, `RelationPathGraph`)
- `.tree-modal`, `.tree-zoom-*`, `.tree-scroll-container`, `.relation-graph-*`
- `.member-search-*` (ancien `MemberAutocomplete`, mais le nouveau `PersonPicker` les réutilise — **garder**)
- `.parente-ci`, `.parente-cn`, `.parente-ct`, `.parente-db`, `.parente-dv`, `.parente-dl`, `.parente-chevron`

Utiliser Grep pour vérifier si une classe est référencée depuis un TSX avant de la supprimer. Les classes orphelines peuvent être laissées en place si le temps manque (coût zéro à l'exécution), mais mieux vaut nettoyer pour la maintenabilité.

- [ ] **Step 7 : Tester l'app manuellement**

```bash
cd react-app && npm run dev
```

Ouvrir `http://localhost:5173/parente` et tester :
- Sélectionner 2 personnes → modal s'ouvre.
- Fermer → bouton « Voir les liens » apparaît.
- Changer un pic → modal réapparaît.
- Vérifier une paire avec relations multiples (ex : Cheick et Bakary si les données réelles les contiennent, ou n'importe quelle paire avec double filiation).
- Tester zoom (+/−/⟲), drag, Ctrl+molette, flèches ← →, Échap.
- Responsive : redimensionner en mode mobile (<768px) → bottom sheet plein écran.
- Aller sur `/admin` → onglet « Parenté » → modifier un terme, sauver, vérifier que la vue Parenté utilise la nouvelle valeur.

- [ ] **Step 8 : Commit final**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add -A
git commit -m "$(cat <<'EOF'
chore(parente): remplacement de l'ancien systeme de termes DB

Delete the old kinship implementation:
- lib/songhoyRelationship.{ts,test.ts} (1824 lines)
- hooks/useRelationTerms.ts
- components/relationship/MemberAutocomplete, RelationshipResult,
  RelationCard, RelationPathGraph, TreePathModal
- components/admin/TermsManagementSection
- lib/types.ts : drop RelationTerm, RelationCategory, TermsDict,
  CategoriesDict, SonghoyRelationResult, AncestorInfo and old
  RelationResult types.
- Clean up orphan CSS classes in global.css.

All tests green, build passes, manual smoke test on /parente and
/admin verified.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Validation finale

### Checklist avant de considérer le plan terminé

- [ ] `npm run test:run` : tous verts (incluant les 58+ tests du moteur).
- [ ] `npm run build` : succès sans warning TypeScript.
- [ ] `npm run lint` : pas d'erreur (warnings tolérés).
- [ ] Test manuel : les 4 cas du spec UI (normal, same-person, no-link, incomplete) fonctionnent.
- [ ] Test manuel : `/admin` → onglet « Parenté » édite correctement un terme, l'affichage dans `/parente` reflète le changement après save.
- [ ] Migration SQL `supabase/migrations/013_parente_labels.sql` appliquée sur la DB distante (à demander à l'utilisateur).

### Mapping spec → tasks (couverture)

| Section du spec | Tasks |
|---|---|
| §2 Périmètre (sang only, modal auto, truncation 3) | T11, T16, T20, T21, T22 |
| §3.1 Structure moteur | T1-T11 |
| §3.2 Types | T1 |
| §3.3 Labels par défaut | T2 |
| §3.4 Adaptateur Member→Person | T10 |
| §3.5 Conformité algo (14 cas) | T11 |
| §4.1 Chargement labels + Provider | T13 |
| §4.2 PersonPicker | T14 |
| §4.3 ParenteResultModal responsive | T21 |
| §4.4 RelationSelector troncature 3 | T16 |
| §4.5 SubTreeSvg hybride + zoom/pan | T15 |
| §4.6 ParenteLabelsSection admin | T23 |
| §4.7 DetailedView + sous-composants | T17, T18, T19, T20 |
| §4.8 Cas particuliers (no-link, incomplete, same-person) | T21, T22 |
| §5 Gestion d'état | T22 |
| §6 Styling | T15, T16, T17-T21, T23 (CSS inline à chaque étape) |
| §7 Migration DB + fichiers | T12, T13 (App.tsx), T22 (ParentePage), T23 (AdminPage), T24 (nettoyage) |
| §8 Tests (14 cas + explain + applyLabels) | T3, T9, T11 |
| §10 Principes | Architecture du plan (isolation moteur, YAGNI explicite) |

---

*Fin du plan.*

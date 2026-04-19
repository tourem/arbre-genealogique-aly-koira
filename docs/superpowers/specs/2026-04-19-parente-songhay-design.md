# Liens de parenté Songhay — Spec de design

> **Date :** 2026-04-19
> **Statut :** approuvé, prêt pour planification d'implémentation
> **Feature :** refonte totale du calcul de parenté Songhay dans Alykoira
> **Documents de référence :**
> - `parente/algorithme-parente-songhay.md` — algorithme & vocabulaire
> - `parente/prompt-claude-code-feature-parente-alykoira.md` — exigences UX/UI

## 1. Contexte & objectif

Alykoira est l'application web de généalogie de la famille Aly Koïra (Gao, Mali). Elle gère ~600 personnes sur 12 générations. Une page `/parente` existe déjà avec un calcul de relations Songhay basé sur un vocabulaire stocké en base de données, mais ce vocabulaire et cet algorithme ne correspondent pas au système anthropologique ciblé (soudanais, avunculat distinct, fusion parallèle/fratrie, reset par génération, notation `coté baba` / `coté gna`).

**Objectif :** refonte totale — réécrire le moteur de calcul de parenté en TypeScript pur conforme au spec `algorithme-parente-songhay.md`, et réécrire l'UI (page + modal) selon les exigences du prompt produit.

**Hors scope :**
- Relations par alliance (époux, beaux-parents, beaux-frères) — non couvertes par le spec songhay, l'ancien système les traitait mais on les abandonne.
- Internationalisation multi-langue.
- Export PNG/PDF du sous-arbre.
- Partage par URL de deux IDs.
- Sauvegarde d'historique de calculs.
- Cache/mémoïsation avancée (calcul synchrone <10 ms à 600 personnes, inutile).

## 2. Périmètre fonctionnel retenu

- **Périmètre** : relations de sang uniquement, fidèles au vocabulaire du document de spec (13 termes : `baba`, `gna`, `izé`, `arma`, `woyma`, `baassa arou`, `baassa woy`, `hassa`, `touba`, `hawa`, `kaga arou`, `kaga woy`, `haama`).
- **Tables DB** : `relation_categories`, `relation_terms`, `term_audit_log` + l'écran admin associé (`TermsManagementSection`) sont **supprimés**. Le vocabulaire est codé en dur dans le moteur TypeScript (source unique de vérité = le code).
- **Structure UX** : page `/parente` avec deux sélecteurs en haut + **modal popup automatique** dès que les deux personnes sont sélectionnées.
- **Responsive** : **bottom-sheet plein écran sur mobile** (<768 px), **modal centré avec backdrop sur desktop** (≥768 px).
- **Rendu du sous-arbre** : **SVG hybride** — nœuds en HTML positionnés absolument (avatars, italique, gloses), arêtes + badges P/M en SVG overlay.

## 3. Architecture — moteur de calcul (`lib/parenteSonghay/`)

### Structure du module

```
react-app/src/lib/parenteSonghay/
├── types.ts                 ← Sex, Hop, RelationKind, Relation, RelationResult
├── enumeratePaths.ts        ← DFS ancêtres, max_depth=20
├── findLCAInstances.ts      ← produit cartésien + filtre minimalité
├── classify.ts              ← dispatch direct/parallel/cross/avuncular/distant-vertical
├── buildTerms.ts            ← composition "kaga kaga arou coté baba", "haama haama"
├── explain.ts               ← génération dynamique de l'explication pédagogique française
├── labels.ts                ← libellés UI français (source unique)
├── index.ts                 ← orchestrateur computeRelations + adaptateur Member → Person
├── index.test.ts            ← 14 cas du spec
└── explain.test.ts          ← snapshots des 6 kinds d'explication
```

### Contrat API

```ts
// types.ts
export type Sex = 'M' | 'F';
export type Hop = 'P' | 'M';
export type RelationKind =
  | 'direct-descendant'     // A parent direct de B (ou grand-parent, etc.)
  | 'direct-ascendant'      // symétrique
  | 'parallel'              // cousins/frères parents de même sexe
  | 'cross'                 // cousins parents de sexes opposés
  | 'avuncular'             // oncle/tante direct (delta=1)
  | 'distant-vertical';     // grand-oncle, arrière-grand-oncle, etc.

export interface Relation {
  termForA: string;         // "hassa" ou "kaga kaga arou coté baba"
  termForB: string;         // "touba" ou "haama haama"
  kind: RelationKind;
  via: string;              // id du LCA
  viaName: string;          // nom lisible, pour UI
  pathA: Hop[];
  pathB: Hop[];
  distanceA: number;
  distanceB: number;
  proximityScore: number;   // dA + dB
  balanceScore: number;     // max(dA, dB)
}

export type RelationResult =
  | { kind: 'same-person' }
  | { kind: 'no-link' }
  | { kind: 'incomplete'; missingParents: { personId: string; missing: 'father' | 'mother' }[] }
  | { kind: 'relations'; relations: Relation[] };

export function computeRelations(
  idA: string,
  idB: string,
  members: MemberDict
): RelationResult;
```

### Adaptateur Member → Person

L'app utilise `Member.father_id` / `Member.mother_ref` (et `gender`, `name`). Le moteur travaille en interne avec un type `Person { id, name, sex, fatherId, motherId }`. L'adaptation se fait dans `index.ts` uniquement, sans exposer `Member` au reste du moteur. Le moteur n'importe jamais `react`, `@supabase/supabase-js`, ni aucun composant UI.

### Conformité au spec

- DFS ancêtres avec `max_depth = 20` (garde-fou cycles).
- Filtrage LCAs minimaux : une instance `(X, pathA, pathB)` est rejetée si une autre instance `(Y, pathA', pathB')` existe telle que `pathA` est préfixe strict de `pathA'` **et** `pathB` est préfixe strict de `pathB'`.
- Classification dirigée par `(dA, dB)` :
  - `dA = 0, dB = 1` → `direct-descendant`, terme A = `baba`/`gna`, terme B = `izé`.
  - `dA = 0, dB ≥ 2` → `direct-descendant` éloigné, `kaga [...kaga] arou/woy coté baba/gna` + `haama [...haama]`.
  - `dA = dB ≥ 1` + parents directs de même sexe → `parallel`, `arma`/`woyma` mutuellement.
  - `dA = dB ≥ 1` + parents directs de sexes opposés → `cross`, `baassa arou`/`baassa woy` mutuellement.
  - `dA + 1 = dB` (ou symétrique) :
    - couple (supérieur, parent_de_inférieur) même sexe → `avuncular` parallèle → `baba`/`gna` + `izé`.
    - couple cross, supérieur ♂ → `avuncular` maternel → `hassa` + `touba`.
    - couple cross, supérieur ♀ → `avuncular` paternel → `hawa` + `izé`.
  - `dA + k = dB` avec `k ≥ 2` → `distant-vertical`, `kaga` répété (k-1) fois + suffixe `coté baba/gna` selon premier hop, `haama` répété (k-1) fois.
- **Sémantique stricte** : `termForA` désigne A (dépend du sexe de A et de sa position), `termForB` désigne B. Testé explicitement (Modibo♂↔Hadja♀ → `termForA='arma'`, `termForB='woyma'`).
- **Incomplet** : si un parent nécessaire (sur un chemin utilisé) est `null`, retourner `{ kind: 'incomplete', missingParents: [...] }` sans deviner.
- **Tri** : `proximityScore` croissant, puis `balanceScore` croissant.
- **Déduplication** : clé `(termForA, termForB, via)`.

## 4. Architecture — UI

### Hiérarchie des composants

```
pages/ParentePage.tsx
 ├─ <ParentePageHeader />              (titre + sous-titre serif)
 ├─ <PersonPicker side="a" />          (autocomplete accent-insensible)
 ├─ <PersonPicker side="b" />
 └─ <ParenteResultModal />             (ouvert auto si A && B && A !== B)
     ├─ <ResultHeader />                (titre, sous-titre "A ↔ B", bouton ×)
     ├─ <RelationSelector />            (pills, visible si N > 1)
     ├─ <RelationHeaderInfo />          (via LCA · proximité · équilibre)
     ├─ <Tabs />                        ("Vue graphique" | "Vue détaillée")
     ├─ <GraphicView>
     │   └─ <SubTreeSvg />              (SVG hybride + zoom/pan + légende)
     └─ <DetailedView>
         ├─ <ReciprocalStatements />    ("A est termForA pour B", "B est termForB pour A")
         ├─ <TechnicalDetails />        (chemins en français, scores)
         └─ <PedagogicalExplanation />  (paragraphe italique serif, dynamique selon kind)
```

### `PersonPicker`

- Autocomplétion accent-insensible (normalisation NFD), casse-insensible.
- Matching par préfixe ET sous-chaîne sur `name + first_name + alias + note`.
- Scoring : préfixe du nom complet (3), préfixe d'un mot du nom (2), sous-chaîne (1).
- Max 8-10 résultats visibles, scroll au-delà.
- Navigation clavier : ↑ ↓ Enter Échap.
- Affichage sélectionné : avatar initiales + nom + ♂/♀ + génération + bouton effacer ×.
- Couleur d'accent selon `side` : `a` → bleu (`--sh-blue`), `b` → terracotta (`--sh-terra`).

**Pas de bouton swap entre A et B.** L'utilisateur peut librement effacer et re-sélectionner. La symétrie est préservée par l'algorithme côté moteur (on peut calculer dans les deux sens, les deux `termForA`/`termForB` sont cohérents).

### `ParenteResultModal`

Rendu via **React Portal** dans `document.body`, comme le `ProfileMenu` existant.

- **Desktop (≥768 px)** : modal centré, max 920×680, backdrop semi-transparent (`rgba(0,0,0,0.6)`), fermeture clic backdrop / Échap / ×.
- **Mobile (<768 px)** : bottom-sheet plein écran, slide-up 200 ms, poignée drag-to-close en haut, fermeture swipe-down / Échap / ×. Le layout principal reste visible en arrière.

### `RelationSelector`

Visible uniquement si `relations.length > 1`. Pills horizontales scrollables :
`01 · hassa / touba · via Sékou`, `02 · arma / arma · via Sira`.
La pill active est pleine or, les autres sont outlined. Navigation clavier : ← → synchronisées sur le sélecteur quand le focus est dans le modal.

**Comportement par onglet :**
- **Vue graphique** : cliquer une pill change le sous-arbre affiché (la vue graphique suit strictement le sélecteur).
- **Vue détaillée** : toutes les fiches sont listées, cliquer une pill **scrolle** jusqu'à la fiche correspondante (la pill reste un repère visuel de position, pas un filtre).

### `SubTreeSvg` — rendu hybride

**Architecture** : conteneur `position: relative`, avec deux couches superposées dans un wrapper qui porte `transform: translate(px, py) scale(zoom)` :
- Couche 1 (z=0) : `<svg>` absolu 100×100 %, contient `<line>` pour chaque arête + `<g>` pour chaque badge P/M.
- Couche 2 (z=1) : `<div>` absolus pour chaque nœud (HTML → styling riche : avatar, italique, glose).

**Layout** :
- LCA en haut centre. Chaîne A à gauche (x décalé négativement), chaîne B à droite (x décalé positivement).
- Espacement vertical fixe (ex : 90 px). Espacement horizontal dépend de `max(dA, dB)`.
- Cas `dA = 0` ou `dB = 0` : chaîne verticale unique, pas de fork.

**Mesure et zoom initial** :
- `ResizeObserver` sur le conteneur pour récupérer `clientWidth`/`clientHeight`.
- **Bug à prévenir** : au premier rendu, `clientWidth` peut valoir 0 → le `resetZoom()` calcule `zoom = 0` → sous-arbre invisible. **Solution** : double `requestAnimationFrame` avant de calculer, plus fallback `800 × 440` si les dimensions sont encore nulles.

**Interactions** :
- Boutons `+ / − / ⟲ / %` en bas à droite.
- Drag : pointer events (souris + touch). Curseur `grab` → `grabbing`.
- `Ctrl/Cmd + molette` : zoom centré sur le curseur.
- Bornes : zoom 30 % à 300 %.

**Style des nœuds** :
- Rectangle arrondi, nom + génération + ♂/♀.
- A : bordure + glow `--sh-blue`, tag « A ».
- B : bordure + glow `--sh-terra`, tag « B ».
- LCA : bordure + glow `--sh-gold`, tag « LCA ».
- Intermédiaires : neutre, teinte légère selon sexe.
- Sous les nœuds A et B : terme Songhay en italique serif `--sh-terra` + petite glose française en sous-titre (ex : « oncle maternel »).

**Badges P/M** :
- Chaque arête (segment entre deux générations) porte un petit badge rectangulaire arrondi avec lettre P (père) ou M (mère).
- Background contrasté (`rgba(255,255,255,0.08)`) + bordure 1px.
- Positionné au milieu de l'arête.

**Légende** (sous le SVG) : pastilles expliquant les couleurs (Personne A, Personne B, Ancêtre commun) et les badges P/M.

**Accessibilité** : chaque nœud a `role="button"`, `aria-label="Nom, homme/femme, génération N"`. Les termes Songhay ont `<span lang="son">` sur l'élément parent.

### `DetailedView`

- **Énoncés réciproques** (gros, mis en valeur) :
  - « **[Nom B]** est *[termForB]* pour **[Nom A]** »
  - « **[Nom A]** est *[termForA]* pour **[Nom B]** »
  - Terme en italique serif, couleur terracotta.
- **Détails techniques** (encart plus petit) :
  - Chemin A en français : « Bakary → son père Sékou » (utiliser `son/sa` selon sexe du parent, `père/mère` selon hop P/M).
  - Chemin B en français : idem.
  - Distances : `dA = 1`, `dB = 2`, `proximité = 3`, `équilibre = 2`.
- **Explication pédagogique** (encart teinté, serif italique) :
  - Paragraphe français généré dynamiquement selon `Relation.kind` + le terme spécifique.
  - Pour `avuncular` avec `hassa` : expliquer l'avunculat soudanais et le rôle social de l'oncle maternel.
  - Pour `parallel` : expliquer la fusion bifurquée (enfants de deux frères/sœurs nommés comme fratrie).
  - Pour `cross` : expliquer la distinction parallèle/croisé typique du système songhay.
  - Pour `distant-vertical` : expliquer la répétition `kaga` et le suffixe `coté baba/gna`.
  - Pour `direct-descendant/ascendant` avec distance ≥ 2 : expliquer la ligne directe et la branche paternelle/maternelle.

Si plusieurs relations, la `DetailedView` liste **toutes** les fiches triées par proximité (la vue détaillée ne suit pas le `RelationSelector` — elle montre tout pour permettre la comparaison). La `GraphicView`, elle, suit bien le sélecteur.

### Cas particuliers UI

| Résultat du moteur | UI |
|---|---|
| `same-person` | **Pas de modal**. Message inline sous les pickers : « C'est la même personne. » |
| `no-link` | Modal ouvert, état vide centré : « Aucun lien de parenté trouvé entre [Nom A] et [Nom B] dans la base. Ils n'ont aucun ancêtre commun connu. » + sous-texte : « Cela peut être dû à des branches familiales déconnectées ou à des données manquantes. » |
| `incomplete` | Modal ouvert, état d'avertissement : « Calcul incomplet : la généalogie de [Nom] n'est pas suffisamment renseignée pour déterminer ce lien. Compléter [père/mère] pourrait permettre le calcul. » + bouton-lien vers la fiche de la personne concernée. |
| `relations` (N ≥ 1) | Modal complet : sélecteur si N > 1, puis onglets. |

## 5. Gestion d'état

```ts
const [personAId, setPersonAId] = useState<string | null>(null);
const [personBId, setPersonBId] = useState<string | null>(null);
const [modalDismissed, setModalDismissed] = useState(false);
const [activeRelationIndex, setActiveRelationIndex] = useState(0);
const [activeTab, setActiveTab] = useState<'graphic' | 'detailed'>('graphic');

const result = useMemo(
  () => (personAId && personBId && personAId !== personBId
    ? computeRelations(personAId, personBId, members)
    : null),
  [personAId, personBId, members],
);

// Tout changement de pic ré-ouvre le modal et remet l'index à 0
useEffect(() => {
  setActiveRelationIndex(0);
  setModalDismissed(false);
}, [personAId, personBId]);

const showModal = result !== null && !modalDismissed;
```

- **Calcul synchrone** : pas de spinner ni de `setTimeout` — le calcul est instantané à 600 personnes.
- **Fermeture du modal (× / Échap / clic backdrop)** : `setModalDismissed(true)`. Les pics restent sélectionnés. Pour rouvrir le modal sans changer les pics, un petit bouton « Voir les liens » apparaît sous les pickers (état replié). Tout changement de pic ré-ouvre automatiquement.
- **Effacement d'un pic** : le modal se ferme naturellement (result devient `null`) et le bouton « Voir les liens » disparaît.
- **Navigation clavier globale** : Échap ferme le modal. Dans le modal, ← → naviguent dans le sélecteur de relation (applicable aux deux onglets : scroll en vue détaillée, bascule en vue graphique).

## 6. Styling

- **Réutiliser** les tokens Royal Gold existants sur `.parente-page` : `--sh-gold`, `--sh-terra`, `--sh-blue`, `--sh-card`, `--sh-serif` (Playfair Display), `--sh-sans` (Nunito Sans). Pas de nouveaux tokens.
- **Nouvelles classes** préfixées `.parente-*` :
  - Modal : `parente-modal`, `parente-modal-backdrop`, `parente-modal-header`, `parente-modal-body`, `parente-modal.sheet` (variant mobile).
  - Sélecteur : `parente-selector`, `parente-selector-pill`, `parente-selector-pill.active`.
  - Onglets : `parente-tabs`, `parente-tab`, `parente-tab.active`.
  - Sous-arbre : `parente-subtree`, `parente-node-a`, `parente-node-b`, `parente-node-lca`, `parente-node-mid`, `parente-edge-pm`, `parente-term-songhay`, `parente-gloss`.
  - Zoom : `parente-zoom-controls`, `parente-zoom-btn`.
  - Détaillée : `parente-reciprocal`, `parente-tech-details`, `parente-explain`.
- **Responsive mobile** : `@media (max-width: 767px)` → `.parente-modal.sheet` (bottom-sheet plein écran).
- **Termes Songhay** : `<em lang="son">` + `font-family: var(--sh-serif)` + `color: var(--sh-terra)`.

## 7. Plan de migration

### Fichiers à supprimer

- `react-app/src/lib/songhoyRelationship.ts` (1081 l)
- `react-app/src/lib/songhoyRelationship.test.ts` (743 l)
- `react-app/src/hooks/useRelationTerms.ts`
- `react-app/src/components/relationship/MemberAutocomplete.tsx` (remplacé par `PersonPicker`)
- `react-app/src/components/relationship/PersonSelect.tsx` (orphelin probable, à vérifier)
- `react-app/src/components/relationship/RelationshipResult.tsx`
- `react-app/src/components/relationship/RelationCard.tsx`
- `react-app/src/components/relationship/RelationPathGraph.tsx`
- `react-app/src/components/relationship/TreePathModal.tsx`
- `react-app/src/components/admin/TermsManagementSection.tsx`

### Fichiers à éditer

- `react-app/src/pages/ParentePage.tsx` : réécrit, plus de dépendance à `useRelationTerms`.
- `react-app/src/pages/AdminPage.tsx` : retirer l'onglet/section « Termes » et l'import.
- `react-app/src/lib/types.ts` : supprimer `RelationTerm`, `RelationCategory`, `TermsDict`, `CategoriesDict`, `SonghoyRelationResult`, `AncestorInfo`, `RelationResult` (ancien).
- `react-app/src/styles/global.css` : nettoyer les classes `.parente-*` obsolètes ; conserver les tokens `.parente-page`.

### Migration SQL

Le projet a migré les nouvelles migrations vers `supabase/migrations/` depuis la 010. On suit cette convention :

```
supabase/migrations/013_drop_relation_terms.sql
  DROP TABLE IF EXISTS term_audit_log;
  DROP TABLE IF EXISTS relation_terms;
  DROP TABLE IF EXISTS relation_categories;
  DROP FUNCTION IF EXISTS update_relation_terms_updated_at();
```

Application manuelle sur la DB distante (convention du projet — même pattern que 010-012).

## 8. Tests

### Unit tests moteur — `lib/parenteSonghay/index.test.ts`

Les 14 cas du spec sur la fixture Sira/Modibo/Hadja/Cheick/Bakary/Khadidia/Mariam :

1. Frères directs (Modibo↔Hadja → `arma`/`woyma`).
2. Parent/enfant (Sira↔Modibo → `gna`/`izé`).
3. Kaga/haama répétés avec `coté baba/gna` (Sira↔Sékou, Sira↔Bakary, Sira↔Boubou, Modibo↔Lassana).
4. Oncles/tantes (Sékou↔Bourama, Modibo↔Bakary, Hadja↔Bakary, Bakary↔Bourama, Bakary↔Niamoye, Djéneba↔Lassana, Bakary↔Cheick via Djéneba).
5. Cousins germains (Bakary↔Koniba, Lassana↔Yaya, Djéneba↔Lalla).
6. Parallèle vs croisé (Bakary↔enfants branche Hadja).
7. **Cas clé : Cheick↔Bakary** → 2 relations ordonnées par proximité : `hassa`/`touba` via Sékou (proximité 3) avant `arma`/`arma` via Sira (proximité 6).
8. Reset baassa (Soumaïla↔Aïssata → `arma`/`woyma`).
9. Cousins très éloignés (Boubou↔Néné → `arma`/`woyma`).
10. `incomplete` si parent manquant sur chemin utilisé.
11. `no-link`.
12. Khadidia↔Niamoye → `gna` en tante parallèle.
13. Khadidia↔Mariam → `woyma` après reset baassa.
14. Khadidia↔Djéneba → `baassa woy` réciproque.

### Snapshot tests — `lib/parenteSonghay/explain.test.ts`

Un snapshot par `kind` (6 snapshots) avec des paramètres représentatifs, pour verrouiller le texte français pédagogique.

### Test manuel UI

Pas de test React automatisé. Validation manuelle : ouvrir `/parente`, tester :
- Cas normal (une relation).
- Cas multiple (Cheick↔Bakary).
- Cas same-person (même personne dans les deux pics).
- Cas no-link (personnes de branches déconnectées si la base en contient, sinon test forcé dans la fixture).
- Cas incomplete (forcé via fixture ou personne réelle avec parent inconnu).
- Zoom/pan sur le sous-arbre, responsive mobile/desktop.

## 9. Livrables & commits

Commits atomiques, chacun laissant l'app compilable et les tests verts :

1. `feat(parente): moteur de calcul songhay conforme au spec` — `lib/parenteSonghay/*` + tests.
2. `feat(parente): composant PersonPicker avec autocomplete` — `PersonPicker.tsx`.
3. `feat(parente): modal de resultat responsive` — `ParenteResultModal.tsx` + CSS responsive.
4. `feat(parente): sous-arbre SVG avec zoom/pan` — `SubTreeSvg.tsx`.
5. `feat(parente): vue detaillee avec explication pedagogique` — `DetailedView.tsx` + sous-composants.
6. `refactor(parente): integration dans ParentePage` — nouvelle `ParentePage.tsx`.
7. `chore(parente): suppression ancien systeme de termes DB` — suppression des fichiers + migration SQL + nettoyage `types.ts`.

## 10. Principes de conception

### Isolation

- Le moteur `lib/parenteSonghay/` est **totalement découplé** de React, Supabase, et du reste d'Alykoira. Entrée : `(idA, idB, MemberDict)`. Sortie : `RelationResult`. Publiable tel quel en package npm.
- Chaque fichier du moteur a un rôle unique et doit rester sous 200 lignes. Si un fichier dépasse, c'est le signal de re-découper.

### UI déclarative

- Les composants UI sont de simples projections de l'état et du `RelationResult` — aucune logique de calcul dans la vue.
- Pas de `setTimeout`, pas de spinner : le calcul est synchrone.

### YAGNI explicite

- ❌ Pas de cache/LRU.
- ❌ Pas de Web Worker.
- ❌ Pas d'export PNG/PDF.
- ❌ Pas de partage URL.
- ❌ Pas d'historique.
- ❌ Pas d'i18n multi-langue.

### Accessibilité (WCAG AA)

- Ratios de contraste vérifiés (terracotta `#E0845A` sur card `#111830` : 5.2:1 ✓).
- Focus visible (outline or).
- Échap ferme le modal. ← → naviguent entre relations quand focus dans la vue graphique.
- `aria-live="polite"` sur le container de résultats pour annoncer les changements.
- `role="button"` + `aria-label` sur les nœuds SVG.
- `<span lang="son">` sur les termes Songhay.

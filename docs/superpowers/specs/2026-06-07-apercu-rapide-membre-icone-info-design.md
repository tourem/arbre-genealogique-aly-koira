# Design — Aperçu rapide d'un membre via icône ℹ

**Date** : 2026-06-07
**Statut** : Validé
**Domaine** : Vue « Parenté » / Famille (React app)

## Intention

Dans la vue Parenté, les chips de la section **Descendance** n'affichent que le
prénom tronqué (`first_name`), pas le nom complet. Pour obtenir des détails,
l'utilisateur est obligé de **cliquer** sur la personne — ce qui **navigue** vers
sa fiche et fait perdre le contexte courant.

On veut une **icône ℹ** permettant d'afficher un **aperçu rapide** (nom complet,
prénom, surnom, génération, parents, ID en admin…) **sans naviguer**.

## Décisions validées

| Sujet | Décision |
|---|---|
| Mécanisme d'affichage | Icône ℹ → **réutilise le modal `TreePopup` existant** |
| Surfaces | **Partout** : chips Descendance + cartes Parents (Père/Mère) + en-tête conjoint des foyers |
| Visibilité de l'ID | **Admin-only** (inchangé) |
| Champ « Prénom » | **Ajouté** comme ligne distincte dans le popup |

## Constat technique (existant)

- La plomberie `onInfo?: (member: Member) => void` est **déjà câblée** depuis
  `FamillePage` (`onInfo={setPopupMember}`) jusqu'à `FoyersSection` /
  `ParentsSection` / `FoyerBlock` / `ParentCard`.
- Mais `FoyerBlock` et `ParentsSection` reçoivent le prop sous `_onInfo` et **ne
  l'utilisent pas** : aucun déclencheur ℹ n'existe sur les chips/cartes.
- `TreePopup` (`src/components/tree/TreePopup.tsx`) affiche déjà : nom complet
  (en-tête), surnom/alias (en-tête), badge génération, Genre, Père, Mère,
  Épouse(s), nb Enfants, note, et **ID + bouton copier en mode admin** (`isAdmin`).
- Composant tooltip léger existant `ButtonTip` — **non utilisé** ici (on garde le
  modal TreePopup).
- Référence visuelle : `redesign/Revue/mem.png` (chips tronqués « Abouba… »).

## Architecture de la solution

Aucun nouveau composant. On ajoute uniquement les **déclencheurs ℹ** et on
**enrichit** légèrement `TreePopup`.

### 1. `src/components/family/FoyerBlock.tsx`

- Brancher `onInfo` (renommer `_onInfo` → `onInfo`).
- **Chips Descendance** : ajouter un bouton ℹ par chip, **frère** (sibling) du
  `.child-chip-body` à l'intérieur du wrapper `.child-chip` — pas imbriqué, car
  imbriquer deux `<button>` est invalide. `onClick` → `onInfo(c)`.
  - Étant un bouton distinct, le clic ℹ **ne déclenche pas** `onNavigate`.
  - Ajouter la variante `.child-chip--has-info` pour réserver l'espace à droite,
    sur le même modèle que `.child-chip--has-menu`. Les deux variantes doivent
    pouvoir **coexister** (admin : ℹ + menu ⋯).
- **En-tête conjoint du foyer** : ajouter un bouton ℹ → `onInfo(spouse)`,
  **uniquement si `spouse` existe** (pas pour un foyer orphelin ni un conjoint non
  identifié sans objet `Member`).

### 2. `src/components/family/ParentsSection.tsx`

- Brancher `onInfo` dans `ParentCard` (renommer `_onInfo` → `onInfo`).
- Ajouter un bouton ℹ, **frère** du `.parent-card-body`, `onClick` → `onInfo(parent)`.
- Présent **uniquement pour un parent réel** (objet `Member` avec `id`), **absent**
  quand on n'a qu'un `fallbackName` (mère référencée par nom seul).

### 3. `src/components/tree/TreePopup.tsx`

- Ajouter une ligne **« Prénom »** affichant `member.first_name` dans
  `.tree-popup-body`, placée juste après la ligne « Genre » (ou avant).
  - Si `first_name` est `null`, ne pas afficher la ligne (ou afficher « — »).
- Le **Nom** (complet) et le **Surnom** (alias) restent dans l'en-tête (inchangé).
- L'**ID** reste sous `isAdmin` (inchangé).

### 4. `src/styles/global.css`

- Nouvelle classe partagée `.card-info-btn` (et variantes de positionnement par
  contexte : chip / parent-card / foyer-header) :
  - Toujours visible mais **discrète** (opacité réduite), s'éclaircit au
    survol/focus → reste tappable sur mobile (aucune dépendance au `:hover`).
  - Taille de cible tactile correcte (≥ 28px).
- Variantes `.child-chip--has-info` (réserve l'espace, gère la coexistence avec
  `--has-menu`) et l'ancrage de l'ℹ dans `.parent-card` et `.foyer-header`.
- Overrides thème **clair ET sombre** (régressions light mode déjà connues dans ce
  projet — vérifier le contraste dans les deux thèmes).

## Comportement de l'icône ℹ

- `type="button"`, focusable clavier, `aria-label="Aperçu de {member.name}"`.
- Clic / Entrée / Espace → `onInfo(member)` → ouverture du `TreePopup`.
- N'altère pas la navigation existante au clic sur la carte/chip.

## Tests (Vitest + React Testing Library)

- **`FoyerBlock`** :
  - rend un bouton ℹ par enfant de la descendance ;
  - rend un bouton ℹ dans l'en-tête conjoint quand `spouse` existe, pas pour un
    foyer orphelin ;
  - clic sur ℹ d'un enfant appelle `onInfo` avec le bon membre **et n'appelle pas**
    `onNavigate` ;
- **`ParentCard` / `ParentsSection`** :
  - ℹ présent pour un parent réel, **absent** pour un fallback (nom seul) ;
  - clic ℹ appelle `onInfo(parent)`.
- **`TreePopup`** :
  - la ligne « Prénom » s'affiche avec `first_name` ;
  - l'ID reste conditionné à `isAdmin` (non régressé).

## Hors scope (YAGNI)

- Aucun nouveau composant popover (on garde `TreePopup`).
- Pas de changement de la navigation au clic sur carte/chip.
- Pas d'exposition publique de l'ID (reste admin-only).
- `ButtonTip` non mobilisé pour cette feature.

## Critères de succès

- Depuis la vue Parenté, on peut consulter nom complet / prénom / surnom /
  génération / parents d'un enfant, d'un parent et d'un conjoint **sans naviguer**.
- Le clic sur la personne elle-même continue de naviguer comme avant.
- Aucune régression de contraste en thème clair ou sombre.

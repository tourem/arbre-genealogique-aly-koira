# Prompt Claude Code — Panneau d'édition de la fiche personne

## Contexte

Ajouter à Alykoira la possibilité de **modifier les informations d'identité d'une personne** depuis sa fiche : prénom, nom, surnom, sexe. L'édition se fait dans un **panneau latéral** (side drawer) qui glisse depuis la droite sur desktop, et remonte depuis le bas sur mobile. Le panneau est conçu pour accueillir dans le futur d'autres sections d'édition (état civil, tags culturels, notes) sans être refondu.

Une **maquette HTML interactive** accompagne ce prompt : `aly-koira-panneau-edition.html`. Elle contient tous les états du panneau (ouverture, saisie, modification, enregistrement, fermeture), le comportement responsive desktop/mobile, la gestion du dirty state, la copie de l'ID, et le toast de confirmation. Ouvre-la d'abord et explore-la — c'est ta référence visuelle et interactive, pas du code à copier.

## Principes structurants

**Pattern choisi : side panel / bottom sheet** plutôt que modale centrée ou édition inline. Raisons :
- L'édition n'est pas fréquente (quelques fois par semaine), donc la courbe d'apprentissage du pattern inline n'est pas justifiée.
- Le panneau conserve le contexte de la fiche derrière, ce qui réduit les erreurs.
- Le pattern se prête à l'accueil de sections multiples et futures sans refonte.
- Cohérent avec le FAB existant : toutes les actions du FAB (« Modifier », « Ajouter épouse », etc.) peuvent ouvrir le même type de panneau avec des contenus différents.

**Portée actuelle** : seule la section **Identité** est implémentée (prénom, nom, surnom, sexe). Les sections « État civil », « Généalogie », « Tags culturels », « Notes » sont **déclarées mais collapsed/disabled** avec un état « à venir » — pour que la structure de navigation soit posée et que l'ajout futur soit un simple remplissage.

**Zone technique séparée** : l'ID, les informations d'audit (créé par, modifié le) et la zone de danger (suppression) sont dans un footer technique en bas du panneau, visuellement distincts du formulaire d'édition. L'ID est en lecture seule avec bouton « Copier ».

---

## Anatomie du panneau

### Header

- Petit **eyebrow** en petites capitales gris faint : « MODIFIER LA FICHE ».
- **Titre** en Fraunces 22px : prénom + nom de la personne éditée. Surnom en Fraunces italique ocre 17px à côté.
- **Bouton fermer** (×) en haut à droite, 32×32, bordure fine neutre, hover terracotta. Ferme le panneau.
- Séparateur fin en bas.

### Corps scrollable

Organisé en **sections collapsibles**. Chaque section a :
- Un titre en Fraunces ocre 13px avec ligne de séparation en dessous.
- Un éventuel compteur à droite en JetBrains Mono 10px (ex : « 1 actif · 1 suggéré » pour les tags).
- Un chevron `▾` à droite si la section est collapsible. Par défaut, seule la section « Identité » est déployée ; les autres sont collapsed.

**Section 1 — Identité** (la seule active dans cette itération) :
- Champ **Prénom** (texte requis) avec label en petites capitales et marqueur « requis » à droite en terracotta.
- Champ **Nom** (texte requis) avec help text explicatif en dessous : « Nom patronymique tel qu'il est inscrit ou transmis oralement. »
- Champ **Surnom** (texte optionnel) avec un petit bouton d'aide `(?)` à côté du label qui affiche une info-bulle au survol : « Nom d'usage, nom de caste, nom honorifique ou sobriquet familial. » Le champ lui-même est en Fraunces italique ocre 15px pour que la saisie reflète visuellement le rendu final.
- Champ **Sexe** en segmented control (deux boutons Homme ♂ / Femme ♀) plutôt qu'en select, pour un choix en un clic.

**Section 2 — État civil** (collapsed, état « à venir ») :
- Placeholder : « Dates de naissance et de décès, lieu de naissance — à implémenter dans une prochaine version. »

**Section 3 — Généalogie** (collapsed, « à venir ») :
- Placeholder : « Modification des parents, foyers, épouses et enfants — à implémenter séparément, via les actions dédiées du FAB. »
- Cette section ne sera **probablement jamais complétée ici** car la modification des relations familiales se fait via le FAB (« Ajouter une épouse », « Ajouter un enfant », etc.). Elle est listée dans le panneau juste pour la transparence.

**Section 4 — Tags culturels** (collapsed, préparée pour l'avenir mais avec une logique minimale déjà active) :
- Label avec terme songhay `cultural_tags` en italique ocre.
- Zone de tags avec deux états visuels distincts :
  - **Tag confirmé** : pastille ronde pleine ocre, cliquable pour retirer.
  - **Tag suggéré** : pastille ronde avec bordure pointillée, couleur mute, annotation « suggéré » en petit. Cliquer dessus le confirme (passage à l'état plein, ajout à `cultural_tags`).
- Bouton « + Ajouter un tag » pour saisie manuelle.
- Help text : « Les tags *suggérés* sont calculés automatiquement depuis la structure familiale. Cliquez pour les confirmer et les ajouter explicitement à la fiche. »

**Section 5 — Notes** (collapsed, « à venir »).

### Footer technique

En bas du corps scrollable, **séparé par un filet fin** :
- **Titre** : « INFORMATIONS TECHNIQUES » en petites capitales gris faint.
- **Ligne ID** : label « ID » + valeur en JetBrains Mono tronquée à la largeur du panneau (ou user-select: all pour sélection au triple-clic) + bouton « Copier » avec icône clipboard. Au clic, copie dans le presse-papiers, change l'état du bouton en « Copié » couleur sauge pendant 2 secondes, affiche un toast de confirmation.
- **Audit rows** : deux lignes mono 11px gris faint, « Créé le [date] · par [user] » et « Modifié le [date] · par [user] ». Alignées en flex space-between.
- **Zone de danger** : bloc avec fond terracotta très transparent, titre « ZONE DE DANGER » en terracotta petites capitales, bouton « Supprimer cette fiche » avec icône corbeille en terracotta, et help text dessous : « La fiche sera archivée pendant 30 jours avant suppression définitive. Les liens familiaux seront conservés et redirigés vers une entrée vide. »

### Footer d'actions

Pied du panneau, hors scroll, toujours visible :
- **État à gauche** : petit point coloré + texte.
  - `Aucune modification` (gris faint, point faint) — état initial.
  - `Modifications non enregistrées` (ocre, point ocre) — dès qu'un champ est modifié.
  - `Enregistré` (sauge, point sauge) — pendant 1s après enregistrement avant fermeture.
- **Bouton « Annuler »** : neutre, ferme le panneau (avec confirmation si dirty).
- **Bouton « Enregistrer »** : gradient ocre, disabled si rien n'a changé. Active dès qu'un champ est modifié.

---

## Comportements et interactions

### Ouverture

- Déclenché depuis : le FAB sur la fiche (item « Modifier la fiche »), le menu trois-points, le raccourci clavier `E`.
- Animation : translation depuis la droite (desktop) ou depuis le bas (mobile), 350ms, easing `cubic-bezier(0.16, 1, 0.3, 1)`.
- Overlay semi-transparent derrière avec flou léger (`blur(3px)`), fade in 300ms.
- Focus auto sur le premier champ (prénom) après l'animation.
- `body` reçoit `overflow: hidden` pour bloquer le scroll en arrière-plan.

### Saisie et dirty state

- Chaque champ modifié reçoit une bordure ocre et un fond légèrement teinté (`color-mix(in srgb, var(--ocre) 4%, var(--bg-deep))`).
- Le footer passe de « Aucune modification » à « Modifications non enregistrées » dès qu'un champ change.
- Le bouton « Enregistrer » s'active.
- Validation côté client : prénom et nom requis (non vides après trim). Si l'utilisateur tente d'enregistrer avec un champ vide, highlight de ce champ en terracotta + message inline discret « Ce champ est requis ».

### Fermeture

- Trois voies : clic sur `×`, clic sur l'overlay, touche `Esc`.
- Si dirty, **confirmation modale** : « Vos modifications ne seront pas enregistrées. Fermer le panneau ? » avec boutons « Fermer quand même » (terracotta) et « Continuer à éditer » (neutre).
- Si pas dirty, fermeture immédiate.
- Animation inverse, 350ms.
- Reset de l'état dirty et des classes `changed`.

### Enregistrement

- Clic sur « Enregistrer » ou `Cmd/Ctrl + Enter` si panneau ouvert.
- Appel API `PATCH /persons/{id}` avec le payload des champs modifiés (pas tout le formulaire — seulement ce qui a changé, pour éviter les conflits d'écriture si plusieurs utilisateurs éditent en même temps).
- Pendant l'appel : bouton Enregistrer en état `loading` (spinner discret, disabled).
- En succès :
  1. Footer passe en état « Enregistré » (sauge).
  2. Toast « Fiche enregistrée » en bas de l'écran, 2,4s.
  3. Fermeture automatique du panneau après 900ms.
  4. Rafraîchissement de la fiche parente (refetch ou mise à jour locale du store).
- En erreur : bannière d'erreur en haut du panneau + champ concerné en terracotta si erreur de validation serveur.

### Copie de l'ID

- Clic sur « Copier » → `navigator.clipboard.writeText(id)`.
- Feedback visuel : bouton passe en sauge, texte devient « Copié ».
- Toast : « ID copié dans le presse-papiers ».
- Fallback si `navigator.clipboard` non disponible : sélectionner le texte de la valeur avec `Range`/`Selection` pour que l'utilisateur puisse faire `Cmd+C`.
- Accessibilité : `aria-live="polite"` sur le toast.

### Suppression (zone de danger)

- Clic sur « Supprimer cette fiche » → ouvre une **seconde modale de confirmation** par-dessus le panneau :
  - Titre : « Supprimer [Prénom Nom] ? »
  - Texte : « Cette action archive la fiche pendant 30 jours. Les liens familiaux (parents, enfants, foyers) sont conservés et redirigés vers une entrée vide. Passé 30 jours, la suppression est définitive. »
  - Champ de confirmation : « Tapez le nom de la personne pour confirmer : [input] ».
  - Boutons : « Supprimer définitivement » (terracotta, disabled tant que le nom saisi ne correspond pas exactement) et « Annuler » (neutre).
- Au succès : toast + fermeture du panneau + redirection vers la fiche des parents (fallback : page d'accueil).

### Sections collapsibles

- Clic sur le titre d'une section à bascule son état `collapsed`.
- Le chevron `▾` pivote de -90° quand collapsed.
- Le compteur à droite disparaît quand collapsed (économie visuelle).
- Le corps de la section (`.form-section-body`) est hidden quand collapsed.
- Animation d'ouverture/fermeture : `max-height` + `opacity` sur 200ms (ou simple `display: none` si l'animation pose problème).

### Tags culturels

- Les tags **confirmés** sont stockés dans `person.cultural_tags: string[]`.
- Les tags **suggérés** sont calculés à la volée par `resolveTags(person)` qui regarde :
  - `koda` → dernier enfant de la fratrie (`position === siblings.length - 1`).
  - Autres tags extensibles à l'avenir (`konkobey` pour premier-né, etc.).
- Affichage : tags confirmés en premier, tags suggérés ensuite (dashed border, couleur mute).
- Clic sur un tag suggéré → `cultural_tags.push(tag)` + retire de la liste des suggestions.
- Clic sur un tag confirmé → ouvre un sous-menu « Retirer ce tag » avec confirmation.
- Clic sur « + Ajouter un tag » → ouvre un autocomplete depuis la liste contrôlée des tags disponibles (enum côté code, éditable par l'admin).

---

## Responsive

### Desktop (≥ 720px)
- Panneau latéral droit, largeur 440px, hauteur 100vh.
- Overlay sur toute la page.
- Bordure gauche fine qui le sépare de la fiche derrière.

### Mobile (< 720px)
- Panneau en **bottom sheet** montant depuis le bas, hauteur 92dvh (dynamic viewport), largeur 100vw.
- Border-radius haut (18px).
- **Handle de drag** visible en haut (petite barre horizontale 40×4px grise) pour indiquer qu'on peut glisser pour fermer. Pas besoin d'implémenter la gesture de drag (clic sur l'overlay + bouton × suffisent, conformément à l'arbitrage précédent — pas de `vaul`).
- Footer d'actions avec `padding-bottom: calc(14px + env(safe-area-inset-bottom))` pour les iPhones à encoche.

---

## Accessibilité

- `role="dialog"` + `aria-modal="true"` sur le panneau.
- `aria-labelledby` pointant vers le titre du panneau.
- Focus trap : `Tab` et `Shift+Tab` circulent uniquement dans le panneau quand il est ouvert.
- `Esc` ferme le panneau.
- `Cmd/Ctrl + Enter` enregistre si le formulaire est dirty et valide.
- Tous les champs ont un `label` correctement associé via `for`/`id`.
- Le segmented control (sexe) utilise `role="radiogroup"` + `role="radio"` + `aria-checked` sur chaque option.
- Le toast a `aria-live="polite"`.
- Navigation clavier fonctionnelle sur les tags culturels (Tab, Enter pour confirmer/retirer).
- Contraste WCAG AA respecté sur tous les textes et fonds (la palette y répond par construction).

---

## Structure de données attendue côté API

### `PATCH /persons/{id}`

**Payload** (seulement les champs modifiés) :
```json
{
  "firstname": "Ali",
  "lastname": "Alkamahamane",
  "nickname": "Aly Koïra",
  "gender": "M"
}
```

**Réponse succès** :
```json
{
  "id": "7f3a2b8e-...",
  "firstname": "Ali",
  ...
  "updated_at": "2026-04-22T10:34:21Z",
  "updated_by": "user_abc123"
}
```

**Réponse erreur de validation** :
```json
{
  "error": "VALIDATION_FAILED",
  "fields": {
    "firstname": "Ce champ ne peut pas être vide",
    "lastname": "Longueur maximale 100 caractères"
  }
}
```

### `DELETE /persons/{id}` (soft delete)

**Comportement** : marque la fiche `archived_at = NOW()`. Un job quotidien supprime les fiches archivées depuis plus de 30 jours. Les relations (`father_id`, `mother_id`, `spouse_id`, etc.) référençant la personne sont conservées mais pointent vers une entrée vide avec un label « Personne supprimée » affiché en gris.

---

## Composants à créer ou réutiliser

### Nouveaux
- `EditPanel` : composant conteneur du panneau, reçoit en prop la personne à éditer et un callback `onSave`.
- `FormSection` : section collapsible avec titre, compteur, corps.
- `FormField` : wrapper label + input + help + erreur.
- `Segmented` : segmented control générique (peut être réutilisé ailleurs).
- `CulturalTags` : éditeur de tags avec tags confirmés + suggérés + ajout.
- `CopyButton` : bouton de copie avec feedback (peut être réutilisé pour d'autres IDs).
- `DangerZone` : zone de danger réutilisable avec modale de confirmation.
- `Toast` : notification bas de page (si pas déjà existant dans l'app).

### Réutilisés
- `Avatar` (existant)
- `SonghayTerm` (existant, pour le terme `windi` si on l'ajoute dans le titre de la section Généalogie future).
- Store de personnes : refetch après save.

---

## Ordre de travail suggéré

1. **Panneau vide** : squelette du conteneur avec open/close, animation, overlay, focus trap, `Esc`.
2. **Header et footer** : eyebrow, titre, bouton fermer, footer avec boutons Annuler/Enregistrer, état dirty.
3. **Section Identité** : les 4 champs avec validation côté client.
4. **API et enregistrement** : `PATCH /persons/{id}`, feedback visuel (dirty → loading → saved), toast, fermeture auto.
5. **Footer technique** : ligne ID + copie + audit rows.
6. **Zone de danger** : bouton suppression + modale de confirmation + `DELETE /persons/{id}`.
7. **Sections collapsibles** (État civil, Généalogie, Notes) : juste le shell avec le placeholder « à venir ».
8. **Tags culturels** : implémentation des suggestions auto-détectées (calcul de `koda`) et confirmation explicite.
9. **Responsive mobile** : bottom sheet, handle, safe-area.
10. **Accessibilité** : focus trap, ARIA, clavier complet, tests screen reader.

Chaque étape devrait être un commit atomique et déployable (même si les étapes suivantes ne sont pas faites, l'app reste fonctionnelle).

---

## Critères d'acceptation

- ✅ Le panneau s'ouvre depuis le FAB (« Modifier la fiche ») et le raccourci `E`.
- ✅ Les 4 champs d'identité sont modifiables et persistés côté API.
- ✅ Le dirty state est visible dans le footer et empêche la fermeture accidentelle.
- ✅ L'ID est copiable en un clic avec feedback visuel et toast.
- ✅ La suppression passe par une modale de confirmation avec saisie du nom.
- ✅ Sur mobile, le panneau devient un bottom sheet avec handle visible.
- ✅ `Esc` ferme, `Cmd/Ctrl+Enter` enregistre.
- ✅ Les sections futures (État civil, Généalogie, Notes) sont présentes mais collapsed avec un état « à venir ».
- ✅ Les tags culturels distinguent visuellement confirmés vs suggérés.
- ✅ Contraste WCAG AA respecté en mode clair et sombre.
- ✅ Aucune régression sur la fiche en arrière-plan (qui reste consultable pendant l'édition).

---

## Démarche

Ouvre d'abord `aly-koira-panneau-edition.html` dans un navigateur. La démo ouvre automatiquement le panneau après 300ms. Explore :
- Modifie un champ → observe le dirty state et le bouton Enregistrer qui s'active.
- Clique sur « Enregistrer » → observe le toast, l'état « Enregistré », la fermeture auto.
- Clique sur « Copier » à côté de l'ID → observe le feedback et le toast.
- Déplie/replie les sections « État civil », « Tags culturels ».
- Réduis la fenêtre sous 720px → observe le passage en bottom sheet.
- Bascule le thème via le bouton « Clair » en haut à droite.

Si tu identifies une ambiguïté, pose la question avant de coder.

# Prompt Claude Code — Refonte complète du design d'Alykoira

## Contexte

Tu travailles sur **Alykoira**, application de gestion de la généalogie de la famille Aly Koïra de Gao (Mali). La base contient environ 850 personnes sur 12 générations. L'app est responsive (desktop + mobile), actuellement en dark mode uniquement.

On veut **moderniser l'ensemble du design** et ajouter un **mode clair** commutable. La refonte doit renforcer l'identité culturelle songhay, densifier l'information sans l'amputer, et restructurer la fiche personne autour des foyers conjugaux plutôt que de listes parallèles.

Une **maquette HTML interactive complète** accompagne ce prompt : `aly-koira-maquette.html`. Elle contient toutes les vues de l'app dans leur version refondue, la navigation entre vues, le bascule clair/sombre, le FAB avec menu, le sheet « Plus », et les tooltips éducatifs sur les termes songhay. Ouvre-la dans un navigateur et explore-la en détail — c'est ta **référence visuelle et interactive**, pas du code à copier. Les valeurs exactes (padding, border-radius, gradients) sont à adapter au design system Alykoira.

## Vues couvertes par la refonte

1. **Fiche personne** (`/personnes/{id}`) — vue principale de consultation
2. **Parenté** (`/parente`) — calculateur de liens (fonctionnalité distincte spécifiée dans un autre document, ici seul son chrome/UI change)
3. **Administration** avec ses 5 onglets : Suggestions, Membres, Fusions, Utilisateurs, Parenté (termes)
4. **Sheet utilisateur « Plus »** (accessible depuis la navigation principale)

## Principes transverses à appliquer à tout

### 1. Système de thèmes clair/sombre

Mettre en place un **système de variables CSS** (ou tokens du design system) qui pilote intégralement la palette via un attribut `data-theme="dark"` ou `data-theme="light"` sur la racine. La maquette montre la palette complète. Points critiques :

- **Mode sombre** : fond `#15120e` (noir chaud terre cuite), élévations `#1d1812` et `#252018`, accents ocre chauds `#d4a84a`. Rompre avec le navy Gmail actuel pour une ambiance « veillée sahélienne ».
- **Mode clair** : fond crème `#faf5e8`, élévations plus claires, ocre plus saturé et plus foncé pour maintenir le contraste. **Ne pas utiliser du blanc pur `#ffffff`** — ce serait agressif et casserait l'identité chaude.
- **Bascule** : bouton d'alternance accessible depuis le topbar (icône lune/soleil) ET depuis le sheet « Plus » (item « Mode clair » / « Mode sombre »).
- **Persistance** : le choix du thème est enregistré en localStorage et appliqué dès le chargement avant le premier render pour éviter le flash.
- **Respect de `prefers-color-scheme`** à la première visite uniquement (ensuite, respecte le choix utilisateur).
- **Transitions** : changement de thème avec transition CSS de 300ms sur `background-color` et `color` uniquement (pas sur les ombres ni les transformations, pour éviter les sensations de lag).

### 2. Typographie éditoriale

Introduire **Fraunces** (Google Fonts, variable) pour les noms de personnes, les titres de sections, les termes songhay, et les nombres statistiques. Alternatives tout aussi valides si non disponible : Recoleta, Cormorant Garamond, Source Serif 4. Le corps de texte reste en sans-serif (Inter ou la police corporate actuelle). Les identifiants techniques (`term.arma`, `G5`, distances) utilisent JetBrains Mono ou équivalent.

Le choix d'un **serif variable à caractère** est non négociable — c'est ce qui donne à l'app son identité éditoriale et la distingue des apps génériques de généalogie.

### 3. Identité songhay comme fil conducteur

- **Composant réutilisable `SonghayTerm`** : affiche un terme songhay en italique serif couleur ocre, optionnellement dans un tag discret avec préfixe `◆`. Au survol, tooltip qui définit le terme. Exemples d'usage : `koda` (benjamin) dans le hero, `windi` (foyer) en sous-titre de section, `baba`/`gna` à côté des rôles parents, tous les termes du calculateur de parenté.
- **Palette d'accents** : ocre/or (primaire), terracotta (alertes), sauge (confirmations), prune (féminin). Éviter tout rose pâle Gmail.
- **Avatars** : remplacer les gradients bleu/rose actuels par ocre chaud (hommes) et terre-prune (femmes). Voir maquette.
- **Logo** : le « oï » de Koïra traité en italique ocre dans le mark typographique.

### 4. Responsive et navigation

- **Desktop (≥720px)** : navigation principale (Famille / Parenté / Plus) intégrée dans le **topbar** en ligne horizontale.
- **Mobile (<720px)** : navigation principale en **bottom tabs** fixes en bas d'écran, avec `safe-area-inset-bottom`.
- Le topbar devient sticky avec backdrop-filter sur les deux breakpoints.
- Le FAB d'édition de la fiche se positionne **au-dessus** de la bottom-tabs sur mobile (offset suffisant pour ne pas les superposer).
- La barre de recherche passe sous le logo en mobile (pleine largeur) pour préserver la zone tappable.

---

## Axe 1 — Fiche personne : refonte structurelle

### Problème actuel
La fiche présente trois listes parallèles (Parents, Épouses, Enfants). L'information est linéaire alors que la structure sociale réelle est nichée — un enfant appartient à un couple (père × mère), pas à une personne isolée. La hauteur totale pour une personne polygame à 7 enfants est d'environ 1400px.

### Refonte cible

Passer de `Parents → Épouses → Enfants` à `Parents → Foyers (chacun contenant sa descendance)`.

**Bloc Hero (en-tête de fiche)** :
- Avatar rond 80px avec badge de génération `G5` en bas à droite.
- Nom en Fraunces 36px + nom de clan (« Aly Koïra ») en Fraunces italique ocre.
- Ligne de métadonnées sous le nom : sexe (avec glyphe ♂/♀ coloré), génération, tags culturels (comme le tag `koda` pour benjamin).
- Supprimer la barre de progression « 5eme sur 12 générations » (aucune valeur sémantique).
- Stats alignées à droite : chiffres en Fraunces 28px (« 3 Épouses », « 7 Enfants ») avec labels en petites capitales.
- Sous le hero, **encart éditorial** pour les notes culturelles (`KODA`), avec bord gauche ocre 2px, fond en gradient très subtil, typographie serif italique — traitement « citation de livre », pas « notification système ».

**Section Parents** :
- Grille 2 colonnes (desktop) / 1 colonne (mobile).
- Chaque carte parent contient : avatar avec badge génération, rôle (« Père » / « Mère ») + terme songhay en italique (« · baba » / « · gna »), nom complet, **lignage complet non tronqué** (« Fils de X, petit-fils de Y, époux de Z »).
- Au hover : bordure ocre + léger translateY(-1px) + fond légèrement plus clair.

**Section Foyers** (remplace Épouses + Enfants) :
- Titre « Foyers » avec terme songhay `windi` en italique à côté, et compteur en mono.
- Un bloc par conjoint, dans une carte autonome :
  - **En-tête du foyer** : pastille ronde avec rang (1, 2, 3), avatar + nom du conjoint cliquable, rang textuel (« 3ème épouse »), compteur d'enfants à droite.
  - **Zone descendance** avec label « Descendance » et grille responsive des enfants (`auto-fill, minmax(180px, 1fr)`). Chaque puce contient avatar 26px, prénom, surnom en italique serif le cas échéant, méta « G6 · ♂ » en monospace.
  - **Filet vertical** en gradient ocre-vers-transparent reliant l'en-tête du foyer à la zone descendance (uniquement décoratif, via `::before`).
- Au hover d'une puce enfant : bordure gauche ocre qui apparaît + fond subtilement plus clair.

### Suppression des boutons « + Ajouter »
Les boutons pleine largeur en pointillés (« + Ajouter une épouse », « + Ajouter un enfant ») disparaissent. Remplacés par le **FAB contextuel** (voir section suivante).

---

## Axe 2 — Bouton d'action flottant (FAB)

### Spécification détaillée

**Apparence au repos** :
- Position fixe bottom-right, offset 24px sur desktop, 90px sur mobile (au-dessus des bottom-tabs).
- Cercle 52px, background gradient ocre (`#e8c472 → #a07d2b` en sombre, plus saturé en clair).
- Icône `+` blanche 22px, centrée, épaisseur 2.5px.
- Triple ombre : `0 8px 24px ocre28%` + `0 2px 6px black40%` + `inset 0 1px 0 white20%` (pour le relief).
- Au hover : léger `translateY(-2px) scale(1.05)` + ombre plus large + halo flou coloré via `::before`.

**Clic → Menu contextuel** :
- L'icône `+` pivote de 45° pour devenir `×` (transition cubic-bezier 300ms).
- Menu popover apparaît au-dessus du FAB, largeur 240px, avec :
  - Backdrop très léger (`rgba(13,11,8,0.6)` sombre / `rgba(42,31,18,0.3)` clair) + `blur(2px)`.
  - Animation `scaleIn` depuis l'origine bottom-right.
  - Flèche décorative vers le FAB.
- **Structure du menu** :
  - Header « Actions » en micro-caps.
  - Item « Modifier la fiche » (icône crayon, hint `E`).
  - Item « Ajouter une épouse » (icône « personnes + », hint « Nouveau foyer »).
  - Item « Ajouter un enfant » (icône « personne + », hint « Choisir le foyer », chevron `›` → ouvre un sous-menu).
  - Séparateur.
  - Item « Voir dans l'arbre » (icône « grille »).
  - Item « Partager la fiche » (icône « flèche vers le haut »).
  - Séparateur.
  - Item « Supprimer la fiche » en **terracotta** (icône « corbeille »).
- Au clic sur un item, l'action est déclenchée (modal d'édition, sous-menu, navigation).
- Au clic sur le backdrop ou sur Échap, le menu se ferme et l'icône revient en `+`.

**Sous-menu « Choisir le foyer »** :
- Affichage identique au menu principal mais avec header `‹ Retour` + titre « Ajouter un enfant au foyer `windi` ».
- Un item par foyer existant : avatar + nom de l'épouse + méta (« 1ère épouse · 1 enfant »).
- Dernier item : « Créer un nouveau foyer » avec avatar dashed ocre.
- Si la personne n'a qu'un seul foyer, le sous-menu est sauté et le formulaire d'ajout s'ouvre directement.

**Adaptations contextuelles du menu** :
- L'item « Compléter un parent » apparaît uniquement si père ou mère est `null`.
- L'item « Ajouter un enfant » est grisé si la personne n'a pas encore d'épouse (proposer d'abord « Ajouter une épouse »).

**Visibilité du FAB** :
- Visible uniquement sur la fiche personne.
- Masqué sur Parenté, Administration, et toutes les autres vues.

**Accessibilité** :
- `role="menu"` sur le conteneur, `role="menuitem"` sur chaque item.
- Navigation clavier : `Tab` pour entrer, flèches ↑↓ pour naviguer, `Entrée` pour valider, `Échap` pour fermer.
- Focus visible en ocre sur chaque item.
- Labels ARIA explicites sur le FAB (« Actions sur la fiche, menu fermé » / « ...menu ouvert »).

---

## Axe 3 — Sheet « Plus »

Remplace l'actuel popover central par un **bottom sheet** sur mobile et un **popover ancré au tab** sur desktop.

### Mobile
- Sheet qui remonte depuis le bas avec animation `translateY(20px) → 0` + fade.
- Largeur pleine jusqu'à 440px, centré.
- Border-radius haut à 18px, pas de radius en bas (colle au safe-area-inset).
- **Handle** horizontal 40×4px en haut (indicateur de drag).
- Backdrop qui assombrit + flou.
- Swipe down ferme le sheet (gesture à implémenter avec lib type `vaul` si dispo, sinon manuel).

### Desktop
- Popover classique ancré sous le tab « Plus » du topbar, width 300-340px.
- Même contenu structurel que le sheet mobile.

### Contenu du sheet (identique mobile/desktop)
- **En-tête utilisateur** : nom de l'utilisateur connecté (Fraunces 18px), stats sous-jacentes en mono (« 853 membres  12 générations »), badge « Admin » ou « Membre » à droite.
- Séparateur.
- **Items** :
  - « Contribuer » (icône +)
  - « Mes suggestions » (icône document)
  - « Administration » (icône engrenage) — visible uniquement si Admin
  - « Mode clair » / « Mode sombre » (icône lune/soleil dynamique, toggle sans fermer le sheet)
  - « Déconnexion » (icône flèche sortante, en terracotta)
- Version de l'app en bas en JetBrains Mono, très discret.

---

## Axe 4 — Parenté (chrome uniquement)

La logique et les résultats du calculateur sont spécifiés dans un autre document (`prompt-claude-code-feature-parente-alykoira.md`). Ici, seul le chrome de la page change :

- **En-tête** : icône de marque (gradient ocre 44×44px avec glyphe « personnes »), titre « Parenté » en Fraunces 28px, sous-titre « Liens familiaux · Terminologie songhay » en italique.
- **Deux champs de saisie** côte à côte (desktop) / empilés (mobile), chacun dans une carte `field-group` :
  - Field A : liseré supérieur en gradient sauge→ocre, label en majuscules couleur sauge.
  - Field B : liseré supérieur en gradient ocre→terracotta, label en majuscules couleur terracotta.
- **État vide** au centre sous les champs : glyphe discret + phrase invitation en Fraunces italique.
- **Suggestions** en dessous : pills rondes avec les paires proposées, chacune incluant le terme songhay résultant (« ancêtre & descendant », « arma », « cousins ») en italique ocre.

Le reste (popup résultats, onglets, sous-arbre SVG) est couvert par l'autre spec.

---

## Axe 5 — Administration

Page accessible via le sheet « Plus » → « Administration ». Structure commune à toutes les sous-vues :

### Shell commun
- Titre « Administration » en Fraunces 28px.
- **Onglets** (Suggestions / Membres / Fusions / Utilisateurs / Parenté) en ligne horizontale scrollable sur mobile, avec indicateur actif (bar ocre 2px sous l'onglet actif), couleur texte ocre sur actif, gris mute sinon.

### Membres
- Ligne de stats : 4 cartes compactes (853 membres / 457 hommes / 396 femmes / 12 générations), chiffre en couleur distincte (ocre / bleu / prune / terracotta), label en petites caps.
- Barre de recherche + pills de filtre (« Tous », « Hommes », « Femmes », « ⋯ ») + bouton « + Ajouter » à droite (gradient ocre).
- **Groupes par génération** : label central « Génération **0** — 1 membre » en gris, suivi des cartes.
- Chaque **carte membre** : avatar, nom (Fraunces 15px), surnom en italique ocre si présent, méta « Homme · 2 enfants », tag génération en terracotta à droite, bouton crayon, bouton « ⋯ ».

### Utilisateurs
- 4 stats : 9 utilisateurs / 9 actifs / 0 en attente / 5 admins.
- Barre de recherche (par nom ou email) + pills de filtre (« Tous », « Actifs », « En attente »).
- Chaque **ligne utilisateur** : avatar (initiales), nom en Fraunces, email en mono ink-mute, badge de rôle (« Admin » en ocre sur fond ocre transparent, « Membre » en prune), bouton « ⋯ ».

### Parenté (gestion des termes)
- Titre « Termes Songhay » en Fraunces ocre.
- **Grille de lignes** : colonne gauche = clé technique (`term.arma`) en mono gris, colonne centre = input éditable avec valeur actuelle en Fraunces italique 14px, colonne droite = bouton reset (↺) qui restaure la valeur par défaut.
- L'input a un fond `bg-deep` pour contraste, bordure fine, focus ocre.
- Permet à l'admin de customiser les termes en fonction du dialecte koroboro senni (Gao) versus zarma (Niger) par exemple.

### Suggestions
- État vide par défaut : glyphe discret + phrase « Aucune suggestion en attente » + sous-texte explicatif « Les contributions des membres apparaîtront ici pour validation ».
- Quand il y a des suggestions : liste de cartes avec titre de la suggestion, contributeur, date, boutons « Approuver » / « Rejeter » / « Voir le détail ».

### Fusions
- Liste de paires de doublons potentiels détectés dans la base. Chaque paire affichée côte à côte avec bouton « Fusionner ». (La logique de détection est hors scope de la refonte design.)

---

## Axe 6 — Topbar et recherche globale

- **Sticky** sur toutes les vues, avec `backdrop-filter: blur(14px)` et fond semi-transparent.
- **Logo** à gauche : mark ocre 32px + texte « Aly K**oï**ra » avec « oï » en italique ocre.
- **Recherche globale** au centre (input avec icône loupe à gauche), max 420px desktop. Sur mobile, passe sous le logo en pleine largeur.
- **Navigation principale** (Famille / Parenté / Plus) à droite du search sur desktop (format horizontal compact). Sur mobile, disparaît de la topbar et passe en bottom-tabs.
- **Bouton thème** (lune/soleil) tout à droite, toujours visible.

---

## Consignes d'implémentation

### Ce qu'il faut conserver
- Les avatars avec initiales (bonne décision existante).
- Le dark mode chaud comme **défaut** (mais ajouter le clair).
- Le contraste des accents or sur fond sombre.
- La structure des données (modèles Person, Foyer, User, Suggestion).

### Ce qu'il faut éviter
- Pas de nouveau framework UI si le projet utilise déjà quelque chose (Tailwind, shadcn, etc.) — travailler **avec** l'existant.
- Pas de bibliothèque d'animation lourde (Framer Motion est acceptable si déjà présent ; sinon, CSS transitions suffisent).
- Pas de remplacement complet de la palette dans un seul commit. Procéder progressivement : tokens → typo → composants → vues.

### Livrables attendus
1. **Système de thèmes** : variables CSS (ou tokens) avec les deux palettes, toggle fonctionnel, persistance localStorage, respect de `prefers-color-scheme` au premier chargement.
2. **Composants réutilisables** :
   - `Avatar` (tailles sm/md/lg, variante male/female, badge génération optionnel)
   - `SonghayTerm` (avec tooltip éducatif au survol)
   - `FoyerBlock` (en-tête conjoint + grille enfants)
   - `FAB` avec son menu contextuel (et sous-menu)
   - `PlusSheet` (bottom sheet mobile / popover desktop)
   - `AdminTabs` (onglets scrollables)
   - `RoleBadge` (Admin / Membre)
3. **Refonte des vues** : fiche personne, parenté (chrome), 5 sous-vues admin.
4. **Topbar** avec navigation intégrée, bouton thème, recherche globale sticky.
5. **Bottom tabs** responsive, masquées sur desktop, visibles sur mobile avec safe-area.
6. **Intégration typographique** : chargement de Fraunces (ou alternative), JetBrains Mono, Inter. Préchargement et `font-display: swap`.

### Ordre de travail suggéré (commits atomiques)
1. Ajout du système de thèmes (variables CSS + toggle) sans toucher aux composants.
2. Chargement des nouvelles typographies.
3. Refonte de la topbar avec navigation intégrée et bouton thème.
4. Implémentation du composant `Avatar` unifié.
5. Implémentation du composant `SonghayTerm` avec tooltips.
6. Refonte du hero de la fiche personne.
7. Refonte de la section Parents.
8. Implémentation du composant `FoyerBlock` et refonte de la section Foyers.
9. Implémentation du FAB avec son menu contextuel et sous-menu.
10. Implémentation du sheet « Plus » (bottom sheet mobile / popover desktop).
11. Refonte du chrome de la page Parenté.
12. Refonte des 5 sous-vues Administration (shell commun + contenus).
13. Bottom tabs mobile et tests responsive.
14. Validation de l'accessibilité (contraste, navigation clavier, ARIA).

### Démarche recommandée

Ouvre d'abord `aly-koira-maquette.html` dans un navigateur. Parcours chaque vue en cliquant sur les différentes zones (le FAB, le tab « Plus », les onglets Admin). Bascule entre mode sombre et clair via le bouton topbar. Inspecte le CSS pour comprendre les choix précis (variables, valeurs exactes). Seulement ensuite, commence l'implémentation.

Quand un détail de la maquette entre en conflit avec une convention du design system Alykoira : **privilégie la convention d'Alykoira**. La maquette est une cible esthétique, pas un ordre. Si tu identifies une incohérence ou une ambiguïté, pose la question avant de coder.

## Critères d'acceptation

L'implémentation est considérée terminée quand :

- ✅ Le bascule thème clair/sombre fonctionne sur toutes les vues sans flash au rechargement
- ✅ La fiche personne est passée à la structure `Hero → Parents → Foyers` avec Foyers contenant leurs enfants
- ✅ Le FAB apparaît uniquement sur la fiche, avec son menu + sous-menu contextuels
- ✅ Le sheet « Plus » fonctionne en bottom sheet mobile et popover desktop, avec swipe-down sur mobile
- ✅ Les onglets Admin sont tous refondus avec le shell commun
- ✅ Les termes songhay (`koda`, `windi`, `baba`, `gna`, etc.) apparaissent en italique ocre avec tooltip éducatif
- ✅ La typographie Fraunces est appliquée aux noms, titres, et termes culturels
- ✅ Le responsive fonctionne sur desktop (≥720px) et mobile (<720px) sans régression
- ✅ Les avatars utilisent les gradients ocre/terre-prune (plus de bleu/rose Gmail)
- ✅ Aucun encart « + Ajouter » pleine largeur en pied de section — tout passe par le FAB
- ✅ L'accessibilité est respectée (contraste WCAG AA, navigation clavier, ARIA)

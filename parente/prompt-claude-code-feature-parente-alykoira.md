# Prompt pour Claude Code — Fonctionnalité « Calculateur de parenté songhay » dans Alykoira

## Contexte

Tu travailles sur **Alykoira**, application de gestion de la généalogie de la famille Aly Koïra de Gao (Mali). La base contient environ 600 personnes sur 12 générations, chacune décrite par au minimum : `id`, `prenom`, `nom`, `surnom` (optionnel), `sexe` ('M' ou 'F'), `pereId` (nullable), `mereId` (nullable), et éventuellement une année de naissance et une branche familiale.

On veut ajouter une nouvelle fonctionnalité : un **calculateur de liens de parenté selon le système traditionnel songhay**, qui permet à l'utilisateur de choisir deux personnes et de découvrir leurs liens de parenté tels qu'ils seraient nommés en pays songhay.

## Document de référence

Lis attentivement le document **`algorithme-parente-songhay.md`** (fourni en pièce jointe) AVANT de commencer à coder. Il spécifie de manière exhaustive :

- Le glossaire des 13 termes songhay : `baba`, `gna`, `izé`, `arma`, `woyma`, `baassa arou`, `baassa woy`, `hassa`, `touba`, `hawa`, `kaga arou`, `kaga woy`, `haama`
- La règle générative à un seul niveau de mémoire (sibling-équivalents, reset à chaque génération)
- Le pseudo-code de l'algorithme en 5 étapes (énumération des chemins, recherche des LCA minimaux, classification, déduplication, tri par proximité)
- Le modèle de données TypeScript et le format de sortie attendu
- La sémantique critique : `termForA` désigne le terme par lequel A est appelé (dépend du sexe de A et de sa position structurelle), pas du sexe du locuteur

**Implémente l'algorithme strictement selon ce document, en TypeScript.** Si tu identifies une ambiguïté ou un cas non couvert dans le document, pose la question avant de coder.

## Objectif fonctionnel

Permettre à l'utilisateur de :
1. Saisir deux personnes via leurs nom/prénom/surnom avec autocomplétion
2. Voir automatiquement les liens de parenté calculés selon le système songhay
3. Visualiser ces liens sous forme graphique (sous-arbre) ou textuelle détaillée
4. Naviguer entre plusieurs liens si plusieurs relations coexistent (cas des unions intergénérationnelles)

## Interface utilisateur

### Écran principal : zone de saisie

Crée une nouvelle page (ou un nouveau modal selon l'architecture d'Alykoira) intitulée **« Liens de parenté »**. Elle contient un **bloc de recherche** composé de :

**Deux champs de saisie côte à côte** (empilés en vertical sur mobile) :
- Champ gauche, label **« Personne A »** (couleur d'accent visuel n°1, par exemple bleu)
- Champ droit, label **« Personne B »** (couleur d'accent visuel n°2, par exemple ocre/orange)
- Chaque champ est un input de recherche avec autocomplétion

### Comportement de l'autocomplétion

À chaque frappe :
- Recherche dans toutes les personnes de la base
- Le matching se fait sur **prénom ET nom ET surnom** simultanément (concaténer ces 3 champs ou faire un OR sur les 3)
- **Insensible à la casse et aux accents** (utiliser une normalisation Unicode NFD pour retirer les diacritiques avant comparaison)
- Match par **préfixe et par sous-chaîne** (« kha » doit trouver « Khadidia », « koi » doit trouver les Aly Koïra)
- Si la personne a un surnom, taper le surnom doit aussi la trouver

**Affichage du dropdown de résultats** :
- Maximum 8-10 résultats visibles, scroll au-delà
- Pour chaque résultat, afficher :
  - Nom complet (prénom + surnom entre parenthèses si présent + nom de famille)
  - Icône ♂ ou ♀ pour le sexe
  - Année de naissance si disponible, sinon génération
  - Branche familiale ou village d'origine si disponible (en plus petit)
- Mettre en évidence (gras ou surligné) la portion du nom qui correspond à la recherche

**Sélection** :
- Au clavier : flèches haut/bas pour naviguer, Entrée pour valider, Échap pour fermer le dropdown
- À la souris : clic pour valider
- Une fois sélectionnée, la personne est « locked » dans le champ (le nom complet apparaît en clair, on peut effacer pour resélectionner)

### Comportement après sélection

- **Quand les DEUX champs contiennent une personne valide**, le calcul se déclenche **automatiquement** et le popup de résultat s'ouvre
- Pas besoin de bouton « Calculer » — l'expérience doit être fluide
- Si l'utilisateur efface un champ, la sélection correspondante est retirée et le popup se ferme
- Si l'utilisateur sélectionne la **même personne** dans les deux champs : afficher un message inline « C'est la même personne » sans ouvrir le popup
- Si la première personne est sélectionnée et la deuxième est en cours de saisie, ne pas ouvrir le popup tant que la sélection n'est pas validée

### Cas particuliers à gérer

- **Aucun lien de sang** entre les deux personnes : afficher dans le popup un message explicatif « Aucun lien de parenté trouvé entre [Nom A] et [Nom B] dans la base. Ils n'ont aucun ancêtre commun connu. » avec un sous-texte indiquant que cela peut être dû à des branches familiales déconnectées ou à des données manquantes.
- **Parents non renseignés bloquant le calcul** : retourner le statut `incomplete` de l'algorithme et afficher « Calcul incomplet : la généalogie de [Nom de la personne avec parent manquant] n'est pas suffisamment renseignée pour déterminer ce lien. Compléter [pereId/mereId] pourrait permettre le calcul. » avec idéalement un lien vers la fiche de la personne concernée.

## Popup de résultat

Quand le calcul aboutit avec au moins une relation, ouvrir un **modal centré** par-dessus l'écran principal.

### Structure du modal

- **Backdrop** semi-transparent foncé qui ferme le modal au clic
- **Touche Échap** ferme aussi le modal
- **En-tête du modal** : 
  - Titre « Liens de parenté » avec sous-titre « [Nom complet A] ↔ [Nom complet B] »
  - Bouton de fermeture (×) en haut à droite
- **Deux onglets** sous l'en-tête :
  1. **« Vue graphique »** (actif par défaut)
  2. **« Vue détaillée »**
- **Corps scrollable** sous les onglets

### Sélecteur de relation (si N > 1)

Si l'algorithme retourne **plusieurs relations distinctes** (cas typique : double filiation, union intergénérationnelle), afficher en haut du corps du modal un **sélecteur horizontal** avec un bouton par relation, indiquant :
- Le numéro de la relation (01, 02, 03...)
- Les termes principaux (`hassa/touba`, `arma/arma`, etc.)
- Le nom du LCA (« via [Nom] »)

Cliquer sur un bouton bascule l'affichage entre les différents sous-arbres / textes. Le bouton actif est visuellement distinct.

### Onglet « Vue graphique »

Affiche un **sous-arbre généalogique dédié** à la relation sélectionnée. Ce n'est PAS l'arbre complet de la famille, c'est uniquement les nœuds pertinents pour cette relation.

**Construction du sous-arbre** :
- L'ancêtre commun (LCA) est positionné en **haut centre**
- Une chaîne descendante part vers la **gauche** : du LCA → ses descendants intermédiaires → la personne A
- Une chaîne descendante part vers la **droite** : du LCA → ses descendants intermédiaires → la personne B
- Si A est elle-même le LCA (cas dA=0, lien direct ascendant), une seule chaîne verticale est affichée
- Idem si B est le LCA

**Style des nœuds** :
- Forme : rectangle arrondi avec le nom de la personne au centre
- **A** : marqué avec une couleur d'accent (bleu) et un tag « A »
- **B** : marqué avec une couleur d'accent (ocre) et un tag « B »
- **LCA** : marqué avec une couleur de mise en évidence (terracotta ou similaire) et un tag « LCA »
- Nœuds intermédiaires : couleur neutre, légèrement teintée selon le sexe (bleu pâle pour ♂, rose pâle pour ♀)
- Si l'app affiche un avatar, le réutiliser dans les nœuds

**Annotations sur les liens** :
- Chaque lien (segment vertical entre deux générations) porte un label **« P »** (père) ou **« M »** (mère) au milieu
- Le label est dans un petit badge avec fond contrasté pour rester lisible
- Cela permet de voir d'un coup d'œil par quelle branche (paternelle ou maternelle) on remonte

**Annotations des termes songhay** :
- Sous le nœud A, afficher en italique le terme par lequel A est désigné dans cette relation (ex: « touba »)
- Sous le nœud B, idem (ex: « hassa »)
- Police serif italique pour donner un côté éditorial aux termes

**Contrôles de zoom et pan** (en bas à droite du conteneur du sous-arbre) :
- Bouton **+** pour zoomer
- Indicateur du niveau de zoom en pourcentage
- Bouton **−** pour dézoomer
- Bouton **⟲** pour réinitialiser le zoom et auto-centrer le sous-arbre dans le viewport
- **Pan** : drag à la souris (curseur passe en mode `grab`/`grabbing`) ou au doigt sur mobile
- **Zoom à la molette** : maintenir Ctrl/Cmd + scroll
- Limites : zoom min 30%, max 300%

**Important — bug à éviter** :
Au moment de calculer le centrage initial (`resetZoom`), il faut **attendre que le navigateur ait fait le layout du modal**, sinon `viewport.clientWidth` peut valoir 0 et le `zoomLevel` se retrouve à 0 → le sous-arbre devient invisible. Utiliser un double `requestAnimationFrame` ou un `setTimeout(0)` après l'ouverture du modal avant le rendu, et prévoir des fallbacks (valeurs par défaut 800×440) si les dimensions sont encore nulles.

**Légende** sous le sous-arbre :
Petites pastilles avec libellés expliquant les couleurs (Personne A, Personne B, Ancêtre commun) et les labels P/M.

### Onglet « Vue détaillée »

Affiche pour **chaque relation** une fiche détaillée. Si plusieurs relations, toutes sont listées verticalement, triées par proximité. Si le sélecteur de relation est utilisé, les fiches s'adaptent (mais idéalement la vue détaillée montre TOUT pour permettre comparaison).

**Structure d'une fiche** :

1. **En-tête de la fiche** :
   - Numéro et label : « 01 · Lien principal », « 02 · Lien secondaire », etc.
   - Mention « via ancêtre commun [Nom du LCA] »

2. **Énoncés réciproques** (en gros, format mis en valeur) :
   - « **[Nom B]** est *[terme songhay]* pour **[Nom A]** »
   - « **[Nom A]** est *[terme songhay]* pour **[Nom B]** »
   - Le terme songhay en italique avec couleur d'accent (terracotta)

3. **Détails techniques** (encart secondaire, plus petit) :
   - Chemin de A : « [Nom A] → sa mère [Nom] → son père [Nom] → ... » (en utilisant `son/sa` selon le sexe du parent intermédiaire et `père/mère` selon le hop P/M)
   - Chemin de B : idem
   - Distances : `dA = 2`, `dB = 1`, `score de proximité = 3`, `équilibre = 2`

4. **Explication pédagogique** (encart de fond légèrement teinté, police serif italique) :
   - Un paragraphe en français expliquant **pourquoi** ce terme songhay est utilisé pour cette configuration
   - Le contenu varie selon le `kind` de la relation retourné par l'algorithme :
     - `direct-descendant` / `direct-ascendant` : explication sur la ligne directe (parent biologique, ou kaga avec côté baba/gna selon la branche)
     - `parallel` (frères/sœurs ou cousins parallèles) : explication sur la fusion bifurquée du système soudanais (les enfants de deux frères ou de deux sœurs sont nommés comme des frères/sœurs)
     - `cross` (cousins croisés) : explication sur la distinction parallèle/croisé typique du système songhay
     - `avuncular` avec terme `hassa` : explication sur l'avunculat soudanais et le rôle social spécial de l'oncle maternel
     - `avuncular` avec terme `hawa` : explication sur l'asymétrie tante paternelle / oncle maternel (pas de touba pour la tante)
     - `avuncular` avec terme `baba`/`gna` : explication sur l'oncle/tante parallèle nommé comme un parent
     - `distant-vertical` : explication sur les `kaga` répétés et le suffixe `coté baba/gna`
   - Cette explication doit être **générée dynamiquement** selon les paramètres de la relation, pas hardcodée

## Tri des relations

Si plusieurs relations sont retournées, elles doivent être **triées du plus proche au plus éloigné** :
- **Critère primaire** : score de proximité (`dA + dB`) croissant
- **Critère secondaire** (égalité) : équilibre (`max(dA, dB)`) croissant

La relation la plus proche est affichée en premier dans le sélecteur, dans la vue graphique par défaut, et en haut de la vue détaillée.

## Design et identité visuelle

Respecter le design system existant d'Alykoira (composants, couleurs, typographies). Si certains éléments doivent être créés, suivre ces principes :

- **Typographie** : un serif distinctif et chaleureux pour les titres et termes songhay (par exemple Fraunces, Cormorant Garamond, ou autre serif disponible dans le design system) ; un sans-serif moderne pour le corps (la police corporate d'Alykoira)
- **Palette** : harmonie chaude et terreuse rappelant l'esthétique sahélienne (terracotta, ocre, sauge, crème) si compatible avec le design system existant
- **Pas d'emojis dans l'interface** sauf éventuellement les icônes ♂/♀ pour le sexe
- **Contraste WCAG AA** respecté pour tous les textes

## Considérations techniques

- **Réutiliser les composants UI existants** d'Alykoira (Modal, Input, Dropdown, Button) plutôt que d'en recréer
- **Source de données** : connecter au store/API qui contient déjà les ~600 personnes
- **Performance de l'autocomplétion** :
  - Si la liste est en mémoire/cache : pas de débounce nécessaire, recherche synchrone
  - Si la liste vient d'une API : débouncer la frappe à 200 ms
  - Précalculer une liste normalisée des noms au chargement pour accélérer le matching
- **Performance de l'algorithme** : synchrone et rapide pour < 1000 personnes, pas besoin de Web Worker
- **Limite de profondeur** : protéger l'algorithme avec `max_depth = 20` dans le DFS (cycles éventuels par erreur de saisie)
- **SVG natif** ou bibliothèque légère (D3 si déjà utilisée) pour le sous-arbre, pas de lib lourde dédiée
- **Pas de stockage local** nécessaire : la fonctionnalité est sans état persistant entre sessions
- **i18n** : tous les libellés en français (l'app est francophone). Les termes songhay restent en songhay (ne pas traduire). Si Alykoira a un système d'i18n, créer une nouvelle clé `parente.*` pour les libellés UI

## Critères d'acceptation

L'implémentation est considérée terminée quand :

- ✅ La saisie autocomplétée fonctionne sur prénom + nom + surnom (insensible à la casse et aux accents)
- ✅ Le matching trouve les résultats par préfixe ET par sous-chaîne
- ✅ La sélection de deux personnes valides déclenche automatiquement le calcul et l'ouverture du popup
- ✅ Le popup s'ouvre avec les deux onglets, vue graphique active par défaut
- ✅ La vue graphique affiche correctement le sous-arbre avec annotations P/M sur les liens et termes songhay sous A et B
- ✅ Le zoom et le pan fonctionnent (boutons +/−/⟲ + drag souris/touch + molette Ctrl)
- ✅ Le sous-arbre s'auto-centre à l'ouverture sans bug d'invisibilité
- ✅ Les relations multiples sont gérées (sélecteur en haut + tri par proximité)
- ✅ La vue détaillée affiche les énoncés réciproques, les chemins nommés en français, les scores et l'explication pédagogique adaptée au type de relation
- ✅ Les cas « même personne », « aucun lien », « parents inconnus » sont gérés avec messages clairs
- ✅ L'interface respecte le design system d'Alykoira et est responsive (desktop + mobile)
- ✅ L'algorithme est conforme au document `algorithme-parente-songhay.md`

## Livrables attendus

- Le composant principal du calculateur (page ou modal selon l'architecture)
- L'implémentation TypeScript de l'algorithme conforme au document
- Les composants visuels (sous-arbre SVG, fiche détaillée, popup, autocomplétion)
- L'intégration dans la navigation existante (entrée de menu « Calculateur de parenté » à l'emplacement approprié)
- Documentation inline (JSDoc) du nouveau code
- Commit message clair et atomique (un commit par responsabilité : algo, autocomplétion, vue graphique, vue détaillée, intégration)

## Démarche attendue

1. Lire intégralement `algorithme-parente-songhay.md`
2. Explorer la base de code existante d'Alykoira pour repérer le design system, les composants réutilisables, le store/API des personnes
3. Implémenter l'algorithme TypeScript en isolation et le tester avec quelques cas (au minimum : frères vrais, oncle maternel, kaga éloigné, relations multiples)
4. Implémenter les composants UI (autocomplétion, popup, onglets) en réutilisant le design system
5. Implémenter le rendu SVG du sous-arbre avec zoom/pan
6. Implémenter la vue détaillée avec génération dynamique des explications
7. Intégrer dans la navigation
8. Tester end-to-end avec des paires variées de personnes réelles de la base

Si tu as des questions sur l'algorithme, sur l'intégration dans Alykoira, ou sur des choix d'implémentation, **pose-les avant de commencer à coder**.

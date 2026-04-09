# Redesign "Royal Gold" — Arbre Genealogique Aly Koira

## Objectif

Refonte visuelle complète de l'application genealogique vers un design moderne, epure et premium. Direction "Royal Gold" : fond gris charbon, or comme accent principal, typographie bold, coins arrondis genereux. Aucune regression fonctionnelle — toutes les features existantes sont preservees.

## Public cible

Famille proche uniquement — design intime, chaleureux et valorisant le patrimoine familial.

## Themes

- **Dark par defaut** (theme principal)
- **Light disponible** via bascule dans le menu profil
- Persistance du choix en localStorage (comportement existant conserve)

---

## 1. Tokens de design

### 1.1 Palette Dark (defaut)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--bg` | `#111827` | Fond principal |
| `--surface` | `#1f2937` | Cartes, modales, inputs |
| `--surface-hover` | `#283548` | Etats hover |
| `--surface-active` | `#334155` | Etats actifs/pressed |
| `--gold` | `#d4a853` | Accent principal |
| `--gold-light` | `#e8c77b` | Hover sur elements or |
| `--gold-subtle` | `rgba(212,168,83,0.12)` | Fond de badges, highlights |
| `--gold-border` | `rgba(212,168,83,0.2)` | Bordures accentuees |
| `--text` | `#f1f5f9` | Texte principal |
| `--text-secondary` | `#9ca3af` | Labels, descriptions |
| `--text-muted` | `#6b7280` | Placeholders, hints |
| `--border` | `rgba(255,255,255,0.07)` | Bordures et separateurs |
| `--male` | `#60a5fa` | Couleur genre masculin |
| `--female` | `#f9a8d4` | Couleur genre feminin |
| `--success` | `#34d399` | Confirmations, succes |
| `--error` | `#f87171` | Erreurs, alertes |
| `--shadow` | `0 8px 32px rgba(0,0,0,0.4)` | Ombre cartes |
| `--shadow-sm` | `0 2px 12px rgba(0,0,0,0.3)` | Ombre legere |

### 1.2 Palette Light

| Token | Valeur |
|-------|--------|
| `--bg` | `#f8f6f1` |
| `--surface` | `#ffffff` |
| `--surface-hover` | `#f3f0e8` |
| `--surface-active` | `#ebe7dc` |
| `--gold` | `#a8802a` |
| `--gold-light` | `#c49a3a` |
| `--gold-subtle` | `rgba(168,128,42,0.08)` |
| `--gold-border` | `rgba(168,128,42,0.2)` |
| `--text` | `#1f2937` |
| `--text-secondary` | `#6b7280` |
| `--text-muted` | `#9ca3af` |
| `--border` | `rgba(0,0,0,0.08)` |
| `--shadow` | `0 8px 32px rgba(0,0,0,0.08)` |
| `--shadow-sm` | `0 2px 12px rgba(0,0,0,0.05)` |

### 1.3 Couleurs de generation (inchangees)

| Gen | Couleur | Label |
|-----|---------|-------|
| G0 | `#9333ea` | Ancetre |
| G1 | `#f59e0b` | 1ere |
| G2 | `#10b981` | 2eme |
| G3 | `#6366f1` | 3eme |
| G4 | `#ec4899` | 4eme |
| G5 | `#8b5cf6` | 5eme |
| G6 | `#14b8a6` | 6eme |
| G7 | `#f97316` | 7eme |

### 1.4 Typographie

- **Police** : `Inter`, system-ui, sans-serif (pour tout, remplace Nunito Sans et Playfair Display)
- **Titres** : weight 700, letter-spacing: -0.3px
- **Corps** : weight 400-500, line-height: 1.5
- **Labels/badges** : weight 700, size 10-11px, uppercase, letter-spacing: 0.5px

### 1.5 Rayons et espacements

| Token | Valeur |
|-------|--------|
| `--radius` | `20px` |
| `--radius-lg` | `24px` |
| `--radius-sm` | `12px` |
| `--radius-full` | `9999px` |
| Padding carte | `22px` |
| Gap standard | `16px` |

---

## 2. Navigation

### 2.1 Structure : 2 onglets + menu profil

**Bottom Nav** (2 onglets uniquement) :
- **Famille** — icone maison/arbre, route `/`
- **Parente** — icone lien, route `/parente`

Design : fond `--bg` avec `backdrop-filter: blur(20px)`, bordure top `--border`, padding vertical 10px. Onglet actif : texte et icone en `--gold`, fond `--gold-subtle`, border-radius 12px. Onglet inactif : texte `--text-muted`.

**Ancien onglet Recherche** : integre dans le header comme barre de recherche.
**Anciens onglets Contribuer et Admin** : deplaces dans le menu profil.

### 2.2 Header

Layout horizontal :
- **Gauche** : logo (icone arbre 32x32 avec fond gradient or + texte "Aly Koira" bold)
- **Centre** : barre de recherche (icone loupe + placeholder "Rechercher un membre...") — fond `--surface`, bordure `--border`, rayon `--radius-sm`. Au tap, s'expand en plein ecran avec overlay et resultats en direct.
- **Droite** : avatar utilisateur (initiales dans cercle, bordure `--gold-border`) — au tap, ouvre le menu profil.

Fond du header : `--bg`, bordure bottom `--border`.

### 2.3 Menu profil (dropdown/sheet)

Ouvert au tap sur l'avatar. Sur mobile : bottom sheet. Sur desktop : dropdown aligne a droite.

Contenu :
1. Nom d'affichage + badge role (admin/membre)
2. Separateur
3. Stats rapides : X membres, Y generations (inline, texte `--text-secondary`)
4. Separateur
5. Liens : Contribuer, Mes suggestions, Admin (si admin)
6. Separateur
7. Toggle theme dark/light
8. Deconnexion

Design : fond `--surface`, bordure `--border`, rayon `--radius`, shadow `--shadow`.

---

## 3. Composants

### 3.1 PersonCard (carte principale du membre selectionne)

Structure :
```
[Avatar 52x52 rond-14px]  [Nom bold 16px]         [Badge Gen]
  gradient or              [Titre honorifique or]    pill --gold-subtle
                                                     texte --gold
─────────────────────────── separateur ──────────────
   12          45           8
 ENFANTS    DESCENDANTS   EPOUSES
 (labels uppercase 10px, --text-secondary)
```

- Fond : `--surface`
- Bordure : `--border`
- Rayon : `--radius`
- Padding : 22px
- Avatar : initiales blanches sur fond gradient or (`--gold` -> `--gold-light`), ou photo si disponible avec bordure or
- Ombre : `--shadow-sm`

### 3.2 ParentCard / SpouseCard / ChildCard (cartes secondaires)

Carte compacte :
```
[Avatar 36x36 rond]  [Nom 14px]  [Badge Gen mini]
                     [Relation en --text-secondary 12px]
```

- Fond : `--surface` ou transparent
- Bordure : `--border`
- Rayon : `--radius-sm`
- Padding : 12px 16px
- Hover : fond `--surface-hover`
- Tap/click : navigation vers le membre

### 3.3 Section headers (Parents, Epouses, Enfants)

```
── OR ── ENFANTS (3) ── OR ──
```

Label uppercase 11px, weight 700, couleur `--gold`, letter-spacing 0.5px. Lignes decoratives en `--border` de chaque cote. Count entre parentheses en `--text-secondary`.

### 3.4 Breadcrumb

Pills horizontales scrollables : `Nom1 > Nom2 > Nom3`
- Style pill : fond `--gold-subtle`, texte `--gold`, rayon `--radius-full`
- Membre actuel : fond `--gold`, texte `--bg`
- Separateur `>` en `--text-muted`

### 3.5 SearchBar (integree dans le header)

Etat replie : icone loupe + texte placeholder, dans le header.
Etat deploye (au tap) : overlay plein ecran, fond `--bg` avec opacite 0.95, champ input autofocus en haut, resultats en liste en dessous. Chaque resultat = PersonListItem compact. Bouton fermer (X) en haut a droite.

### 3.6 Toast

Position : top center, z-index eleve.
- Succes : fond `--success` avec opacite 0.15, bordure `--success`, texte `--success`
- Erreur : fond `--error` avec opacite 0.15, bordure `--error`, texte `--error`
- Rayon : `--radius-sm`
- Animation : slide-down + fade-in

---

## 4. Pages

### 4.1 Login (refonte complete)

**Layout** : plein ecran, fond `#111827`, centre vertical.

**Structure** :
1. Logo en haut : icone arbre grande (64x64) avec glow dore subtil (`box-shadow: 0 0 40px rgba(212,168,83,0.15)`), texte "Aly Koira" en 28px bold, sous-titre "Arbre Genealogique" en `--text-secondary` 14px.
2. Card formulaire : fond `--surface`, bordure `--gold-border`, rayon `--radius-lg`, padding 32px, largeur max 400px.
3. Tabs en haut de la card : "Connexion" / "Inscription" en style pill toggle, fond actif `--gold`, texte actif `--bg`.
4. Champs : fond `--bg`, bordure `--border`, rayon `--radius-sm`, padding 12px 16px, focus = bordure `--gold`.
5. Bouton principal : fond gradient `--gold` -> `--gold-light`, texte `#111827` bold, rayon `--radius-sm`, padding 14px, hover = luminosite +10%.
6. Liens secondaires (mot de passe oublie, etc.) : texte `--gold`, hover underline.

**Formulaire inscription** : memes champs qu'actuellement (email, mot de passe, nom, WhatsApp), validation identique. Force du mot de passe : barre avec gradient rouge -> or -> vert.

**Ecran activation en attente** : meme card, message centre avec icone horloge, texte expliquant l'attente d'activation admin, lien WhatsApp pour contacter l'admin.

### 4.2 Famille (page principale)

- Header avec recherche integree
- PersonCard du membre selectionne
- Sections : Parents, Epouses, Enfants par mere
- TreeView accessible via bouton dans PersonCard ("Voir l'arbre")
- Breadcrumb en haut sous le header

Comportement identique a l'actuel, seul le style change.

### 4.3 Parente

- Deux selecteurs de membres (MemberAutocomplete) dans des cards
- Bouton "Calculer" en or
- Resultat dans une RelationCard avec chemin visuel
- Tout le style suit les tokens Royal Gold

### 4.4 Contribuer (accessible via menu profil)

Meme formulaire qu'actuellement, style adapte aux tokens.

### 4.5 Admin (accessible via menu profil, si admin)

Meme fonctionnalites (merge, termes, suggestions), style adapte.

---

## 5. TreeView

- Fond : `--bg`
- Noeuds : cards compactes avec avatar mini, nom, badge generation
- Liens entre noeuds : trait fin en `--border` ou `--gold-subtle`
- Popup au tap : TreePopup avec style Royal Gold (fond `--surface`, bordure `--gold-border`)
- Controles zoom : boutons avec fond `--surface`, icones en `--gold`
- Le comportement de zoom, collapse, et navigation reste identique

---

## 6. Modales et formulaires

- Overlay : fond noir opacite 0.6, blur 4px
- Card modale : fond `--surface`, bordure `--border`, rayon `--radius`, shadow `--shadow`
- Header modale : titre bold 18px, bouton fermer (X) en `--text-muted`
- Inputs : fond `--bg`, bordure `--border`, rayon `--radius-sm`, focus `--gold`
- Bouton primaire : fond `--gold`, texte `--bg`, bold
- Bouton secondaire : fond transparent, bordure `--gold-border`, texte `--gold`
- Bouton danger : fond `--error` opacite 0.15, texte `--error`

---

## 7. Animations et transitions

- Transitions par defaut : `0.2s ease` (hover, focus)
- Modales : fade-in 0.25s + scale de 0.95 a 1
- Bottom sheet : slide-up 0.3s ease-out
- Recherche expand : 0.3s ease-out
- Pas de nouvelles animations ajoutees — on conserve la sobriete

---

## 8. Responsive

- **Mobile-first** (inchange)
- Container max-width : `500px` (inchange)
- Bottom nav visible uniquement sur mobile (< 768px)
- Sur desktop (>= 768px) : navigation dans le header, pas de bottom nav
- Breakpoints existants conserves

---

## 9. Contraintes et regles

### Zero regression fonctionnelle
- Toutes les routes, actions, formulaires, validations existantes sont preservees
- La logique metier dans les composants React ne change pas
- Les contexts (Auth, Members, Theme) restent identiques dans leur API
- Les appels Supabase ne sont pas modifies

### Zero regression design
- Toutes les informations affichees actuellement restent visibles
- Les interactions (tap, navigation, zoom arbre) restent identiques
- L'accessibilite est maintenue ou amelioree
- Le PWA continue de fonctionner

### Approche d'implementation
- Modifier uniquement `global.css` pour les tokens et styles globaux
- Modifier les composants React uniquement pour les changements de structure HTML necessaires (ex: reorganisation du header, menu profil, suppression d'onglets bottom nav)
- Ne pas changer les props, le state, ou la logique des composants existants
- Tester chaque page apres modification

---

## 10. Fichiers impactes

### CSS
- `src/styles/global.css` — refonte des variables CSS, styles des composants

### Composants a modifier (structure HTML)
- `src/components/layout/Header.tsx` — nouveau layout avec recherche integree + avatar menu
- `src/components/layout/BottomNav.tsx` — reduction a 2 onglets
- `src/components/layout/LoginScreen.tsx` — refonte complete du design
- `src/components/search/SearchBar.tsx` — mode overlay plein ecran

### Nouveau composant
- `src/components/layout/ProfileMenu.tsx` — menu profil (dropdown/bottom sheet)

### Composants a modifier (style uniquement, pas de changement HTML)
- `src/components/family/PersonCard.tsx` — ajustement classes CSS si necessaire
- `src/components/tree/TreePopup.tsx` — style adapte
- Tous les autres composants suivent les tokens CSS automatiquement

### Non modifies
- `src/context/*` — aucun changement
- `src/lib/*` — aucun changement
- `src/hooks/*` — aucun changement
- `src/pages/*` — changements minimaux (routage inchange)
- `supabase/*` — aucun changement

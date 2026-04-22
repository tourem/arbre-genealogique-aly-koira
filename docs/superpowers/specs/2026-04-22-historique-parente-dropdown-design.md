# Historique de recherches Parenté — menu déroulant en-tête

**Date** : 2026-04-22
**Feature** : Accès persistant à l'historique des recherches de lien de parenté depuis l'écran résultat.

## Contexte

La page Parenté conserve déjà un historique des 10 dernières paires A/B calculées via `useParenteHistory` (localStorage, dédoublonnage, sync cross-tab). Le composant `RelationHistoryChips` affiche cet historique, mais uniquement dans l'empty-state. Dès qu'un résultat est calculé, l'historique devient invisible et l'utilisateur n'a plus de moyen rapide de revenir à une recherche passée sans effacer ses sélections courantes.

## Objectif

Rendre l'historique accessible à tout moment via un menu déroulant discret en en-tête de page, préservant la vue résultat et offrant un accès d'un clic aux recherches précédentes.

## Non-objectifs

- Changer le modèle de stockage, le nombre max d'entrées, la clé de dédoublonnage, ou la sync localStorage.
- Ajouter une recherche/filtre dans l'historique (YAGNI avec 10 entrées max).
- Exposer l'historique ailleurs que sur la page Parenté.
- Tracker des métriques d'usage sur les entrées (consultations, favoris).

## Decisions de design

### D1 — Surface d'accès : menu déroulant en en-tête (vs. chips sticky, sidebar, bouton "Nouvelle recherche")

Rationale : le bouton dropdown a la meilleure balance découvrabilité/encombrement. Les chips sticky coûtent 40-60px de vertical permanent (lourd mobile). La sidebar est surdimensionnée. Un simple bouton "Nouvelle recherche" enterre l'historique derrière une interaction.

### D2 — Entrée = nom + terme + horodatage relatif (vs. minimal actuel, avatars)

Rationale : l'horodatage est l'info qui manque le plus pour naviguer un historique multi-jours. Les avatars alourdissent la liste compacte sans gain proportionnel (on peut ajouter plus tard si besoin).

### D3 — Bouton et sous-titre coexistent dans le header (vs. bouton remplace le sous-titre)

Rationale : le sous-titre dynamique (`Deux lignées distinctes…`) porte une info utile au scan de page ; le retirer au profit du bouton dégrade l'UX. Avec `flex: 1 1 auto` sur le sous-titre et `flex: 0 0 auto` sur le bouton, la coexistence tient en desktop et wrap sur mobile.

### D4 — "Nouvelle recherche" dans le footer du menu (vs. bouton header séparé)

Rationale : garde le header épuré, groupe les actions d'historique ensemble, et le cas d'usage "je veux repartir à zéro" est naturellement un voisin de "je veux reprendre une ancienne recherche".

## Spécification

### Trigger (bouton)

- **Placement** : dans `.parente-view-header`, côté droit, après le sous-titre en `display: flex`.
- **Visibilité** : masqué si `history.length === 0` (aucune entrée à montrer).
- **Apparence** : chip/ghost button. Icône horloge SVG 14×14 (cercle + aiguilles), texte `Historique`, pastille-compteur `· N` (N = `history.length`).
- **Interactions** : clic ouvre/ferme le panneau. `aria-expanded`, `aria-haspopup="menu"`, `aria-controls` pointant vers le panneau.
- **Clavier** : focus via Tab, Entrée/Espace ouvre le menu, Escape ferme.

### Panneau

- **Positionnement** : `position: absolute`, ancré sous le bouton, aligné à droite (right-anchored).
- **Dimensions** : `width: 360px` desktop ; `width: calc(100vw - 32px)` mobile. `max-height: 420px` avec scroll vertical.
- **Header interne** :
  - Titre `Recherches récentes` (font-serif, 13px).
  - Lien `Effacer tout` à droite (appel `clearHistory()`).
- **Liste** : jusqu'à 10 `<button role="menuitem">`, chacun composé de :
  - Ligne 1 — `{nameA} ↔ {nameB}` en Fraunces 14px, `color: var(--sh-txt)`.
  - Ligne 2 — `{topTerm} · {relativeTime}` en Inter 11px, muted. Si pas de `topTerm`, afficher juste `{relativeTime}`.
  - Bouton `×` (16×16, aria-label `Retirer {nameA} et {nameB}`) visible au hover/focus du parent, appelle `removeHistory(aId, bId)`.
- **Footer** : `+ Nouvelle recherche` (ghost button full-width), appelle le callback `onNewSearch` qui fait `setPersonAId(null); setPersonBId(null)` côté page.
- **Fermeture** : click extérieur (mousedown sur document), Escape, ou sélection d'une entrée (auto-ferme).
- **ARIA** : `role="menu"` sur le panneau, `role="menuitem"` sur chaque entrée et sur les boutons "Effacer tout" / "Nouvelle recherche" pour la navigation clavier.

### Navigation clavier

- Tab focus le bouton trigger.
- Entrée/Espace ouvre le panneau, focus passe sur la première entrée.
- ↑ / ↓ naviguent entre les entrées (roving tabindex).
- Entrée sur une entrée rouvre la paire (appel `onSelect(entry)`).
- Suppr / Backspace sur une entrée retire l'entrée (appel `onRemove`).
- Escape ferme le panneau, rend focus au bouton trigger.

### Horodatage relatif

Nouvelle fonction pure `formatRelativeTime(ts: number, now: number = Date.now()): string` dans `src/lib/formatRelativeTime.ts`.

| Delta | Rendu |
|---|---|
| `< 60s` | `à l'instant` |
| `< 60min` | `il y a X min` |
| `< 24h` | `il y a X h` |
| `< 48h` | `hier` |
| `< 7 jours` | `il y a X jours` |
| `≥ 7 jours` | `le 15 avr.` (format court FR, ex. `le 3 janv.`) |

Signature pure (passe `now` en param) pour être testable sans mock de `Date`.

### Architecture

| Fichier | Nature | Rôle |
|---|---|---|
| `components/relationship/RelationHistoryMenu.tsx` | NOUVEAU | Bouton trigger + panneau dropdown + logique open/close/ARIA |
| `lib/formatRelativeTime.ts` | NOUVEAU | Fonction pure de formatage relatif FR |
| `lib/formatRelativeTime.test.ts` | NOUVEAU | Unit tests (bornes : 0s, 30s, 59m, 1h, 23h, 24h, 47h, 6j, 7j, 30j) |
| `pages/ParentePage.tsx` | MODIFIÉ | Intègre `<RelationHistoryMenu>` dans le header, wire callbacks `onSelect` / `onNewSearch` |
| `styles/global.css` | MODIFIÉ | Styles trigger, panneau, light-theme override |
| `hooks/useParenteHistory.ts` | INCHANGÉ | API déjà complète (`history`, `add`, `remove`, `clear`) |
| `components/relationship/RelationHistoryChips.tsx` | INCHANGÉ | Reste utilisé en empty-state (chips inline) |

Le composant empty-state et le composant menu partagent le même hook — aucune logique dupliquée côté data.

### Flux d'intégration dans ParentePage

```
header = {
  title,
  subtitle,  // existant : "Lien de parenté songhay" / "N lignées distinctes…"
  <RelationHistoryMenu
    history={history}
    onSelect={(e) => { setPersonAId(e.aId); setPersonBId(e.bId); }}
    onRemove={removeHistory}
    onClear={clearHistory}
    onNewSearch={() => { setPersonAId(null); setPersonBId(null); }}
  />
}
```

Le menu n'est pas rendu (rend `null`) si `history.length === 0`.

### Styles

- Trigger : chip/ghost réutilisant la palette des `.parente-metric-chip` (bordure subtile, hover gold).
- Panneau : fond `--sh-elev`, bordure `--sh-bdr`, box-shadow prononcée (16px), border-radius 8px.
- Entries : padding 10px 12px, hover background `rgba(212,168,74,0.08)`.
- Light-theme overrides complets (fond `#FFFFFF`, texte `#1c1c28`, hover `rgba(146,112,12,0.08)`).
- Animation d'ouverture 140ms ease-out, translate-Y 4px → 0 + opacity.
- Responsive : sur mobile (< 640px), passer le panneau en full-width (right/left 16px) avec max-height `70vh`.

## Tests

### Unit — formatRelativeTime

- `0s` → `à l'instant`
- `45s` → `à l'instant`
- `90s` → `il y a 1 min`
- `59min` → `il y a 59 min`
- `2h` → `il y a 2 h`
- `25h` → `hier`
- `47h` → `hier`
- `3j` → `il y a 3 jours`
- `10j` → format date court (ex. `le 12 avr.`)
- Formatage FR vérifié (mois abrégés en français avec accents conservés : `janv.`, `févr.`, `avr.`, `juil.`, `août`, `sept.`, `oct.`, `nov.`, `déc.` ; pas de "." double)

### Component — RelationHistoryMenu

- Rend `null` quand `history=[]`.
- Rend le bouton + pastille avec `history.length` quand `history.length > 0`.
- Clic sur bouton ouvre le panneau, `aria-expanded` passe à `true`.
- Clic sur entrée appelle `onSelect(entry)` avec la bonne entrée et ferme le panneau.
- Clic sur `×` d'une entrée appelle `onRemove(aId, bId)` sans appeler `onSelect`.
- Clic sur "Effacer tout" appelle `onClear`.
- Clic sur "Nouvelle recherche" appelle `onNewSearch`.
- Escape ferme le panneau et refocus le trigger.
- Click extérieur ferme le panneau.

## Risques & mitigations

- **Risque** : conflit z-index avec d'autres dropdowns (PersonPicker search dropdown). **Mitigation** : z-index 100 pour le menu, tests manuels avec les deux pickers ouverts.
- **Risque** : sur mobile le panneau dépasse l'écran. **Mitigation** : responsive rules passant en full-width avec max-height `70vh`.
- **Risque** : clic sur une entrée ne rouvre pas la bonne paire si l'un des membres a été supprimé de la DB. **Mitigation** : l'effect existant dans ParentePage (lignes 44-47) nettoie déjà les IDs inconnus — comportement existant préservé.

## Critères de validation

- `history.length > 0` → bouton visible dans le header.
- Clic sur bouton → panneau ouvert avec les entrées ordonnées (plus récente en haut).
- Clic sur une entrée → la page recalcule le lien avec la paire choisie, le panneau se ferme.
- `×` retire une entrée instantanément (localStorage + UI).
- "Effacer tout" vide l'historique, le bouton disparaît.
- "Nouvelle recherche" vide A et B, ramène à l'empty-state (où les chips historiques sont réaffichées).
- Navigation clavier complète (Tab, ↑↓, Enter, Escape, Suppr).
- Mode clair + mode sombre sans problème de contraste.
- Build passe, 170+ tests verts (incluant les nouveaux).

# Aperçu rapide d'un membre via icône ℹ — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une icône ℹ sur les chips Descendance, cartes Parents et en-têtes conjoints pour ouvrir le `TreePopup` (aperçu nom/prénom/surnom/génération/parents) **sans naviguer**.

**Architecture:** On réutilise le modal `TreePopup` existant et la plomberie `onInfo` déjà câblée de `FamillePage` jusqu'aux composants (aujourd'hui ignorée sous `_onInfo`). On ajoute les déclencheurs ℹ, on enrichit `TreePopup` d'une ligne « Prénom », et on branche des classes CSS déjà présentes mais jamais utilisées (`.parent-card-info`, `.foyer-info-btn`) + une nouvelle (`.child-chip-info-btn`).

**Tech Stack:** React + TypeScript, Vitest + React Testing Library, CSS dans `src/styles/global.css`.

**Spec :** `docs/superpowers/specs/2026-06-07-apercu-rapide-membre-icone-info-design.md`

---

## Décisions verrouillées (rappel)

- Mécanisme : icône ℹ → `TreePopup` existant (pas de nouveau popover).
- Surfaces : chips Descendance **+** cartes Parents (Père/Mère) **+** en-tête conjoint des foyers.
- ID dans le popup : **admin-only** (inchangé).
- Champ « Prénom » ajouté au popup.

## File Structure

| Fichier | Rôle | Action |
|---|---|---|
| `src/components/ui/InfoIcon.tsx` | Petite icône SVG ℹ réutilisable (DRY) | **Créer** |
| `src/components/tree/TreePopup.tsx` | Ajouter la ligne « Prénom » | Modifier |
| `src/components/family/FoyerBlock.tsx` | Brancher `onInfo` + ℹ sur chips & conjoint | Modifier |
| `src/components/family/ParentsSection.tsx` | Brancher `onInfo` + ℹ sur `ParentCard` réel | Modifier |
| `src/styles/global.css` | `.child-chip-info-btn`, modifieurs `--has-info`, offsets admin, thème clair | Modifier |
| `src/components/tree/TreePopup.test.tsx` | Test ligne « Prénom » | **Créer** |
| `src/components/family/FoyerBlock.test.tsx` | Tests ℹ chips + conjoint | **Créer** |
| `src/components/family/ParentsSection.test.tsx` | Tests ℹ parent réel vs fallback | **Créer** |

**Note de layout (important) :** le projet utilise un pattern « conteneur positionné + bouton absolu » via la classe `--has-menu` (le `.child-chip-body` / `.parent-card-body` porte la grille, le bouton est absolu à droite). On ajoute un modifieur jumeau `--has-info` qui met le conteneur en `display:block; position:relative`, de sorte que **toutes** les cartes avec ℹ passent par la grille `*-body` déjà éprouvée par le mode admin. Les deux modifieurs coexistent (admin : ℹ + menu ⋯).

---

### Task 1 : Icône SVG réutilisable `InfoIcon`

**Files:**
- Create: `react-app/src/components/ui/InfoIcon.tsx`

- [ ] **Step 1 : Créer le composant**

Fichier `react-app/src/components/ui/InfoIcon.tsx` :

```tsx
/** Petite icône « i » dans un cercle, dimensionnée par le CSS du bouton parent. */
export default function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
```

- [ ] **Step 2 : Vérifier la compilation TS**

Run: `cd react-app && npx tsc -b --noEmit`
Expected: aucune erreur liée à `InfoIcon.tsx`.

- [ ] **Step 3 : Commit**

```bash
cd react-app && git add src/components/ui/InfoIcon.tsx
git commit -m "feat(ui): add reusable InfoIcon svg component"
```

---

### Task 2 : `TreePopup` — ligne « Prénom »

**Files:**
- Test: `react-app/src/components/tree/TreePopup.test.tsx` (create)
- Modify: `react-app/src/components/tree/TreePopup.tsx` (après la ligne « Genre », ~ligne 188)

- [ ] **Step 1 : Écrire le test qui échoue**

Fichier `react-app/src/components/tree/TreePopup.test.tsx` :

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Member } from '../../lib/types';

// TreePopup dépend de contextes + supabase + MemberFormModal : on les neutralise.
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ isAdmin: false }) }));
vi.mock('../../context/MembersContext', () => ({
  useMembersContext: () => ({ refetchMembers: vi.fn(), updateMember: vi.fn() }),
}));
vi.mock('../../lib/supabase', () => ({ supabase: {} }));
vi.mock('../admin/MemberFormModal', () => ({ default: () => null }));

import TreePopup from './TreePopup';

const makeMember = (over: Partial<Member> = {}): Member => ({
  id: 'm1', name: 'Aboubacar Diallo', first_name: 'Aboubacar', alias: 'Abou',
  gender: 'M', generation: 7, father_id: null, mother_ref: null,
  spouses: [], children: [], photo_url: null, note: null,
  birth_city: null, birth_country: null, village: null, ...over,
});

describe('TreePopup — ligne Prénom', () => {
  it('affiche le label « Prénom » et la valeur first_name', () => {
    render(<TreePopup member={makeMember({ first_name: 'Aboubacar' })} members={{}} onClose={vi.fn()} />);
    expect(screen.getByText('Prénom')).toBeInTheDocument();
    expect(screen.getByText('Aboubacar')).toBeInTheDocument();
  });

  it('n’affiche pas la ligne Prénom quand first_name est null', () => {
    render(<TreePopup member={makeMember({ first_name: null })} members={{}} onClose={vi.fn()} />);
    expect(screen.queryByText('Prénom')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `cd react-app && npx vitest run src/components/tree/TreePopup.test.tsx`
Expected: FAIL — « Prénom » introuvable.

- [ ] **Step 3 : Implémenter la ligne Prénom**

Dans `react-app/src/components/tree/TreePopup.tsx`, juste après le bloc « Genre » (la `div.tree-popup-row` contenant le label `Genre`, ~lignes 185-188), insérer :

```tsx
          {member.first_name && (
            <div className="tree-popup-row">
              <span className="tree-popup-label">Prénom</span>
              <span>{member.first_name}</span>
            </div>
          )}
```

- [ ] **Step 4 : Lancer le test, vérifier le succès**

Run: `cd react-app && npx vitest run src/components/tree/TreePopup.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5 : Commit**

```bash
cd react-app && git add src/components/tree/TreePopup.tsx src/components/tree/TreePopup.test.tsx
git commit -m "feat(tree-popup): add Prénom row to member info popup"
```

---

### Task 3 : `FoyerBlock` — ℹ sur chips Descendance + en-tête conjoint

**Files:**
- Test: `react-app/src/components/family/FoyerBlock.test.tsx` (create)
- Modify: `react-app/src/components/family/FoyerBlock.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

Fichier `react-app/src/components/family/FoyerBlock.test.tsx` :

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FoyerBlock from './FoyerBlock';
import type { Member } from '../../lib/types';
import type { Foyer } from '../../lib/foyers';

const makeMember = (over: Partial<Member> = {}): Member => ({
  id: 'm1', name: 'Aboubacar Diallo', first_name: 'Aboubacar', alias: null,
  gender: 'M', generation: 7, father_id: null, mother_ref: null,
  spouses: [], children: [], photo_url: null, note: null,
  birth_city: null, birth_country: null, village: null, ...over,
});

const child = makeMember({ id: 'c1', name: 'Aliou Diallo', first_name: 'Aliou', generation: 8 });
const spouse = makeMember({ id: 's1', name: 'Mariam Sow', first_name: 'Mariam', gender: 'F', generation: 7 });

const makeFoyer = (over: Partial<Foyer> = {}): Foyer => ({
  rank: 1, spouse, spouseName: null, children: [child], orphan: false, ...over,
});

describe('FoyerBlock — boutons aperçu ℹ', () => {
  it('rend un ℹ par enfant de la descendance', () => {
    render(<FoyerBlock foyer={makeFoyer()} personGender="M" members={{}} onNavigate={vi.fn()} onInfo={vi.fn()} showRank={false} />);
    expect(screen.getByRole('button', { name: /Aperçu de Aliou Diallo/i })).toBeInTheDocument();
  });

  it('clic ℹ enfant appelle onInfo avec le membre et PAS onNavigate', () => {
    const onInfo = vi.fn();
    const onNavigate = vi.fn();
    render(<FoyerBlock foyer={makeFoyer()} personGender="M" members={{}} onNavigate={onNavigate} onInfo={onInfo} showRank={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Aperçu de Aliou Diallo/i }));
    expect(onInfo).toHaveBeenCalledWith(child);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('rend un ℹ pour le conjoint quand il existe (enfant + conjoint = 2 ℹ)', () => {
    render(<FoyerBlock foyer={makeFoyer()} personGender="M" members={{}} onNavigate={vi.fn()} onInfo={vi.fn()} showRank={false} />);
    expect(screen.getByRole('button', { name: /Aperçu de Mariam Sow/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Aperçu de/i })).toHaveLength(2);
  });

  it('pas de ℹ conjoint pour un foyer orphelin (seulement le ℹ enfant)', () => {
    render(<FoyerBlock foyer={makeFoyer({ spouse: null, spouseName: null, orphan: true })} personGender="M" members={{}} onNavigate={vi.fn()} onInfo={vi.fn()} showRank={false} />);
    expect(screen.getAllByRole('button', { name: /Aperçu de/i })).toHaveLength(1);
  });
});
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `cd react-app && npx vitest run src/components/family/FoyerBlock.test.tsx`
Expected: FAIL — aucun bouton « Aperçu de … ».

- [ ] **Step 3 : Importer `InfoIcon` et brancher `onInfo`**

Dans `react-app/src/components/family/FoyerBlock.tsx` :

a) Ajouter l'import en haut (après l'import de `CardActionsMenu`) :

```tsx
import InfoIcon from '../ui/InfoIcon';
```

b) Dans la signature de `FoyerBlock`, remplacer `onInfo: _onInfo` par `onInfo` :

```tsx
export default function FoyerBlock({
  foyer, personGender, members: _members, onNavigate, onInfo, showRank,
  showActions, onDissolve, onDetachChild,
}: Props) {
```

- [ ] **Step 4 : Ajouter le ℹ sur le chip enfant**

Remplacer le wrapper du chip (actuellement lignes ~97-130) par cette version : la classe `child-chip--has-info` est ajoutée quand `onInfo` existe, et le bouton ℹ est rendu en frère du `.child-chip-body` :

```tsx
              <div
                key={c.id}
                className={`child-chip${onInfo ? ' child-chip--has-info' : ''}${showActions && onDetachChild ? ' child-chip--has-menu' : ''}`}
                role="listitem"
              >
                <button
                  type="button"
                  className="child-chip-body"
                  onClick={() => onNavigate(c.id)}
                  aria-label={`Voir la fiche de ${c.name}`}
                >
                  <Avatar name={c.name} gender={c.gender} size="sm" />
                  <span className="child-chip-main">
                    <span className="child-chip-name">{c.first_name ?? c.name.split(' ')[0] ?? c.name}</span>
                    {c.alias && <span className="child-chip-alias">« {c.alias} »</span>}
                  </span>
                  <span className="child-chip-meta">
                    <span className="child-chip-gen">G{c.generation}</span>
                    <span className="child-chip-sep" aria-hidden="true">·</span>
                    <span className={`child-chip-gender child-chip-gender--${c.gender === 'M' ? 'm' : 'f'}`} aria-hidden="true">
                      {c.gender === 'M' ? '♂' : '♀'}
                    </span>
                  </span>
                </button>
                {onInfo && (
                  <button
                    type="button"
                    className="child-chip-info-btn"
                    onClick={() => onInfo(c)}
                    aria-label={`Aperçu de ${c.name}`}
                  >
                    <InfoIcon />
                  </button>
                )}
                {showActions && onDetachChild && (
                  <CardActionsMenu
                    actions={[
                      { label: 'Voir sa fiche', onClick: () => onNavigate(c.id) },
                      { label: 'Retirer de ce foyer', onClick: () => onDetachChild(c.id), danger: true },
                    ]}
                    label={`Actions sur ${c.name}`}
                  />
                )}
              </div>
```

- [ ] **Step 5 : Ajouter le ℹ sur l'en-tête conjoint**

Dans le bloc `.foyer-spouse` (lignes ~50-79), juste APRÈS la fermeture de la `div.foyer-spouse-info` et AVANT la fermeture de `div.foyer-spouse`, insérer :

```tsx
          {onInfo && spouse && (
            <button
              type="button"
              className="foyer-info-btn"
              onClick={() => onInfo(spouse)}
              aria-label={`Aperçu de ${spouse.name}`}
            >
              <InfoIcon />
            </button>
          )}
```

- [ ] **Step 6 : Lancer le test, vérifier le succès**

Run: `cd react-app && npx vitest run src/components/family/FoyerBlock.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 7 : Commit**

```bash
cd react-app && git add src/components/family/FoyerBlock.tsx src/components/family/FoyerBlock.test.tsx
git commit -m "feat(foyer): add ℹ info button on child chips and spouse header"
```

---

### Task 4 : `ParentsSection` — ℹ sur cartes Parents réelles

**Files:**
- Test: `react-app/src/components/family/ParentsSection.test.tsx` (create)
- Modify: `react-app/src/components/family/ParentsSection.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

Fichier `react-app/src/components/family/ParentsSection.test.tsx` :

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ParentsSection from './ParentsSection';
import type { Member } from '../../lib/types';

const makeMember = (over: Partial<Member> = {}): Member => ({
  id: 'm1', name: 'X', first_name: null, alias: null,
  gender: 'M', generation: 7, father_id: null, mother_ref: null,
  spouses: [], children: [], photo_url: null, note: null,
  birth_city: null, birth_country: null, village: null, ...over,
});

const father = makeMember({ id: 'f1', name: 'Omar Diallo', first_name: 'Omar', generation: 6 });
// mother_ref pointe vers un nom libre (pas d'ID en base) -> carte fallback, sans ℹ
const person = makeMember({ id: 'p1', name: 'Aliou Diallo', first_name: 'Aliou', father_id: 'f1', mother_ref: 'Mariam (texte libre)', generation: 7 });
const members = { f1: father, p1: person };

describe('ParentsSection — boutons aperçu ℹ', () => {
  it('rend ℹ pour le parent réel et PAS pour le parent fallback (1 seul ℹ)', () => {
    render(<ParentsSection person={person} members={members} onNavigate={vi.fn()} onInfo={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Aperçu de Omar Diallo/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Aperçu de/i })).toHaveLength(1);
  });

  it('clic ℹ appelle onInfo avec le parent', () => {
    const onInfo = vi.fn();
    render(<ParentsSection person={person} members={members} onNavigate={vi.fn()} onInfo={onInfo} />);
    fireEvent.click(screen.getByRole('button', { name: /Aperçu de Omar Diallo/i }));
    expect(onInfo).toHaveBeenCalledWith(father);
  });
});
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `cd react-app && npx vitest run src/components/family/ParentsSection.test.tsx`
Expected: FAIL — aucun bouton « Aperçu de Omar Diallo ».

- [ ] **Step 3 : Importer `InfoIcon` et brancher `onInfo` dans `ParentCard`**

Dans `react-app/src/components/family/ParentsSection.tsx` :

a) Ajouter l'import (après l'import de `CardActionsMenu`) :

```tsx
import InfoIcon from '../ui/InfoIcon';
```

b) Dans la déstructuration de `ParentCard` (ligne ~32), remplacer `onInfo: _onInfo` par `onInfo` :

```tsx
function ParentCard({
  parent, fallbackName, role, members, onNavigate, onInfo,
  fallbackMotherRef: _fallbackMotherRef, personGeneration, otherParentId,
  showActions, onDetach,
}: ParentCardProps) {
```

- [ ] **Step 4 : Ajouter le ℹ dans la branche « parent réel »**

Dans la branche `if (parent) { ... }`, remplacer la `div` racine et y insérer le bouton ℹ entre `</button>` (fin de `.parent-card-body`) et `{renderMenu(parent.name)}` :

```tsx
      <div className={`parent-card parent-card--${role}${onInfo ? ' parent-card--has-info' : ''}${showActions ? ' parent-card--has-menu' : ''}`}>
        <button
          type="button"
          className="parent-card-body"
          onClick={() => onNavigate?.(parent.id)}
          aria-label={`Voir la fiche de ${parent.name}`}
        >
          <div className="parent-card-avatar">
            <Avatar name={parent.name} gender={parent.gender} generation={parent.generation} size="md" />
          </div>
          <div className="parent-card-main">
            <div className="parent-card-role">
              <span>{roleLabel}</span>
              <span className="parent-card-role-sep" aria-hidden="true">·</span>
              <SonghayTerm term={songhayTerm} variant="inline" />
            </div>
            <div className="parent-card-name">
              {parent.name}
              {parent.alias && <span className="parent-card-alias"> « {parent.alias} »</span>}
            </div>
            {lineage && <div className="parent-card-lineage">{lineage}</div>}
          </div>
          <svg className="parent-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        {onInfo && (
          <button
            type="button"
            className="parent-card-info"
            onClick={() => onInfo(parent)}
            aria-label={`Aperçu de ${parent.name}`}
          >
            <InfoIcon />
          </button>
        )}
        {renderMenu(parent.name)}
      </div>
```

> Ne PAS toucher aux branches `fallbackName` ni « parent inconnu » : pas de ℹ (pas d'objet `Member` à afficher).

- [ ] **Step 5 : Lancer le test, vérifier le succès**

Run: `cd react-app && npx vitest run src/components/family/ParentsSection.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6 : Commit**

```bash
cd react-app && git add src/components/family/ParentsSection.tsx src/components/family/ParentsSection.test.tsx
git commit -m "feat(parents): add ℹ info button on real parent cards"
```

---

### Task 5 : CSS — bouton ℹ chip, modifieurs `--has-info`, offsets admin, thème clair

**Files:**
- Modify: `react-app/src/styles/global.css`

> Les classes `.parent-card-info` (~ligne 7188) et `.foyer-info-btn` (~ligne 7319) existent **déjà** et sont stylées. Il manque : le style du chip, les modifieurs `--has-info` (conteneur positionné), les offsets quand ℹ + menu coexistent (admin), et les surcharges thème clair.

- [ ] **Step 1 : Ajouter le bloc CSS chip + modifieurs**

Ajouter, à la fin de la section child-chip (juste après la règle `.child-chip-gender--f` ~ligne 7444, avant le `@media` responsive) :

```css
/* ---- Aperçu rapide : bouton ℹ sur le chip enfant ---- */
.child-chip--has-info {
  display: block;
  padding: 0;
  position: relative;
}
.child-chip-info-btn {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  z-index: 2;
  width: 22px; height: 22px; min-width: 22px;
  border-radius: 50%;
  border: 1px solid var(--bdr-strong, rgba(244,236,216,0.18));
  background: transparent;
  color: var(--ink-mute, #8b8471);
  display: grid; place-items: center;
  cursor: pointer;
  opacity: 0.6;
  transition: background-color 140ms var(--ease-out, ease), color 140ms var(--ease-out, ease), opacity 140ms var(--ease-out, ease);
}
.child-chip-info-btn svg { width: 12px; height: 12px; }
.child-chip-info-btn:hover,
.child-chip-info-btn:focus-visible {
  opacity: 1;
  background: var(--ocre-soft, rgba(212,168,74,0.14));
  color: var(--ocre, #d4a84a);
  border-color: color-mix(in srgb, var(--ocre, #d4a84a) 30%, transparent);
  outline: none;
}
/* Coexistence ℹ + menu ⋯ (admin) : ℹ se décale à gauche du menu */
.child-chip--has-info.child-chip--has-menu .child-chip-info-btn { right: 28px; }
.child-chip--has-info.child-chip--has-menu .child-chip-body { padding-right: 52px; }
```

- [ ] **Step 2 : Ajouter les offsets parent-card (ℹ + menu admin)**

Ajouter juste après le bloc `.parent-card-info svg { ... }` (~ligne 7200) :

```css
/* Parent card : conteneur positionné quand ℹ présent + coexistence avec menu ⋯ */
.parent-card--has-info {
  display: block;
  padding: 0;
  position: relative;
}
.parent-card--has-info.parent-card--has-menu .parent-card-info { right: 42px; }
.parent-card--has-info.parent-card--has-menu .parent-card-body { padding-right: 76px; }
```

- [ ] **Step 3 : Rendre le ℹ conjoint discret (cohérence visuelle)**

Modifier la règle existante `.foyer-info-btn` (~ligne 7319) pour ajouter `opacity: 0.6;` à la base et `opacity: 1;` au hover. Remplacer le bloc existant par :

```css
.foyer-info-btn {
  width: 22px; height: 22px; border-radius: 50%;
  background: transparent;
  border: 1px solid var(--bdr-strong, rgba(244,236,216,0.18));
  color: var(--ink-mute, #8b8471);
  cursor: pointer;
  display: grid; place-items: center;
  margin-left: 8px;
  flex-shrink: 0;
  opacity: 0.6;
  transition: background-color 140ms var(--ease-out, ease), color 140ms var(--ease-out, ease), opacity 140ms var(--ease-out, ease);
}
.foyer-info-btn:hover,
.foyer-info-btn:focus-visible { opacity: 1; background: var(--ocre-soft); color: var(--ocre); outline: none; }
.foyer-info-btn svg { width: 12px; height: 12px; }
```

- [ ] **Step 4 : Surcharges thème clair**

Ajouter près des autres surcharges `[data-theme="light"]` des boutons de carte (après `[data-theme="light"] .card-menu-btn { ... }` ~ligne 9709) :

```css
[data-theme="light"] .child-chip-info-btn,
[data-theme="light"] .parent-card-info,
[data-theme="light"] .foyer-info-btn {
  color: rgba(30,26,18,0.55);
  border-color: rgba(0,0,0,0.16);
}
[data-theme="light"] .child-chip-info-btn:hover,
[data-theme="light"] .child-chip-info-btn:focus-visible,
[data-theme="light"] .parent-card-info:hover,
[data-theme="light"] .foyer-info-btn:hover,
[data-theme="light"] .foyer-info-btn:focus-visible {
  color: var(--ocre, #b5852f);
}
```

- [ ] **Step 5 : Vérification visuelle (dark + light)**

Lancer l'app et ouvrir une fiche dans la vue Parenté qui a des parents, un conjoint et des enfants.

Run: `cd react-app && npm run dev` (puis ouvrir l'URL locale)

Vérifier :
1. Une icône ℹ discrète apparaît sur chaque chip Descendance, sur les cartes Père/Mère réelles, et près du nom du conjoint.
2. Clic sur ℹ ouvre le `TreePopup` **sans naviguer** (la fiche courante reste affichée derrière l'overlay).
3. Clic sur le corps du chip/carte (hors ℹ) navigue comme avant.
4. La grille des chips n'est pas cassée (noms, badges G7, genre alignés ; pas de chevauchement ℹ/⋯ en mode admin).
5. Basculer en thème clair (toggle) : les ℹ restent visibles et contrastés.
6. Le popup affiche bien la ligne « Prénom ».

Si un chip paraît écrasé (largeur ~26px) : vérifier que `child-chip--has-info` est bien appliqué (donc `display:block`) — c'est ce modifieur qui route le chip sur la grille `.child-chip-body` éprouvée.

- [ ] **Step 6 : Commit**

```bash
cd react-app && git add src/styles/global.css
git commit -m "style(parente): wire ℹ info buttons (chips/parents/spouse) + light theme"
```

---

### Task 6 : Vérification finale (suite complète, lint, build)

**Files:** aucun (vérification)

- [ ] **Step 1 : Suite de tests complète**

Run: `cd react-app && npm run test:run`
Expected: tous les tests PASS, dont les 3 nouveaux fichiers (TreePopup, FoyerBlock, ParentsSection).

- [ ] **Step 2 : Lint**

Run: `cd react-app && npm run lint`
Expected: aucune nouvelle erreur (notamment pas de variable `_onInfo` inutilisée restante).

- [ ] **Step 3 : Build**

Run: `cd react-app && npm run build`
Expected: build OK (`tsc -b && vite build`).

- [ ] **Step 4 : Commit final (si des ajustements ont été nécessaires)**

```bash
cd react-app && git add -A
git commit -m "chore(parente): finalize aperçu rapide membre via icône info" || echo "rien à committer"
```

---

## Self-Review (effectuée)

- **Couverture spec :** mécanisme TreePopup (Tasks 3/4 déclenchent `onInfo` → popup existant) ✓ ; surfaces chips+parents+conjoint (Tasks 3/4) ✓ ; ID admin-only (inchangé, non touché) ✓ ; ligne Prénom (Task 2) ✓ ; visibilité discrète + thème clair/sombre (Task 5) ✓ ; tests Vitest (Tasks 2/3/4) ✓.
- **Placeholders :** aucun — chaque step contient le code/commande exacts.
- **Cohérence des types :** prop `onInfo?: (member: Member) => void` déjà déclarée dans `FoyerBlock`/`ParentsSection`/`FoyersSection` ; classes CSS `.parent-card-info` / `.foyer-info-btn` réutilisées telles quelles, `.child-chip-info-btn` / `.*--has-info` introduites de façon cohérente entre CSS (Task 5) et JSX (Tasks 3/4) ; `InfoIcon` créé en Task 1, importé en Tasks 3/4.
```

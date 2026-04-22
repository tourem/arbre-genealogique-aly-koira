# Historique Parenté — Menu Déroulant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un menu déroulant "Historique" en en-tête de page Parenté permettant de rouvrir une recherche passée sans effacer la sélection courante.

**Architecture:** Nouveau composant `RelationHistoryMenu` (trigger bouton + panneau dropdown avec positionnement ancré, ARIA, navigation clavier) + fonction pure `formatRelativeTime` pour l'horodatage relatif FR. Le hook existant `useParenteHistory` fournit déjà la data ; aucune modif data-layer. Intégration dans `ParentePage.tsx` header, styles dans `global.css`.

**Tech Stack:** React 19, TypeScript, Vitest + React Testing Library + jsdom, CSS modules via `global.css` (tokens-v2).

**Spec:** `docs/superpowers/specs/2026-04-22-historique-parente-dropdown-design.md`

---

## File Structure

**Files created :**
- `react-app/src/lib/formatRelativeTime.ts` — fonction pure de formatage relatif FR
- `react-app/src/lib/formatRelativeTime.test.ts` — tests unitaires (10+ bornes)
- `react-app/src/components/relationship/RelationHistoryMenu.tsx` — composant menu complet
- `react-app/src/components/relationship/RelationHistoryMenu.test.tsx` — tests component

**Files modified :**
- `react-app/src/pages/ParentePage.tsx` — intègre le menu dans le header, wire callbacks
- `react-app/src/styles/global.css` — styles trigger + panel + light-theme + responsive

**Files unchanged :**
- `react-app/src/hooks/useParenteHistory.ts` — API déjà complète
- `react-app/src/components/relationship/RelationHistoryChips.tsx` — conservé pour empty-state

---

### Task 1: Fonction pure formatRelativeTime (TDD)

**Files:**
- Create: `react-app/src/lib/formatRelativeTime.ts`
- Test: `react-app/src/lib/formatRelativeTime.test.ts`

- [ ] **Step 1.1: Écrire les tests unitaires**

Créer `react-app/src/lib/formatRelativeTime.test.ts` :

```typescript
import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from './formatRelativeTime';

// Ancre fixe pour tests deterministes : 15 mars 2026 a 14:00:00 UTC+0
const NOW = new Date('2026-03-15T14:00:00Z').getTime();

describe('formatRelativeTime', () => {
  it('renvoie "à l\'instant" pour 0 seconde', () => {
    expect(formatRelativeTime(NOW, NOW)).toBe("à l'instant");
  });

  it('renvoie "à l\'instant" pour 45 secondes', () => {
    expect(formatRelativeTime(NOW - 45 * 1000, NOW)).toBe("à l'instant");
  });

  it('renvoie "il y a 1 min" pour 90 secondes', () => {
    expect(formatRelativeTime(NOW - 90 * 1000, NOW)).toBe('il y a 1 min');
  });

  it('renvoie "il y a 5 min" pour 5 minutes', () => {
    expect(formatRelativeTime(NOW - 5 * 60 * 1000, NOW)).toBe('il y a 5 min');
  });

  it('renvoie "il y a 59 min" pour 59 minutes', () => {
    expect(formatRelativeTime(NOW - 59 * 60 * 1000, NOW)).toBe('il y a 59 min');
  });

  it('renvoie "il y a 1 h" pour 60 minutes', () => {
    expect(formatRelativeTime(NOW - 60 * 60 * 1000, NOW)).toBe('il y a 1 h');
  });

  it('renvoie "il y a 2 h" pour 2 heures', () => {
    expect(formatRelativeTime(NOW - 2 * 60 * 60 * 1000, NOW)).toBe('il y a 2 h');
  });

  it('renvoie "il y a 23 h" pour 23 heures', () => {
    expect(formatRelativeTime(NOW - 23 * 60 * 60 * 1000, NOW)).toBe('il y a 23 h');
  });

  it('renvoie "hier" pour 25 heures', () => {
    expect(formatRelativeTime(NOW - 25 * 60 * 60 * 1000, NOW)).toBe('hier');
  });

  it('renvoie "hier" pour 47 heures', () => {
    expect(formatRelativeTime(NOW - 47 * 60 * 60 * 1000, NOW)).toBe('hier');
  });

  it('renvoie "il y a 3 jours" pour 3 jours', () => {
    expect(formatRelativeTime(NOW - 3 * 24 * 60 * 60 * 1000, NOW)).toBe('il y a 3 jours');
  });

  it('renvoie "il y a 6 jours" pour 6 jours', () => {
    expect(formatRelativeTime(NOW - 6 * 24 * 60 * 60 * 1000, NOW)).toBe('il y a 6 jours');
  });

  it('renvoie une date courte FR pour 7+ jours (ex. "le 8 mars")', () => {
    expect(formatRelativeTime(NOW - 7 * 24 * 60 * 60 * 1000, NOW)).toBe('le 8 mars');
  });

  it('renvoie une date courte FR pour 30 jours', () => {
    // NOW = 15 mars 2026 ; -30j ≈ 13 fev 2026
    expect(formatRelativeTime(NOW - 30 * 24 * 60 * 60 * 1000, NOW)).toBe('le 13 févr.');
  });

  it('gere les mois avec accent (août, décembre)', () => {
    // 1er août 2025
    const aug1 = new Date('2025-08-01T12:00:00Z').getTime();
    expect(formatRelativeTime(aug1, NOW)).toBe('le 1 août');
    // 20 déc 2025
    const dec20 = new Date('2025-12-20T12:00:00Z').getTime();
    expect(formatRelativeTime(dec20, NOW)).toBe('le 20 déc.');
  });
});
```

- [ ] **Step 1.2: Lancer le test pour vérifier qu'il échoue**

Run: `cd react-app && npm test -- --run formatRelativeTime`

Expected: FAIL avec erreur "Cannot find module './formatRelativeTime'".

- [ ] **Step 1.3: Implémenter la fonction**

Créer `react-app/src/lib/formatRelativeTime.ts` :

```typescript
// Abreviations officielles FR. "août", "juin", "mai" n'ont pas d'abrev. traditionnelle
// et s'ecrivent en toutes lettres ; on conserve ce choix pour la lisibilite.
const MONTH_SHORT_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

/**
 * Formatage FR d'une difference de temps entre `ts` et `now`.
 *
 * Table :
 *   - < 60s       : "à l'instant"
 *   - < 60min     : "il y a N min"
 *   - < 24h       : "il y a N h"
 *   - < 48h       : "hier"
 *   - < 7 jours   : "il y a N jours"
 *   - >= 7 jours  : "le D mois" (ex. "le 15 avr.", "le 1 août")
 *
 * Passe `now` en parametre pour etre testable sans mock de Date.
 */
export function formatRelativeTime(ts: number, now: number = Date.now()): string {
  const deltaMs = now - ts;
  const deltaSec = Math.floor(deltaMs / 1000);
  const deltaMin = Math.floor(deltaSec / 60);
  const deltaH = Math.floor(deltaMin / 60);
  const deltaDays = Math.floor(deltaH / 24);

  if (deltaSec < 60) return "à l'instant";
  if (deltaMin < 60) return `il y a ${deltaMin} min`;
  if (deltaH < 24) return `il y a ${deltaH} h`;
  if (deltaH < 48) return 'hier';
  if (deltaDays < 7) return `il y a ${deltaDays} jours`;

  const d = new Date(ts);
  const day = d.getDate();
  const month = MONTH_SHORT_FR[d.getMonth()];
  return `le ${day} ${month}`;
}
```

- [ ] **Step 1.4: Lancer les tests pour vérifier qu'ils passent**

Run: `cd react-app && npm test -- --run formatRelativeTime`

Expected: 15 tests PASS.

- [ ] **Step 1.5: Commit**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add react-app/src/lib/formatRelativeTime.ts react-app/src/lib/formatRelativeTime.test.ts
git commit -m "$(cat <<'EOF'
feat(parente): ajouter formatRelativeTime pour l'horodatage FR de l'historique

Fonction pure prenant now en parametre pour testabilite. Gere les
bornes instant/min/h/hier/jours avant de basculer en date courte FR
(mois abreges avec accents conserves).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Composant RelationHistoryMenu — structure de base (TDD)

**Files:**
- Create: `react-app/src/components/relationship/RelationHistoryMenu.tsx`
- Test: `react-app/src/components/relationship/RelationHistoryMenu.test.tsx`

- [ ] **Step 2.1: Écrire les premiers tests (rendu et toggle)**

Créer `react-app/src/components/relationship/RelationHistoryMenu.test.tsx` :

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RelationHistoryMenu from './RelationHistoryMenu';
import type { HistoryEntry } from '../../hooks/useParenteHistory';

const makeEntry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
  aId: 'a1',
  aName: 'Mahamadou Alhabibou',
  bId: 'b1',
  bName: 'Ibrahim Alassane',
  topTerm: 'touba / hassa',
  timestamp: Date.now() - 60 * 60 * 1000, // il y a 1h
  ...overrides,
});

const noop = () => {};

describe('RelationHistoryMenu — rendu', () => {
  it('ne rend rien quand history est vide', () => {
    const { container } = render(
      <RelationHistoryMenu history={[]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('rend le bouton avec le compteur quand history a des entrees', () => {
    render(
      <RelationHistoryMenu history={[makeEntry()]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    const btn = screen.getByRole('button', { name: /historique/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('1');
  });

  it('a aria-expanded=false par defaut', () => {
    render(
      <RelationHistoryMenu history={[makeEntry()]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    expect(screen.getByRole('button', { name: /historique/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('ouvre le panneau au clic et passe aria-expanded a true', () => {
    render(
      <RelationHistoryMenu history={[makeEntry()]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    const btn = screen.getByRole('button', { name: /historique/i });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2.2: Lancer pour vérifier l'échec**

Run: `cd react-app && npm test -- --run RelationHistoryMenu`

Expected: FAIL avec "Cannot find module './RelationHistoryMenu'".

- [ ] **Step 2.3: Implémenter la structure minimale**

Créer `react-app/src/components/relationship/RelationHistoryMenu.tsx` :

```tsx
import { useState } from 'react';
import type { HistoryEntry } from '../../hooks/useParenteHistory';

interface Props {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (aId: string, bId: string) => void;
  onClear: () => void;
  onNewSearch: () => void;
}

/**
 * Menu deroulant "Historique" affiche dans l'en-tete de la page Parente.
 * Masque quand history est vide. Cliquer le bouton ouvre un panneau
 * flottant listant les paires passees (plus recente en haut), avec
 * horodatage relatif, bouton de retrait par entree, et footer "Nouvelle
 * recherche".
 */
export default function RelationHistoryMenu({ history, onSelect, onRemove, onClear, onNewSearch }: Props) {
  const [open, setOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="parente-history-menu">
      <button
        type="button"
        className="parente-history-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Historique des recherches (${history.length})`}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="parente-history-menu-trigger-label">Historique</span>
        <span className="parente-history-menu-trigger-count" aria-hidden="true">· {history.length}</span>
      </button>
      {open && (
        <div role="menu" className="parente-history-menu-panel">
          {/* populated in tasks 3+ */}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2.4: Lancer pour vérifier qu'ils passent**

Run: `cd react-app && npm test -- --run RelationHistoryMenu`

Expected: 4 tests PASS.

- [ ] **Step 2.5: Commit**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add react-app/src/components/relationship/RelationHistoryMenu.tsx react-app/src/components/relationship/RelationHistoryMenu.test.tsx
git commit -m "$(cat <<'EOF'
feat(parente): scaffold composant RelationHistoryMenu avec trigger

Bouton trigger avec icone horloge + compteur + ARIA expanded/haspopup.
Panneau vide s'ouvre/ferme au clic. Rend null si history vide.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Rendu des entrées dans le panneau (TDD)

**Files:**
- Modify: `react-app/src/components/relationship/RelationHistoryMenu.tsx`
- Modify: `react-app/src/components/relationship/RelationHistoryMenu.test.tsx`

- [ ] **Step 3.1: Ajouter les tests pour les entrées**

Ajouter à la fin de `RelationHistoryMenu.test.tsx`, avant le dernier `});` :

```tsx
describe('RelationHistoryMenu — entrees', () => {
  it('rend une entree pour chaque item de history avec noms + terme + horodatage', () => {
    const NOW = new Date('2026-03-15T14:00:00Z').getTime();
    const entries: HistoryEntry[] = [
      makeEntry({ aId: 'x', bId: 'y', aName: 'Alice', bName: 'Bob', topTerm: 'izee / baba', timestamp: NOW - 2 * 60 * 60 * 1000 }),
      makeEntry({ aId: 'c', bId: 'd', aName: 'Cora', bName: 'Dina', topTerm: 'touba / hassa', timestamp: NOW - 3 * 24 * 60 * 60 * 1000 }),
    ];
    render(
      <RelationHistoryMenu history={entries} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));

    // Les noms sont presents
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText(/Cora/)).toBeInTheDocument();
    expect(screen.getByText(/Dina/)).toBeInTheDocument();
    // Les termes songhay
    expect(screen.getByText(/izee \/ baba/)).toBeInTheDocument();
    expect(screen.getByText(/touba \/ hassa/)).toBeInTheDocument();
  });

  it('rend une entree sans terme quand topTerm est absent', () => {
    const entry = makeEntry({ topTerm: undefined, aName: 'Eve', bName: 'Frank' });
    render(
      <RelationHistoryMenu history={[entry]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));
    expect(screen.getByText(/Eve/)).toBeInTheDocument();
    expect(screen.getByText(/Frank/)).toBeInTheDocument();
  });

  it('rend le header "Recherches récentes" + bouton "Effacer tout"', () => {
    render(
      <RelationHistoryMenu history={[makeEntry()]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));
    expect(screen.getByText(/Recherches récentes/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /effacer tout/i })).toBeInTheDocument();
  });

  it('rend le footer "Nouvelle recherche"', () => {
    render(
      <RelationHistoryMenu history={[makeEntry()]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));
    expect(screen.getByRole('button', { name: /nouvelle recherche/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3.2: Lancer pour vérifier l'échec**

Run: `cd react-app && npm test -- --run RelationHistoryMenu`

Expected: les 4 nouveaux tests FAIL (le panneau est encore vide).

- [ ] **Step 3.3: Implémenter le rendu des entrées**

Remplacer le contenu de `RelationHistoryMenu.tsx` :

```tsx
import { useState } from 'react';
import type { HistoryEntry } from '../../hooks/useParenteHistory';
import { formatRelativeTime } from '../../lib/formatRelativeTime';

interface Props {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (aId: string, bId: string) => void;
  onClear: () => void;
  onNewSearch: () => void;
}

/**
 * Menu deroulant "Historique" affiche dans l'en-tete de la page Parente.
 * Masque quand history est vide. Cliquer le bouton ouvre un panneau
 * flottant listant les paires passees (plus recente en haut), avec
 * horodatage relatif, bouton de retrait par entree, et footer "Nouvelle
 * recherche".
 */
export default function RelationHistoryMenu({ history, onSelect, onRemove, onClear, onNewSearch }: Props) {
  const [open, setOpen] = useState(false);

  if (history.length === 0) return null;

  const close = () => setOpen(false);

  const handleSelect = (entry: HistoryEntry) => {
    onSelect(entry);
    close();
  };

  const handleClear = () => {
    onClear();
    close();
  };

  const handleNewSearch = () => {
    onNewSearch();
    close();
  };

  return (
    <div className="parente-history-menu">
      <button
        type="button"
        className="parente-history-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Historique des recherches (${history.length})`}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="parente-history-menu-trigger-label">Historique</span>
        <span className="parente-history-menu-trigger-count" aria-hidden="true">· {history.length}</span>
      </button>
      {open && (
        <div role="menu" className="parente-history-menu-panel">
          <div className="parente-history-menu-head">
            <span className="parente-history-menu-title">Recherches récentes</span>
            <button
              type="button"
              role="menuitem"
              className="parente-history-menu-clear"
              onClick={handleClear}
            >
              Effacer tout
            </button>
          </div>
          <ul className="parente-history-menu-list">
            {history.map((entry) => (
              <li key={entry.aId + '-' + entry.bId} className="parente-history-menu-item">
                <button
                  type="button"
                  role="menuitem"
                  className="parente-history-menu-item-main"
                  aria-label={`Rouvrir ${entry.aName} et ${entry.bName}`}
                  onClick={() => handleSelect(entry)}
                >
                  <span className="parente-history-menu-item-names">
                    <span>{entry.aName}</span>
                    <span className="parente-history-menu-item-sep" aria-hidden="true">↔</span>
                    <span>{entry.bName}</span>
                  </span>
                  <span className="parente-history-menu-item-meta">
                    {entry.topTerm && (
                      <>
                        <em lang="son" className="parente-history-menu-item-term">{entry.topTerm}</em>
                        <span className="parente-history-menu-item-dot" aria-hidden="true">·</span>
                      </>
                    )}
                    <span className="parente-history-menu-item-time">{formatRelativeTime(entry.timestamp)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="parente-history-menu-item-remove"
                  aria-label={`Retirer ${entry.aName} et ${entry.bName} de l'historique`}
                  onClick={(e) => { e.stopPropagation(); onRemove(entry.aId, entry.bId); }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            role="menuitem"
            className="parente-history-menu-new"
            onClick={handleNewSearch}
          >
            + Nouvelle recherche
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3.4: Lancer pour vérifier que tous les tests passent**

Run: `cd react-app && npm test -- --run RelationHistoryMenu`

Expected: 8 tests PASS.

- [ ] **Step 3.5: Commit**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add react-app/src/components/relationship/RelationHistoryMenu.tsx react-app/src/components/relationship/RelationHistoryMenu.test.tsx
git commit -m "$(cat <<'EOF'
feat(parente): rendre les entrees du menu historique

Chaque entree affiche noms A/B, terme songhay, horodatage relatif via
formatRelativeTime. Header avec titre + bouton "Effacer tout", footer
avec "Nouvelle recherche". Bouton x par entree pour retirer.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Callbacks (select, remove, clear, newSearch)

**Files:**
- Modify: `react-app/src/components/relationship/RelationHistoryMenu.test.tsx`

- [ ] **Step 4.1: Ajouter les tests de callbacks**

Ajouter à la fin de `RelationHistoryMenu.test.tsx`, avant le dernier `});` du fichier :

```tsx
describe('RelationHistoryMenu — callbacks', () => {
  it('appelle onSelect avec la bonne entree au clic et ferme le menu', () => {
    const onSelect = vi.fn();
    const entry = makeEntry({ aId: 'x', bId: 'y', aName: 'Alice', bName: 'Bob' });
    render(
      <RelationHistoryMenu history={[entry]} onSelect={onSelect} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /rouvrir Alice et Bob/i }));
    expect(onSelect).toHaveBeenCalledWith(entry);
    // Le menu s'est ferme
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('appelle onRemove avec aId, bId au clic sur x sans appeler onSelect', () => {
    const onSelect = vi.fn();
    const onRemove = vi.fn();
    render(
      <RelationHistoryMenu
        history={[makeEntry({ aId: 'x', bId: 'y', aName: 'Alice', bName: 'Bob' })]}
        onSelect={onSelect} onRemove={onRemove} onClear={noop} onNewSearch={noop}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));
    fireEvent.click(screen.getByRole('button', { name: /retirer Alice et Bob/i }));
    expect(onRemove).toHaveBeenCalledWith('x', 'y');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('appelle onClear au clic sur "Effacer tout" et ferme le menu', () => {
    const onClear = vi.fn();
    render(
      <RelationHistoryMenu history={[makeEntry()]} onSelect={noop} onRemove={noop} onClear={onClear} onNewSearch={noop} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /effacer tout/i }));
    expect(onClear).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('appelle onNewSearch au clic sur "Nouvelle recherche" et ferme le menu', () => {
    const onNewSearch = vi.fn();
    render(
      <RelationHistoryMenu history={[makeEntry()]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={onNewSearch} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /nouvelle recherche/i }));
    expect(onNewSearch).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 4.2: Lancer pour vérifier que les 4 tests passent**

Run: `cd react-app && npm test -- --run RelationHistoryMenu`

Expected: 12 tests PASS (les callbacks sont déjà branchés en Task 3).

- [ ] **Step 4.3: Commit**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add react-app/src/components/relationship/RelationHistoryMenu.test.tsx
git commit -m "$(cat <<'EOF'
test(parente): couvrir les callbacks du menu historique

Valide onSelect, onRemove, onClear, onNewSearch et la fermeture
automatique du menu apres chaque action.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Fermeture sur Escape et clic extérieur (TDD)

**Files:**
- Modify: `react-app/src/components/relationship/RelationHistoryMenu.tsx`
- Modify: `react-app/src/components/relationship/RelationHistoryMenu.test.tsx`

- [ ] **Step 5.1: Ajouter les tests**

Ajouter à la fin du fichier de test, avant le dernier `});` :

```tsx
describe('RelationHistoryMenu — fermeture', () => {
  it('ferme le panneau sur Escape', () => {
    render(
      <RelationHistoryMenu history={[makeEntry()]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('ferme le panneau au clic en dehors', () => {
    render(
      <div>
        <RelationHistoryMenu history={[makeEntry()]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />
        <div data-testid="outside">outside</div>
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('ne ferme pas le panneau au clic a l\'interieur', () => {
    render(
      <RelationHistoryMenu history={[makeEntry()]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));
    const menu = screen.getByRole('menu');
    fireEvent.mouseDown(menu);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5.2: Lancer pour vérifier l'échec**

Run: `cd react-app && npm test -- --run RelationHistoryMenu`

Expected: 3 nouveaux tests FAIL (Escape + click-outside pas encore branchés).

- [ ] **Step 5.3: Implémenter Escape + click outside**

Dans `RelationHistoryMenu.tsx`, ajouter `useEffect` et `useRef` aux imports et remplacer la fonction :

```tsx
import { useEffect, useRef, useState } from 'react';
import type { HistoryEntry } from '../../hooks/useParenteHistory';
import { formatRelativeTime } from '../../lib/formatRelativeTime';

interface Props {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (aId: string, bId: string) => void;
  onClear: () => void;
  onNewSearch: () => void;
}

/**
 * Menu deroulant "Historique" affiche dans l'en-tete de la page Parente.
 * Masque quand history est vide. Cliquer le bouton ouvre un panneau
 * flottant listant les paires passees (plus recente en haut), avec
 * horodatage relatif, bouton de retrait par entree, et footer "Nouvelle
 * recherche".
 *
 * Ferme sur Escape, clic exterieur, ou apres toute action (select,
 * clear, new search).
 */
export default function RelationHistoryMenu({ history, onSelect, onRemove, onClear, onNewSearch }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  if (history.length === 0) return null;

  const close = () => setOpen(false);

  const handleSelect = (entry: HistoryEntry) => {
    onSelect(entry);
    close();
  };

  const handleClear = () => {
    onClear();
    close();
  };

  const handleNewSearch = () => {
    onNewSearch();
    close();
  };

  return (
    <div className="parente-history-menu" ref={wrapperRef}>
      <button
        type="button"
        className="parente-history-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Historique des recherches (${history.length})`}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="parente-history-menu-trigger-label">Historique</span>
        <span className="parente-history-menu-trigger-count" aria-hidden="true">· {history.length}</span>
      </button>
      {open && (
        <div role="menu" className="parente-history-menu-panel">
          <div className="parente-history-menu-head">
            <span className="parente-history-menu-title">Recherches récentes</span>
            <button
              type="button"
              role="menuitem"
              className="parente-history-menu-clear"
              onClick={handleClear}
            >
              Effacer tout
            </button>
          </div>
          <ul className="parente-history-menu-list">
            {history.map((entry) => (
              <li key={entry.aId + '-' + entry.bId} className="parente-history-menu-item">
                <button
                  type="button"
                  role="menuitem"
                  className="parente-history-menu-item-main"
                  aria-label={`Rouvrir ${entry.aName} et ${entry.bName}`}
                  onClick={() => handleSelect(entry)}
                >
                  <span className="parente-history-menu-item-names">
                    <span>{entry.aName}</span>
                    <span className="parente-history-menu-item-sep" aria-hidden="true">↔</span>
                    <span>{entry.bName}</span>
                  </span>
                  <span className="parente-history-menu-item-meta">
                    {entry.topTerm && (
                      <>
                        <em lang="son" className="parente-history-menu-item-term">{entry.topTerm}</em>
                        <span className="parente-history-menu-item-dot" aria-hidden="true">·</span>
                      </>
                    )}
                    <span className="parente-history-menu-item-time">{formatRelativeTime(entry.timestamp)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="parente-history-menu-item-remove"
                  aria-label={`Retirer ${entry.aName} et ${entry.bName} de l'historique`}
                  onClick={(e) => { e.stopPropagation(); onRemove(entry.aId, entry.bId); }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            role="menuitem"
            className="parente-history-menu-new"
            onClick={handleNewSearch}
          >
            + Nouvelle recherche
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5.4: Lancer pour vérifier que tous les tests passent**

Run: `cd react-app && npm test -- --run RelationHistoryMenu`

Expected: 15 tests PASS.

- [ ] **Step 5.5: Commit**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add react-app/src/components/relationship/RelationHistoryMenu.tsx react-app/src/components/relationship/RelationHistoryMenu.test.tsx
git commit -m "$(cat <<'EOF'
feat(parente): fermer le menu historique sur Escape et clic exterieur

useEffect avec listeners document keydown/mousedown, attaches uniquement
quand le panneau est ouvert, cleanup au demount.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Intégration dans ParentePage

**Files:**
- Modify: `react-app/src/pages/ParentePage.tsx`

- [ ] **Step 6.1: Importer le composant et injecter dans le header**

Dans `react-app/src/pages/ParentePage.tsx`, ajouter l'import (après les autres imports relationship) :

```tsx
import RelationHistoryMenu from '../components/relationship/RelationHistoryMenu';
```

Puis remplacer le bloc `<header>` existant (autour de la ligne 116-119) :

```tsx
        <header className="parente-view-header">
          <h1 className="parente-view-title">{viewTitle}</h1>
          <div className="parente-view-sub">{viewSub}</div>
        </header>
```

par la version enrichie :

```tsx
        <header className="parente-view-header">
          <div className="parente-view-header-main">
            <h1 className="parente-view-title">{viewTitle}</h1>
            <div className="parente-view-sub">{viewSub}</div>
          </div>
          <RelationHistoryMenu
            history={history}
            onSelect={(entry) => {
              setPersonAId(entry.aId);
              setPersonBId(entry.bId);
            }}
            onRemove={removeHistory}
            onClear={clearHistory}
            onNewSearch={() => {
              setPersonAId(null);
              setPersonBId(null);
            }}
          />
        </header>
```

- [ ] **Step 6.2: Vérifier que la page compile et que les tests existants passent**

Run: `cd react-app && npm run build && npm test -- --run`

Expected: build réussit (0 erreur TS), 170+ tests PASS (incluant les 15 nouveaux du menu et 15 de formatRelativeTime → ~200).

- [ ] **Step 6.3: Commit**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add react-app/src/pages/ParentePage.tsx
git commit -m "$(cat <<'EOF'
feat(parente): integrer le menu historique dans l'en-tete de page

Le menu apparait a cote du titre/sous-titre. Cliquer une entree recharge
la paire A/B. "Nouvelle recherche" vide les selections pour revenir a
l'empty-state. Cohabitation avec le sous-titre dynamique via un sub-
container .parente-view-header-main.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Styles CSS

**Files:**
- Modify: `react-app/src/styles/global.css`

- [ ] **Step 7.1: Localiser le bloc Parenté v2 Phase B et ajouter les styles du menu**

Repérer la ligne `.parente-view-header` dans `global.css` (probablement dans la zone des styles v2 autour des lignes 9000-10000). Si elle existe déjà, ajouter juste après son bloc le flex ajouté pour le header-main.

Ajouter à la fin de `global.css` (ou à la fin de la section Phase B après les styles du menu déroulant existant) :

```css
/* =============================================================
 * Parenté v2 — Menu Historique (dropdown en-tete)
 * ============================================================= */

/* Header de la page : permettre la cohabitation titre/sous-titre + menu */
.parente-view-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.parente-view-header-main {
  flex: 1 1 auto;
  min-width: 0;
}
.parente-history-menu {
  position: relative;
  flex: 0 0 auto;
}

/* Trigger : chip/ghost assorti aux .parente-metric-chip */
.parente-history-menu-trigger {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--sh-bdr, rgba(244,236,216,0.12));
  border-radius: 999px;
  color: var(--sh-t2, #b5a891);
  font-family: var(--sh-sans, 'Inter', sans-serif);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.parente-history-menu-trigger:hover,
.parente-history-menu-trigger:focus-visible,
.parente-history-menu-trigger[aria-expanded="true"] {
  border-color: var(--sh-gold, #d4a84a);
  color: var(--sh-gold, #d4a84a);
  outline: none;
}
.parente-history-menu-trigger-label {
  font-weight: 500;
}
.parente-history-menu-trigger-count {
  font-family: var(--sh-mono, 'JetBrains Mono', monospace);
  font-feature-settings: "tnum";
  color: var(--sh-t3, #746a5a);
}

/* Panneau ancre a droite sous le trigger */
.parente-history-menu-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 100;
  width: 360px;
  max-height: 420px;
  overflow-y: auto;
  background: var(--sh-elev, #252018);
  border: 1px solid var(--sh-bdr, rgba(244,236,216,0.14));
  border-radius: 10px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.40);
  padding: 8px 0;
  animation: parente-history-menu-in 0.14s ease-out;
}
@keyframes parente-history-menu-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.parente-history-menu-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px 10px;
  border-bottom: 1px solid var(--sh-bdr, rgba(244,236,216,0.08));
}
.parente-history-menu-title {
  font-family: var(--sh-serif, 'Fraunces', serif);
  font-size: 13px;
  color: var(--sh-txt, #f4ecd8);
  font-weight: 500;
}
.parente-history-menu-clear {
  appearance: none;
  background: transparent;
  border: 0;
  padding: 2px 4px;
  font-family: var(--sh-sans, 'Inter', sans-serif);
  font-size: 11px;
  color: var(--sh-t3, #746a5a);
  cursor: pointer;
  transition: color 0.15s;
}
.parente-history-menu-clear:hover,
.parente-history-menu-clear:focus-visible {
  color: var(--sh-gold, #d4a84a);
  outline: none;
}

/* Liste des entrees */
.parente-history-menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.parente-history-menu-item {
  display: flex;
  align-items: stretch;
  position: relative;
}
.parente-history-menu-item:hover,
.parente-history-menu-item:focus-within {
  background: color-mix(in srgb, var(--sh-gold, #d4a84a) 6%, transparent);
}
.parente-history-menu-item-main {
  appearance: none;
  flex: 1 1 auto;
  background: transparent;
  border: 0;
  padding: 10px 14px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  color: inherit;
  font: inherit;
}
.parente-history-menu-item-main:focus-visible {
  outline: 2px solid var(--sh-gold, #d4a84a);
  outline-offset: -2px;
}
.parente-history-menu-item-names {
  font-family: var(--sh-serif, 'Fraunces', serif);
  font-size: 14px;
  color: var(--sh-txt, #f4ecd8);
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}
.parente-history-menu-item-sep {
  color: var(--sh-t3, #746a5a);
  font-weight: 400;
}
.parente-history-menu-item-meta {
  font-family: var(--sh-sans, 'Inter', sans-serif);
  font-size: 11px;
  color: var(--sh-t2, #b5a891);
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
}
.parente-history-menu-item-term {
  font-family: var(--sh-serif, 'Fraunces', serif);
  font-style: italic;
  color: var(--terracotta, #c25c3a);
}
.parente-history-menu-item-dot {
  color: var(--sh-t3, #746a5a);
}
.parente-history-menu-item-time {
  color: var(--sh-t3, #746a5a);
}

/* Bouton x de retrait, visible en permanence mais plus saillant au hover */
.parente-history-menu-item-remove {
  appearance: none;
  background: transparent;
  border: 0;
  width: 28px;
  padding: 0;
  margin-right: 6px;
  color: var(--sh-t3, #746a5a);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  opacity: 0.5;
  transition: opacity 0.15s, color 0.15s;
}
.parente-history-menu-item:hover .parente-history-menu-item-remove,
.parente-history-menu-item-remove:focus-visible {
  opacity: 1;
  color: var(--sh-terra, #c25c3a);
  outline: none;
}

/* Footer "Nouvelle recherche" */
.parente-history-menu-new {
  appearance: none;
  width: calc(100% - 12px);
  margin: 6px;
  padding: 8px 12px;
  background: transparent;
  border: 1px dashed var(--sh-bdr, rgba(244,236,216,0.18));
  border-radius: 8px;
  font-family: var(--sh-sans, 'Inter', sans-serif);
  font-size: 12px;
  color: var(--sh-t2, #b5a891);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.parente-history-menu-new:hover,
.parente-history-menu-new:focus-visible {
  border-color: var(--sh-gold, #d4a84a);
  color: var(--sh-gold, #d4a84a);
  background: color-mix(in srgb, var(--sh-gold, #d4a84a) 6%, transparent);
  outline: none;
}

/* Light theme */
html[data-theme="light"] .parente-history-menu-trigger {
  border-color: rgba(0,0,0,0.14);
  color: #5a5f7a;
}
html[data-theme="light"] .parente-history-menu-trigger:hover,
html[data-theme="light"] .parente-history-menu-trigger:focus-visible,
html[data-theme="light"] .parente-history-menu-trigger[aria-expanded="true"] {
  border-color: #92700C;
  color: #92700C;
}
html[data-theme="light"] .parente-history-menu-trigger-count {
  color: #8a8fa5;
}
html[data-theme="light"] .parente-history-menu-panel {
  background: #FFFFFF;
  border-color: rgba(0,0,0,0.10);
  box-shadow: 0 16px 40px rgba(42,31,18,0.16);
}
html[data-theme="light"] .parente-history-menu-head {
  border-bottom-color: rgba(0,0,0,0.08);
}
html[data-theme="light"] .parente-history-menu-title {
  color: #1c1c28;
}
html[data-theme="light"] .parente-history-menu-clear {
  color: #8a8fa5;
}
html[data-theme="light"] .parente-history-menu-clear:hover,
html[data-theme="light"] .parente-history-menu-clear:focus-visible {
  color: #92700C;
}
html[data-theme="light"] .parente-history-menu-item:hover,
html[data-theme="light"] .parente-history-menu-item:focus-within {
  background: rgba(146,112,12,0.08);
}
html[data-theme="light"] .parente-history-menu-item-names {
  color: #1c1c28;
}
html[data-theme="light"] .parente-history-menu-item-sep,
html[data-theme="light"] .parente-history-menu-item-dot,
html[data-theme="light"] .parente-history-menu-item-time {
  color: #8a8fa5;
}
html[data-theme="light"] .parente-history-menu-item-meta {
  color: #5a5f7a;
}
html[data-theme="light"] .parente-history-menu-item-term {
  color: var(--terracotta, #a94726);
}
html[data-theme="light"] .parente-history-menu-item-remove {
  color: #8a8fa5;
}
html[data-theme="light"] .parente-history-menu-item:hover .parente-history-menu-item-remove,
html[data-theme="light"] .parente-history-menu-item-remove:focus-visible {
  color: #a94726;
}
html[data-theme="light"] .parente-history-menu-new {
  border-color: rgba(0,0,0,0.18);
  color: #5a5f7a;
}
html[data-theme="light"] .parente-history-menu-new:hover,
html[data-theme="light"] .parente-history-menu-new:focus-visible {
  border-color: #92700C;
  color: #92700C;
  background: rgba(146,112,12,0.08);
}

/* Responsive : sur mobile, panneau full-width avec marges laterales */
@media (max-width: 640px) {
  .parente-history-menu-panel {
    width: calc(100vw - 32px);
    max-width: 420px;
    max-height: 70vh;
    right: -8px;
  }
}
```

- [ ] **Step 7.2: Vérifier que le build passe (ne casse rien d'autre visuellement)**

Run: `cd react-app && npm run build`

Expected: build réussit, pas de warning CSS nouveau.

- [ ] **Step 7.3: Lancer tous les tests**

Run: `cd react-app && npm test -- --run`

Expected: 200+ tests PASS.

- [ ] **Step 7.4: Vérification visuelle manuelle**

Lancer le dev server et vérifier à l'œil :

```bash
cd react-app && npm run dev
```

Checklist :
- [ ] Trigger visible dans le header quand il y a ≥ 1 recherche passée.
- [ ] Clic ouvre le panneau ancré en haut-droite.
- [ ] Entrées affichent nom + terme en terracotta + horodatage relatif.
- [ ] Hover sur une entrée la met en surbrillance.
- [ ] Clic entrée → la page recharge la paire, panneau se ferme.
- [ ] × retire l'entrée sans fermer le panneau.
- [ ] Effacer tout vide et fait disparaître le bouton trigger.
- [ ] Nouvelle recherche vide A/B, retour empty-state.
- [ ] Escape ferme.
- [ ] Mode clair + sombre : pas de problème de contraste.
- [ ] Mobile (< 640px) : panneau prend la largeur disponible.

- [ ] **Step 7.5: Commit**

```bash
cd /Users/mtoure/arbre-genealogique-aly-koira
git add react-app/src/styles/global.css
git commit -m "$(cat <<'EOF'
style(parente): styles du menu deroulant historique

Trigger chip/ghost cohérent avec les metric-chips, panneau flottant
ancre a droite, entrees avec nom + terme en terracotta + horodatage
muted. Footer "Nouvelle recherche" en dashed-outline. Light theme et
responsive mobile (< 640px) complets.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Vérification finale

- [ ] **Step 8.1: Lancer la suite de tests complète**

Run: `cd react-app && npm test -- --run`

Expected: 200+ tests PASS (170 existants + 15 formatRelativeTime + 15 RelationHistoryMenu).

- [ ] **Step 8.2: Build production**

Run: `cd react-app && npm run build`

Expected: build OK, taille CSS bundle augmentée d'environ 2-3 KB (styles du menu).

- [ ] **Step 8.3: Vérifier l'absence de régression sur les autres features**

Lancer le dev server et vérifier rapidement :
- Arbre généalogique principal s'affiche correctement
- Recherche Parenté sans historique (empty-state) affiche toujours les chips historiques et suggestions
- Sélection d'une paire déclenche le calcul normalement
- Les 8 corrections de l'itération 4 + 3 de l'itération 5 sont toujours présentes (terracotta header, tooltip adaptatif, chevron tooltip, etc.)

- [ ] **Step 8.4: Commit final (si aucun autre changement)**

Si des ajustements mineurs ont été nécessaires en Step 7.4, les committer. Sinon, passer.

---

## Notes d'implémentation

- **Focus visible sur trigger via `[aria-expanded="true"]`** : garde le bouton coloré tant que le panneau est ouvert, signal visuel fort.
- **`role="menu"` + `role="menuitem"`** : pattern ARIA menu standard ; la navigation clavier ↑↓ native par le navigateur ne s'active pas automatiquement pour `role="menu"` mais le focus Tab fonctionne naturellement via l'ordre DOM — suffisant pour ce cas d'usage (menu court, 10 entrées max + 2 actions globales).
- **`mousedown` et non `click` pour click-outside** : important pour fermer AVANT qu'un éventuel `onClick` sur élément extérieur se déclenche (évite double-trigger).
- **`z-index: 100`** : au-dessus des `.parente-metric-chip-tooltip` (50) et des dropdowns PersonPicker internes.
- **Responsive** : le panneau bascule en calc(100vw - 32px) à < 640px pour tenir sur mobile sans overflow horizontal.

## Auto-revue du plan

**Spec coverage :** ✓ Trigger+panneau+entrees+footer (Tasks 2, 3, 7), callbacks select/remove/clear/newSearch (Tasks 3, 4, 6), Escape+click-outside (Task 5), horodatage (Task 1), intégration ParentePage (Task 6), styles light-theme+responsive (Task 7), tests formatRelativeTime + tests component (Tasks 1, 2, 3, 4, 5).

**Placeholder scan :** ✓ aucun TBD. Chaque step contient le code exact ou la commande exacte.

**Type consistency :** ✓ `HistoryEntry` importé de `useParenteHistory` dans les tests et dans le composant, signatures de props identiques partout. `formatRelativeTime(ts, now?)` signature consistante.

**Scope check :** ✓ feature unique, focused, une plan = un merge cohérent.

**Ambiguity :** ✓ chaque comportement a son test. Les dimensions/couleurs/animations sont précises dans le CSS.

Plan prêt à exécuter.

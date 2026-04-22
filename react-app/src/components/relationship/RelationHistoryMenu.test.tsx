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
    expect(screen.getByRole('menuitem', { name: /effacer tout/i })).toBeInTheDocument();
  });

  it('rend le footer "Nouvelle recherche"', () => {
    render(
      <RelationHistoryMenu history={[makeEntry()]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));
    expect(screen.getByRole('menuitem', { name: /nouvelle recherche/i })).toBeInTheDocument();
  });
});

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

describe('RelationHistoryMenu — clavier', () => {
  it('ArrowDown/ArrowUp naviguent entre les entrees', () => {
    const e1 = makeEntry({ aId: 'a', bId: 'b', aName: 'Alice', bName: 'Bob' });
    const e2 = makeEntry({ aId: 'c', bId: 'd', aName: 'Cora', bName: 'Dina' });
    render(
      <RelationHistoryMenu history={[e1, e2]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));
    const first = screen.getByRole('menuitem', { name: /rouvrir Alice et Bob/i });
    const second = screen.getByRole('menuitem', { name: /rouvrir Cora et Dina/i });
    // La premiere entree a tabindex 0, la seconde -1 au moment de l'ouverture
    expect(first).toHaveAttribute('tabindex', '0');
    expect(second).toHaveAttribute('tabindex', '-1');
    // ArrowDown depuis la premiere
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(second).toHaveAttribute('tabindex', '0');
    // ArrowUp revient a la premiere
    fireEvent.keyDown(second, { key: 'ArrowUp' });
    expect(first).toHaveAttribute('tabindex', '0');
  });

  it('Delete sur une entree appelle onRemove sans la selectionner', () => {
    const onSelect = vi.fn();
    const onRemove = vi.fn();
    render(
      <RelationHistoryMenu
        history={[makeEntry({ aId: 'x', bId: 'y', aName: 'Alice', bName: 'Bob' })]}
        onSelect={onSelect} onRemove={onRemove} onClear={noop} onNewSearch={noop}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /historique/i }));
    const item = screen.getByRole('menuitem', { name: /rouvrir Alice et Bob/i });
    fireEvent.keyDown(item, { key: 'Delete' });
    expect(onRemove).toHaveBeenCalledWith('x', 'y');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('Escape ferme le panneau ET rend focus au bouton trigger', () => {
    render(
      <RelationHistoryMenu history={[makeEntry()]} onSelect={noop} onRemove={noop} onClear={noop} onNewSearch={noop} />,
    );
    const trigger = screen.getByRole('button', { name: /historique/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

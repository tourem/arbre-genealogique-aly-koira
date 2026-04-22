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

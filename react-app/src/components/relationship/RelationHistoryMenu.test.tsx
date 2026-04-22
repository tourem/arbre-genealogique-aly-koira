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

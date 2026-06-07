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

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

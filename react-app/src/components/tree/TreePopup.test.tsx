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

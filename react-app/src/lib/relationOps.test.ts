/**
 * Tests d'integration logique : les 3 operations symetriques doivent
 * laisser les deux fiches dans un etat coherent. Les assertions reprennent
 * mot pour mot la semantique de la migration 015 (detach_parent,
 * dissolve_marriage, detach_child_from_foyer).
 *
 * Ce test n'appelle pas Supabase — il simule la mutation cote TS pour
 * detecter les regressions semantiques AVANT le round-trip reseau. La
 * RPC SQL reste la source de verite ; ces tests sont un filet de
 * securite supplementaire contre les bugs cote description + cote
 * appel client.
 */

import { describe, it, expect } from 'vitest';
import {
  describeDetachParent,
  describeDissolveMarriage,
  describeDetachChildFromFoyer,
} from './relationOps';
import type { Member, MemberDict } from './types';

function makeMember(overrides: Partial<Member>): Member {
  return {
    id: overrides.id ?? 'm-' + Math.random().toString(36).slice(2, 8),
    name: overrides.name ?? 'Test',
    first_name: null,
    alias: null,
    gender: overrides.gender ?? 'M',
    generation: overrides.generation ?? 2,
    father_id: overrides.father_id ?? null,
    mother_ref: overrides.mother_ref ?? null,
    spouses: overrides.spouses ?? [],
    children: overrides.children ?? [],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
    ...overrides,
  };
}

// =========================================================
// Simulation pure de la RPC detach_parent
// =========================================================

function simulateDetachParent(
  members: MemberDict,
  childId: string,
  role: 'father' | 'mother',
): MemberDict {
  const next: MemberDict = { ...members };
  const child = next[childId];
  if (!child) return next;

  const parentId = role === 'father' ? child.father_id : child.mother_ref;

  // Cote enfant : clear le lien
  next[childId] = { ...child, [role === 'father' ? 'father_id' : 'mother_ref']: null };

  // Cote parent : retire de children[]
  if (parentId && next[parentId]) {
    next[parentId] = {
      ...next[parentId],
      children: next[parentId].children.filter((c) => c !== childId),
    };
  }

  return next;
}

function simulateDissolveMarriage(
  members: MemberDict,
  aId: string,
  bId: string,
): MemberDict {
  const next: MemberDict = { ...members };
  if (next[aId]) {
    next[aId] = { ...next[aId], spouses: next[aId].spouses.filter((s) => s !== bId) };
  }
  if (next[bId]) {
    next[bId] = { ...next[bId], spouses: next[bId].spouses.filter((s) => s !== aId) };
  }
  return next;
}

function simulateDetachChild(
  members: MemberDict,
  childId: string,
): MemberDict {
  const next: MemberDict = { ...members };
  const child = next[childId];
  if (!child) return next;

  const { father_id: fId, mother_ref: mId } = child;
  next[childId] = { ...child, father_id: null, mother_ref: null };

  if (fId && next[fId]) {
    next[fId] = { ...next[fId], children: next[fId].children.filter((c) => c !== childId) };
  }
  if (mId && next[mId]) {
    next[mId] = { ...next[mId], children: next[mId].children.filter((c) => c !== childId) };
  }

  return next;
}

// =========================================================
// Tests de symetrie
// =========================================================

describe('detach_parent : symetrie parent-enfant', () => {
  it('clear le lien des deux cotes en une operation', () => {
    const child = makeMember({ id: 'c1', father_id: 'p1', name: 'Enfant' });
    const parent = makeMember({ id: 'p1', children: ['c1', 'other'], name: 'Pere', gender: 'M' });
    const members: MemberDict = { c1: child, p1: parent };

    const next = simulateDetachParent(members, 'c1', 'father');

    expect(next.c1.father_id).toBeNull();
    expect(next.p1.children).toEqual(['other']);
  });

  it('ne touche pas a l\'autre parent (mother inchange quand on retire father)', () => {
    const child = makeMember({ id: 'c1', father_id: 'p1', mother_ref: 'm1' });
    const father = makeMember({ id: 'p1', children: ['c1'], gender: 'M' });
    const mother = makeMember({ id: 'm1', children: ['c1'], gender: 'F' });
    const members: MemberDict = { c1: child, p1: father, m1: mother };

    const next = simulateDetachParent(members, 'c1', 'father');

    expect(next.c1.mother_ref).toBe('m1');
    expect(next.m1.children).toEqual(['c1']);
  });

  it('ne casse pas quand le parent n\'existe pas comme fiche (mother_ref texte libre)', () => {
    const child = makeMember({ id: 'c1', mother_ref: 'nom-libre-sans-fiche' });
    const members: MemberDict = { c1: child };

    const next = simulateDetachParent(members, 'c1', 'mother');

    expect(next.c1.mother_ref).toBeNull();
  });
});

describe('dissolve_marriage : symetrie du mariage', () => {
  it('retire chacun de la liste de conjoints de l\'autre', () => {
    const a = makeMember({ id: 'a', spouses: ['b', 'b2'], gender: 'M' });
    const b = makeMember({ id: 'b', spouses: ['a'], gender: 'F' });
    const b2 = makeMember({ id: 'b2', spouses: ['a'], gender: 'F' });
    const members: MemberDict = { a, b, b2 };

    const next = simulateDissolveMarriage(members, 'a', 'b');

    expect(next.a.spouses).toEqual(['b2']);
    expect(next.b.spouses).toEqual([]);
    expect(next.b2.spouses).toEqual(['a']); // inchange
  });

  it('n\'affecte pas les enfants du foyer', () => {
    const a = makeMember({ id: 'a', spouses: ['b'], children: ['c1'], gender: 'M' });
    const b = makeMember({ id: 'b', spouses: ['a'], children: ['c1'], gender: 'F' });
    const c1 = makeMember({ id: 'c1', father_id: 'a', mother_ref: 'b' });
    const members: MemberDict = { a, b, c1 };

    const next = simulateDissolveMarriage(members, 'a', 'b');

    expect(next.c1.father_id).toBe('a');
    expect(next.c1.mother_ref).toBe('b');
    expect(next.a.children).toEqual(['c1']);
    expect(next.b.children).toEqual(['c1']);
  });
});

describe('detach_child_from_foyer : symetrie triangulaire', () => {
  it('clear father+mother cote enfant ET retire des deux parents', () => {
    const c1 = makeMember({ id: 'c1', father_id: 'p', mother_ref: 'm' });
    const p = makeMember({ id: 'p', children: ['c1', 'c2'], gender: 'M' });
    const m = makeMember({ id: 'm', children: ['c1'], gender: 'F' });
    const members: MemberDict = { c1, p, m };

    const next = simulateDetachChild(members, 'c1');

    expect(next.c1.father_id).toBeNull();
    expect(next.c1.mother_ref).toBeNull();
    expect(next.p.children).toEqual(['c2']);
    expect(next.m.children).toEqual([]);
  });

  it('tolere un seul parent present (pere sans fiche mere)', () => {
    const c1 = makeMember({ id: 'c1', father_id: 'p', mother_ref: null });
    const p = makeMember({ id: 'p', children: ['c1'], gender: 'M' });
    const members: MemberDict = { c1, p };

    const next = simulateDetachChild(members, 'c1');

    expect(next.c1.father_id).toBeNull();
    expect(next.p.children).toEqual([]);
  });
});

// =========================================================
// Tests des descriptions de consequences
// =========================================================

describe('describeDetachParent', () => {
  it('phrase principale + items cote enfant + cote parent', () => {
    const child = makeMember({ id: 'c', name: 'Ali' });
    const father = makeMember({ id: 'p', name: 'Mahamane', gender: 'M' });

    const r = describeDetachParent(child, father, 'father');

    expect(r.headline).toContain('Mahamane');
    expect(r.headline).toContain('Ali');
    expect(r.items.some((s) => s.includes('Mahamane'))).toBe(true);
    expect(r.preservation).toContain('intactes');
  });

  it('gere un nom libre comme parent (fallback mother_ref texte)', () => {
    const child = makeMember({ id: 'c', name: 'Ali' });

    const r = describeDetachParent(child, 'Fatimata Halidou', 'mother');

    expect(r.headline).toContain('Fatimata Halidou');
    // Pas de bullet "perdra X de sa liste d'enfants" si le parent n'a pas de fiche
    expect(r.items.every((s) => !s.includes("liste d'enfants"))).toBe(true);
  });
});

describe('describeDissolveMarriage', () => {
  it('signale les enfants partages du foyer', () => {
    const h = makeMember({ id: 'h', name: 'Aly', gender: 'M', children: ['c1', 'c2'] });
    const w = makeMember({ id: 'w', name: 'Saffy', gender: 'F' });
    const c1 = makeMember({ id: 'c1', father_id: 'h', mother_ref: 'w' });
    const c2 = makeMember({ id: 'c2', father_id: 'h', mother_ref: 'w' });
    const members: MemberDict = { h, w, c1, c2 };

    const r = describeDissolveMarriage(h, w, members);

    expect(r.warnings[0]).toContain('2 enfants');
    expect(r.preservation).toContain('intactes');
  });

  it('pas d\'avertissement quand pas d\'enfants partages', () => {
    const h = makeMember({ id: 'h', name: 'Aly', gender: 'M' });
    const w = makeMember({ id: 'w', name: 'Saffy', gender: 'F' });

    const r = describeDissolveMarriage(h, w, { h, w });

    expect(r.warnings).toEqual([]);
  });
});

describe('describeDetachChildFromFoyer', () => {
  it('enumere les deux parents impactes', () => {
    const c = makeMember({ id: 'c', name: 'Ali' });
    const f = makeMember({ id: 'f', name: 'Mahamane', gender: 'M' });
    const m = makeMember({ id: 'm', name: 'Sababa', gender: 'F' });

    const r = describeDetachChildFromFoyer(c, f, m);

    expect(r.items.some((s) => s.includes('Mahamane'))).toBe(true);
    expect(r.items.some((s) => s.includes('Sababa'))).toBe(true);
    expect(r.warnings[0]).toContain('orpheline');
  });
});

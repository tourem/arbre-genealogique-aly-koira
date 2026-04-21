import { describe, it, expect } from 'vitest';
import { computeFoyers, rankLabel } from './foyers';
import type { Member, MemberDict } from './types';

function mk(id: string, over: Partial<Member> = {}): Member {
  return {
    id, name: id, first_name: null, alias: null, gender: 'M', generation: 0,
    father_id: null, mother_ref: null, spouses: [], children: [],
    photo_url: null, note: null, birth_city: null, birth_country: null, village: null,
    ...over,
  };
}

describe('computeFoyers', () => {
  it('returns empty list when no spouses and no children', () => {
    const m = mk('alice');
    expect(computeFoyers(m, { alice: m })).toEqual([]);
  });

  it('groups children by mother for a male person with 2 wives', () => {
    const wife1 = mk('fatou', { name: 'Fatou', gender: 'F' });
    const wife2 = mk('awa',   { name: 'Awa',   gender: 'F' });
    const c1 = mk('c1', { father_id: 'ali', mother_ref: 'fatou' });
    const c2 = mk('c2', { father_id: 'ali', mother_ref: 'fatou' });
    const c3 = mk('c3', { father_id: 'ali', mother_ref: 'awa' });
    const ali = mk('ali', {
      gender: 'M',
      spouses: ['fatou', 'awa'],
      children: ['c1', 'c2', 'c3'],
    });
    const dict: MemberDict = { ali, fatou: wife1, awa: wife2, c1, c2, c3 };
    const foyers = computeFoyers(ali, dict);
    expect(foyers).toHaveLength(2);
    expect(foyers[0].spouse?.id).toBe('fatou');
    expect(foyers[0].children.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(foyers[1].spouse?.id).toBe('awa');
    expect(foyers[1].children.map((c) => c.id)).toEqual(['c3']);
  });

  it('groups by father for a female person', () => {
    const hus = mk('ali', { name: 'Ali', gender: 'M' });
    const c1 = mk('c1', { father_id: 'ali', mother_ref: 'fatou' });
    const fatou = mk('fatou', {
      gender: 'F', spouses: ['ali'], children: ['c1'],
    });
    const dict: MemberDict = { fatou, ali: hus, c1 };
    const foyers = computeFoyers(fatou, dict);
    expect(foyers).toHaveLength(1);
    expect(foyers[0].spouse?.id).toBe('ali');
    expect(foyers[0].children.map((c) => c.id)).toEqual(['c1']);
  });

  it('puts leftover children into an orphan foyer at the end', () => {
    const wife = mk('fatou', { name: 'Fatou', gender: 'F' });
    const c1 = mk('c1', { father_id: 'ali', mother_ref: 'fatou' });
    const orphanChild = mk('c2', { father_id: 'ali', mother_ref: 'unknown' });
    const ali = mk('ali', { gender: 'M', spouses: ['fatou'], children: ['c1', 'c2'] });
    const dict: MemberDict = { ali, fatou: wife, c1, c2: orphanChild };
    const foyers = computeFoyers(ali, dict);
    expect(foyers).toHaveLength(2);
    expect(foyers[0].orphan).toBe(false);
    expect(foyers[0].children.map((c) => c.id)).toEqual(['c1']);
    expect(foyers[1].orphan).toBe(true);
    expect(foyers[1].children.map((c) => c.id)).toEqual(['c2']);
  });

  it('falls back to spouse name when spouse has no member record', () => {
    const c1 = mk('c1', { father_id: 'ali', mother_ref: 'Zeynab' });
    const ali = mk('ali', { gender: 'M', spouses: ['Zeynab'], children: ['c1'] });
    const dict: MemberDict = { ali, c1 };
    const foyers = computeFoyers(ali, dict);
    expect(foyers).toHaveLength(1);
    expect(foyers[0].spouse).toBeNull();
    expect(foyers[0].spouseName).toBe('Zeynab');
    expect(foyers[0].children.map((c) => c.id)).toEqual(['c1']);
  });
});

describe('rankLabel', () => {
  it('formats 1ère épouse for a female first spouse', () => {
    expect(rankLabel(1, 'F')).toBe('1ère épouse');
  });
  it('formats 2ème époux for a male second spouse', () => {
    expect(rankLabel(2, 'M')).toBe('2ème époux');
  });
  it('formats 3ème épouse', () => {
    expect(rankLabel(3, 'F')).toBe('3ème épouse');
  });
});

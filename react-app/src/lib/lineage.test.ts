import { describe, it, expect } from 'vitest';
import { buildLineage } from './lineage';
import type { Member, MemberDict } from './types';

function mk(id: string, over: Partial<Member> = {}): Member {
  return {
    id, name: id, first_name: null, alias: null, gender: 'M', generation: 0,
    father_id: null, mother_ref: null, spouses: [], children: [],
    photo_url: null, note: null, birth_city: null, birth_country: null, village: null,
    ...over,
  };
}

describe('buildLineage', () => {
  it('returns empty when no relations', () => {
    const m = mk('alice');
    expect(buildLineage(m, { alice: m })).toBe('');
  });

  it('adds "Fils de X" when father is known', () => {
    const f = mk('omar', { name: 'Omar' });
    const m = mk('ali', { name: 'Ali', father_id: 'omar' });
    expect(buildLineage(m, { omar: f, ali: m })).toBe('Fils de Omar');
  });

  it('adds "Fille de X" for female', () => {
    const f = mk('omar', { name: 'Omar' });
    const m = mk('amina', { name: 'Amina', gender: 'F', father_id: 'omar' });
    expect(buildLineage(m, { omar: f, amina: m })).toBe('Fille de Omar');
  });

  it('adds grandfather when available', () => {
    const gf = mk('mamadou', { name: 'Mamadou' });
    const f = mk('omar', { name: 'Omar', father_id: 'mamadou' });
    const m = mk('ali', { name: 'Ali', father_id: 'omar' });
    expect(buildLineage(m, { mamadou: gf, omar: f, ali: m })).toBe('Fils de Omar, petit-fils de Mamadou');
  });

  it('lists spouses joined with et', () => {
    const s1 = mk('fatou', { name: 'Fatou', gender: 'F' });
    const s2 = mk('awa', { name: 'Awa', gender: 'F' });
    const s3 = mk('aicha', { name: 'Aicha', gender: 'F' });
    const m = mk('ali', { name: 'Ali', spouses: ['fatou', 'awa', 'aicha'] });
    const dict: MemberDict = { ali: m, fatou: s1, awa: s2, aicha: s3 };
    expect(buildLineage(m, dict)).toBe('époux de Fatou, Awa et Aicha');
  });

  it('uses "épouse" for female with spouses', () => {
    const s = mk('ali', { name: 'Ali' });
    const m = mk('fatou', { name: 'Fatou', gender: 'F', spouses: ['ali'] });
    expect(buildLineage(m, { ali: s, fatou: m })).toBe('épouse de Ali');
  });

  it('combines all segments', () => {
    const gf = mk('mamadou', { name: 'Mamadou' });
    const f = mk('omar', { name: 'Omar', father_id: 'mamadou' });
    const sp = mk('fatou', { name: 'Fatou', gender: 'F' });
    const m = mk('ali', { name: 'Ali', father_id: 'omar', spouses: ['fatou'] });
    const dict: MemberDict = { mamadou: gf, omar: f, ali: m, fatou: sp };
    expect(buildLineage(m, dict)).toBe('Fils de Omar, petit-fils de Mamadou, époux de Fatou');
  });
});

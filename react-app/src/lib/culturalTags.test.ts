import { describe, it, expect } from 'vitest';
import { resolveTags } from './culturalTags';
import type { Member, MemberDict } from './types';

function mk(id: string, over: Partial<Member> = {}): Member {
  return {
    id, name: id, first_name: null, alias: null, gender: 'M', generation: 0,
    father_id: null, mother_ref: null, spouses: [], children: [],
    photo_url: null, note: null, birth_city: null, birth_country: null, village: null,
    ...over,
  };
}

describe('resolveTags', () => {
  it('returns empty for a member with no tags and no parent', () => {
    const m = mk('alice');
    expect(resolveTags(m, { alice: m })).toEqual([]);
  });

  it('detects koda when the member is last in father\'s children', () => {
    const father = mk('p1', { children: ['alice', 'bob'] });
    const alice = mk('alice', { father_id: 'p1' });
    const bob   = mk('bob',   { father_id: 'p1' });
    const dict: MemberDict = { p1: father, alice, bob };
    expect(resolveTags(bob, dict)).toEqual([{ tag: 'koda', source: 'inferred' }]);
    expect(resolveTags(alice, dict)).toEqual([]);
  });

  it('respects explicit cultural_tags as the primary source', () => {
    const father = mk('p1', { children: ['alice', 'bob'] });
    const alice = mk('alice', { father_id: 'p1', cultural_tags: ['koda'] });
    const bob   = mk('bob',   { father_id: 'p1' });
    const dict: MemberDict = { p1: father, alice, bob };
    // Alice is explicitly koda even though Bob is "last".
    expect(resolveTags(alice, dict)).toEqual([{ tag: 'koda', source: 'explicit' }]);
    // Bob still inferred.
    expect(resolveTags(bob, dict)).toEqual([{ tag: 'koda', source: 'inferred' }]);
  });

  it('does not duplicate tags between explicit and inferred', () => {
    const father = mk('p1', { children: ['carla'] });
    const carla = mk('carla', { father_id: 'p1', cultural_tags: ['koda'] });
    const dict: MemberDict = { p1: father, carla };
    expect(resolveTags(carla, dict)).toEqual([{ tag: 'koda', source: 'explicit' }]);
  });

  it('ignores unknown tag values silently', () => {
    const m = mk('x', { cultural_tags: ['koda', 'not_a_real_tag'] });
    expect(resolveTags(m, { x: m })).toEqual([{ tag: 'koda', source: 'explicit' }]);
  });
});

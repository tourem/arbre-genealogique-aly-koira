import { describe, it, expect } from 'vitest';
import { groupRelations } from './groupRelations';
import type { Relation } from '../../lib/parenteSonghay';

const mk = (termForA: string, termForB: string, via: string, proximity: number): Relation => ({
  termForA, termForB, kind: 'parallel',
  via, viaName: via,
  pathA: [], pathB: [],
  distanceA: 0, distanceB: proximity,
  proximityScore: proximity, balanceScore: proximity,
});

describe('groupRelations', () => {
  it('merges relations sharing the same term pair into one group', () => {
    const rels: Relation[] = [
      mk('baassa arou', 'baassa woy', 'sira', 4),
      mk('baassa arou', 'baassa woy', 'hadja', 3),
      mk('arma', 'arma', 'sekou', 2),
    ];
    const groups = groupRelations(rels);
    expect(groups).toHaveLength(2);
    // baassa group has 2 paths
    const baassa = groups.find((g) => g.termForA === 'baassa arou');
    expect(baassa?.paths).toHaveLength(2);
    // sorted by proximity within the group
    expect(baassa?.paths[0].via).toBe('hadja');
    expect(baassa?.paths[1].via).toBe('sira');
  });

  it('orders groups by best path proximity', () => {
    const rels: Relation[] = [
      mk('baassa arou', 'baassa woy', 'sira', 6),
      mk('arma', 'arma', 'sekou', 3),
    ];
    const groups = groupRelations(rels);
    expect(groups[0].termForA).toBe('arma');
    expect(groups[1].termForA).toBe('baassa arou');
  });

  it('returns one group per path when term pairs are all unique', () => {
    const rels: Relation[] = [
      mk('arma', 'arma', 'sekou', 2),
      mk('hassa', 'touba', 'sekou', 3),
    ];
    const groups = groupRelations(rels);
    expect(groups).toHaveLength(2);
    expect(groups[0].paths).toHaveLength(1);
    expect(groups[1].paths).toHaveLength(1);
  });
});

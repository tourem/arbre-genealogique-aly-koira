// react-app/src/lib/parenteSonghay/findLCAInstances.test.ts
import { describe, it, expect } from 'vitest';
import { findLCAInstances } from './findLCAInstances';
import type { AncestorPath } from './types';

describe('findLCAInstances', () => {
  it('returns empty when no common ancestor', () => {
    const a: AncestorPath[] = [{ ancestor: 'a', hops: [] }];
    const b: AncestorPath[] = [{ ancestor: 'b', hops: [] }];
    expect(findLCAInstances(a, b)).toEqual([]);
  });

  it('finds a simple LCA', () => {
    const a: AncestorPath[] = [
      { ancestor: 'a', hops: [] },
      { ancestor: 'lca', hops: ['P'] },
    ];
    const b: AncestorPath[] = [
      { ancestor: 'b', hops: [] },
      { ancestor: 'lca', hops: ['M'] },
    ];
    const result = findLCAInstances(a, b);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      ancestor: 'lca', pathA: ['P'], pathB: ['M'],
    });
  });

  it('excludes non-minimal instances (closer ancestor dominates)', () => {
    // A → p1 → top
    // B → p1 → top
    // minimal: via p1 (pathA=[P], pathB=[P])
    // non-minimal: via top (pathA=[P,P], pathB=[P,P])
    const a: AncestorPath[] = [
      { ancestor: 'a', hops: [] },
      { ancestor: 'p1', hops: ['P'] },
      { ancestor: 'top', hops: ['P', 'P'] },
    ];
    const b: AncestorPath[] = [
      { ancestor: 'b', hops: [] },
      { ancestor: 'p1', hops: ['P'] },
      { ancestor: 'top', hops: ['P', 'P'] },
    ];
    const result = findLCAInstances(a, b);
    expect(result).toHaveLength(1);
    expect(result[0].ancestor).toBe('p1');
  });

  it('keeps both instances when paths differ (bilateral)', () => {
    // A and B share lca1 via P on both, AND lca2 via M on both — distinct
    const a: AncestorPath[] = [
      { ancestor: 'a', hops: [] },
      { ancestor: 'lca1', hops: ['P'] },
      { ancestor: 'lca2', hops: ['M'] },
    ];
    const b: AncestorPath[] = [
      { ancestor: 'b', hops: [] },
      { ancestor: 'lca1', hops: ['P'] },
      { ancestor: 'lca2', hops: ['M'] },
    ];
    const result = findLCAInstances(a, b);
    expect(result).toHaveLength(2);
  });
});

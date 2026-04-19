// react-app/src/lib/parenteSonghay/explain.test.ts
import { describe, it, expect } from 'vitest';
import { explainRelation } from './explain';
import { defaultLabels } from './labels';
import type { Relation } from './types';

const mkRelation = (over: Partial<Relation> = {}): Relation => ({
  termForA: 'hassa', termForB: 'touba',
  kind: 'avuncular',
  via: 'lca', viaName: 'LCA',
  pathA: ['P'], pathB: ['M', 'P'],
  distanceA: 1, distanceB: 2,
  proximityScore: 3, balanceScore: 2,
  ...over,
});

describe('explainRelation', () => {
  it('picks avuncular.hassa template when termForA is hassa', () => {
    const r = mkRelation({ termForA: 'hassa', termForB: 'touba' });
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text).toContain('hassa');
    expect(text.toLowerCase()).toContain('oncle maternel');
  });

  it('picks avuncular.hawa template when termForA is hawa', () => {
    const r = mkRelation({ termForA: 'hawa', termForB: 'izé' });
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text).toContain('hawa');
  });

  it('picks parallel template', () => {
    const r = mkRelation({ kind: 'parallel', termForA: 'arma', termForB: 'woyma', pathA: ['P'], pathB: ['M'], distanceA: 1, distanceB: 1, proximityScore: 2, balanceScore: 1 });
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text.toLowerCase()).toContain('parallèle');
  });

  it('picks cross template', () => {
    const r = mkRelation({ kind: 'cross', termForA: 'baassa arou', termForB: 'baassa woy' });
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text.toLowerCase()).toContain('baassa');
  });

  it('picks distant-vertical template', () => {
    const r = mkRelation({ kind: 'distant-vertical', termForA: 'kaga kaga arou coté baba', termForB: 'haama haama', distanceA: 1, distanceB: 3, proximityScore: 4, balanceScore: 3 });
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text).toContain('kaga');
  });

  it('substitutes placeholders', () => {
    const r = mkRelation();
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text).not.toContain('{');
    expect(text).not.toContain('}');
  });

  it('picks direct-descendant parent for distance 1', () => {
    const r = mkRelation({ kind: 'direct-descendant', termForA: 'baba', termForB: 'izé', pathA: [], pathB: ['P'], distanceA: 0, distanceB: 1, proximityScore: 1, balanceScore: 1 });
    const text = explainRelation(r, 'Alice', 'Bob', defaultLabels);
    expect(text).toContain('Alice');
    expect(text).toContain('Bob');
  });
});

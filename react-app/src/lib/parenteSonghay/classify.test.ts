// react-app/src/lib/parenteSonghay/classify.test.ts
import { describe, it, expect } from 'vitest';
import { classifyInstance } from './classify';
import { makeTestFamily } from './fixtures/testFamily';
import { defaultLabels } from './labels';

const dict = makeTestFamily();
const L = defaultLabels;

describe('classify — direct descendant', () => {
  it('Sira ↔ Modibo (parent direct, dA=0, dB=1)', () => {
    const r = classifyInstance(
      dict.sira, dict.modibo,
      { ancestor: 'sira', pathA: [], pathB: ['M'] },
      dict, L,
    );
    if (!('termForA' in r)) throw new Error('expected Relation');
    expect(r.termForA).toBe('gna');
    expect(r.termForB).toBe('izé');
    expect(r.kind).toBe('direct-descendant');
  });

  it('Sira ↔ Sékou (kaga-arou, dist=2)', () => {
    const r = classifyInstance(
      dict.sira, dict.sekou,
      { ancestor: 'sira', pathA: [], pathB: ['P', 'M'] },
      dict, L,
    );
    if (!('termForA' in r)) throw new Error('expected Relation');
    expect(r.termForA).toBe('kaga woy coté baba');
    expect(r.termForB).toBe('haama');
    expect(r.kind).toBe('direct-descendant');
  });
});

describe('classify — same generation', () => {
  it('Modibo ↔ Hadja (vrais frère et sœur via Sira)', () => {
    const r = classifyInstance(
      dict.modibo, dict.hadja,
      { ancestor: 'sira', pathA: ['M'], pathB: ['M'] },
      dict, L,
    );
    if (!('termForA' in r)) throw new Error();
    expect(r.termForA).toBe('arma');
    expect(r.termForB).toBe('woyma');
    expect(r.kind).toBe('parallel');
  });

  it('Khadidia ↔ Djéneba (cousines croisées via Modibo)', () => {
    const r = classifyInstance(
      dict.khadidia, dict.djeneba,
      { ancestor: 'modibo', pathA: ['M', 'P'], pathB: ['P', 'P'] },
      dict, L,
    );
    if (!('termForA' in r)) throw new Error();
    expect(r.termForA).toBe('baassa woy');
    expect(r.termForB).toBe('baassa woy');
    expect(r.kind).toBe('cross');
  });
});

describe('classify — avuncular', () => {
  it('Bakary ↔ Cheick via Sékou (hassa/touba)', () => {
    const r = classifyInstance(
      dict.bakary, dict.cheick,
      { ancestor: 'sekou', pathA: ['P'], pathB: ['M', 'P'] },
      dict, L,
    );
    if (!('termForA' in r)) throw new Error();
    expect(r.termForA).toBe('hassa');
    expect(r.termForB).toBe('touba');
    expect(r.kind).toBe('avuncular');
  });

  it('Djéneba ↔ Lassana (hawa/izé)', () => {
    const r = classifyInstance(
      dict.djeneba, dict.lassana,
      { ancestor: 'sekou', pathA: ['P'], pathB: ['P', 'P'] },
      dict, L,
    );
    if (!('termForA' in r)) throw new Error();
    expect(r.termForA).toBe('hawa');
    expect(r.termForB).toBe('izé');
    expect(r.kind).toBe('avuncular');
  });
});

describe('classify — incomplete path', () => {
  it('returns incomplete when a required parent is null', () => {
    const short: typeof dict = {
      ...dict,
      orphan: { id: 'orphan', name: 'Orphan', sex: 'M', fatherId: null, motherId: null },
    };
    const r = classifyInstance(
      short.orphan, short.modibo,
      { ancestor: 'unknown', pathA: ['P'], pathB: ['P'] },
      short, L,
    );
    expect(r).toEqual({ incomplete: true, missing: expect.any(Array) });
  });
});

import { describe, it, expect } from 'vitest';
import { glossForTerm } from './glossForTerm';
import { defaultLabels } from './labels';

describe('glossForTerm', () => {
  const L = defaultLabels;

  it('returns the gloss for an atomic term', () => {
    expect(glossForTerm('hassa', L)).toBe('oncle maternel');
    expect(glossForTerm('baassa arou', L)).toBe('cousin croisé');
  });

  it('appends (côté paternel) for kaga coté baba', () => {
    expect(glossForTerm('kaga arou coté baba', L)).toBe('grand-père / ancêtre (côté paternel)');
  });

  it('appends (côté maternel) for kaga coté gna', () => {
    expect(glossForTerm('kaga woy coté gna', L)).toBe('grand-mère / ancêtre (côté maternel)');
  });

  it('handles repeated kaga', () => {
    const g = glossForTerm('kaga kaga arou coté baba', L);
    expect(g).toBe('grand-père / ancêtre (côté paternel)');
  });

  it('handles repeated haama', () => {
    expect(glossForTerm('haama haama', L)).toBe('petit-enfant / descendant');
  });

  it('returns undefined for an unknown term', () => {
    expect(glossForTerm('xyz unknown term', L)).toBeUndefined();
  });
});

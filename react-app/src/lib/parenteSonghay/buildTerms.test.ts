// react-app/src/lib/parenteSonghay/buildTerms.test.ts
import { describe, it, expect } from 'vitest';
import {
  buildDirectParentTerm,
  buildDirectChildTerm,
  buildKagaTerm,
  buildHaamaTerm,
  buildSiblingTerm,
  buildCrossCousinTerm,
  buildCoteSuffix,
} from './buildTerms';
import { defaultLabels } from './labels';

describe('buildTerms', () => {
  const L = defaultLabels;

  it('direct parent term (father)', () => {
    expect(buildDirectParentTerm('M', L)).toBe('baba');
  });

  it('direct parent term (mother)', () => {
    expect(buildDirectParentTerm('F', L)).toBe('gna');
  });

  it('direct child term is always izé', () => {
    expect(buildDirectChildTerm(L)).toBe('izé');
  });

  it('kaga term with 1 generation repeats once + cote suffix', () => {
    expect(buildKagaTerm('M', 1, 'P', L)).toBe('kaga arou coté baba');
    expect(buildKagaTerm('F', 1, 'M', L)).toBe('kaga woy coté gna');
  });

  it('kaga term with 3 generations repeats kaga 3 times', () => {
    expect(buildKagaTerm('M', 3, 'P', L)).toBe('kaga kaga kaga arou coté baba');
  });

  it('haama term with 1 repetition', () => {
    expect(buildHaamaTerm(1, L)).toBe('haama');
  });

  it('haama term with 3 repetitions', () => {
    expect(buildHaamaTerm(3, L)).toBe('haama haama haama');
  });

  it('sibling term arma for male', () => {
    expect(buildSiblingTerm('M', L)).toBe('arma');
  });

  it('sibling term woyma for female', () => {
    expect(buildSiblingTerm('F', L)).toBe('woyma');
  });

  it('cross cousin term baassa arou for male', () => {
    expect(buildCrossCousinTerm('M', L)).toBe('baassa arou');
  });

  it('cross cousin term baassa woy for female', () => {
    expect(buildCrossCousinTerm('F', L)).toBe('baassa woy');
  });

  it('cote suffix maps hop P → coté baba, M → coté gna', () => {
    expect(buildCoteSuffix('P', L)).toBe('coté baba');
    expect(buildCoteSuffix('M', L)).toBe('coté gna');
  });
});

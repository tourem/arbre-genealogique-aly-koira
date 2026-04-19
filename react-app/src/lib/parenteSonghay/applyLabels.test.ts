// react-app/src/lib/parenteSonghay/applyLabels.test.ts
import { describe, it, expect } from 'vitest';
import { applyLabels } from './applyLabels';
import { defaultLabels } from './labels';

describe('applyLabels', () => {
  it('returns defaults when overrides is empty', () => {
    const result = applyLabels({});
    expect(result).toEqual(defaultLabels);
  });

  it('overrides a single key without touching others', () => {
    const result = applyLabels({ 'term.hassa': 'Hassa-custom' });
    expect(result['term.hassa']).toBe('Hassa-custom');
    expect(result['term.touba']).toBe(defaultLabels['term.touba']);
    expect(result['term.baba']).toBe(defaultLabels['term.baba']);
  });

  it('ignores overrides for keys unknown in defaults (silent drop)', () => {
    const result = applyLabels({ 'unknown.key': 'ignored' });
    expect(result).toEqual(defaultLabels);
    expect(result).not.toHaveProperty('unknown.key');
  });

  it('accepts multiple overrides at once', () => {
    const result = applyLabels({
      'term.hassa': 'H',
      'gloss.hassa': 'o.m.',
    });
    expect(result['term.hassa']).toBe('H');
    expect(result['gloss.hassa']).toBe('o.m.');
  });
});

import { describe, it, expect } from 'vitest';
import { formatOrdinal } from './ordinal';

describe('formatOrdinal', () => {
  it('returns "1ᵉʳ" for male rank 1', () => {
    expect(formatOrdinal(1, 'M')).toBe('1ᵉʳ');
  });

  it('returns "1ʳᵉ" for female rank 1', () => {
    expect(formatOrdinal(1, 'F')).toBe('1ʳᵉ');
  });

  it('returns "Nᵉ" for any rank ≥ 2 regardless of gender', () => {
    expect(formatOrdinal(2, 'M')).toBe('2ᵉ');
    expect(formatOrdinal(3, 'F')).toBe('3ᵉ');
    expect(formatOrdinal(10, 'M')).toBe('10ᵉ');
    expect(formatOrdinal(21, 'F')).toBe('21ᵉ');
  });

  it('returns plain number for rank 0 or negative', () => {
    expect(formatOrdinal(0, 'M')).toBe('0');
    expect(formatOrdinal(-1, 'F')).toBe('-1');
  });
});

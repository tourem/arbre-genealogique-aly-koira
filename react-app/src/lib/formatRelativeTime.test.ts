import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from './formatRelativeTime';

// Ancre fixe pour tests deterministes : 15 mars 2026 a 14:00:00 UTC+0
const NOW = new Date('2026-03-15T14:00:00Z').getTime();

describe('formatRelativeTime', () => {
  it('renvoie "à l\'instant" pour 0 seconde', () => {
    expect(formatRelativeTime(NOW, NOW)).toBe("à l'instant");
  });

  it('renvoie "à l\'instant" pour 45 secondes', () => {
    expect(formatRelativeTime(NOW - 45 * 1000, NOW)).toBe("à l'instant");
  });

  it('renvoie "il y a 1 min" pour 90 secondes', () => {
    expect(formatRelativeTime(NOW - 90 * 1000, NOW)).toBe('il y a 1 min');
  });

  it('renvoie "il y a 5 min" pour 5 minutes', () => {
    expect(formatRelativeTime(NOW - 5 * 60 * 1000, NOW)).toBe('il y a 5 min');
  });

  it('renvoie "il y a 59 min" pour 59 minutes', () => {
    expect(formatRelativeTime(NOW - 59 * 60 * 1000, NOW)).toBe('il y a 59 min');
  });

  it('renvoie "il y a 1 h" pour 60 minutes', () => {
    expect(formatRelativeTime(NOW - 60 * 60 * 1000, NOW)).toBe('il y a 1 h');
  });

  it('renvoie "il y a 2 h" pour 2 heures', () => {
    expect(formatRelativeTime(NOW - 2 * 60 * 60 * 1000, NOW)).toBe('il y a 2 h');
  });

  it('renvoie "il y a 23 h" pour 23 heures', () => {
    expect(formatRelativeTime(NOW - 23 * 60 * 60 * 1000, NOW)).toBe('il y a 23 h');
  });

  it('renvoie "hier" pour 25 heures', () => {
    expect(formatRelativeTime(NOW - 25 * 60 * 60 * 1000, NOW)).toBe('hier');
  });

  it('renvoie "hier" pour 47 heures', () => {
    expect(formatRelativeTime(NOW - 47 * 60 * 60 * 1000, NOW)).toBe('hier');
  });

  it('renvoie "il y a 3 jours" pour 3 jours', () => {
    expect(formatRelativeTime(NOW - 3 * 24 * 60 * 60 * 1000, NOW)).toBe('il y a 3 jours');
  });

  it('renvoie "il y a 6 jours" pour 6 jours', () => {
    expect(formatRelativeTime(NOW - 6 * 24 * 60 * 60 * 1000, NOW)).toBe('il y a 6 jours');
  });

  it('renvoie une date courte FR pour 7+ jours (ex. "le 8 mars")', () => {
    expect(formatRelativeTime(NOW - 7 * 24 * 60 * 60 * 1000, NOW)).toBe('le 8 mars');
  });

  it('renvoie une date courte FR pour 30 jours', () => {
    // NOW = 15 mars 2026 ; -30j ≈ 13 fev 2026
    expect(formatRelativeTime(NOW - 30 * 24 * 60 * 60 * 1000, NOW)).toBe('le 13 févr.');
  });

  it('gere les mois avec accent (août, décembre)', () => {
    // 1er août 2025
    const aug1 = new Date('2025-08-01T12:00:00Z').getTime();
    expect(formatRelativeTime(aug1, NOW)).toBe('le 1 août');
    // 20 déc 2025
    const dec20 = new Date('2025-12-20T12:00:00Z').getTime();
    expect(formatRelativeTime(dec20, NOW)).toBe('le 20 déc.');
  });
});

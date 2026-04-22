import { describe, it, expect } from 'vitest';
import { articleDevant, buildLineage } from './lineage';
import type { Member, MemberDict } from './types';

function mk(id: string, over: Partial<Member> = {}): Member {
  return {
    id, name: id, first_name: null, alias: null, gender: 'M', generation: 0,
    father_id: null, mother_ref: null, spouses: [], children: [],
    photo_url: null, note: null, birth_city: null, birth_country: null, village: null,
    ...over,
  };
}

describe('articleDevant', () => {
  it('returns "de " before a consonant', () => {
    expect(articleDevant('Mamadou')).toBe('de ');
    expect(articleDevant('Bakary')).toBe('de ');
    expect(articleDevant('Fatou')).toBe('de ');
  });

  it('returns "d\'" before a vowel', () => {
    expect(articleDevant('Alkamahamane')).toBe("d'");
    expect(articleDevant('Issa')).toBe("d'");
    expect(articleDevant('Omar')).toBe("d'");
    expect(articleDevant('Yacouba')).toBe("d'");
  });

  it('returns "d\'" before H (muet par défaut dans le corpus songhay)', () => {
    expect(articleDevant('Hamatou')).toBe("d'");
    expect(articleDevant('Haoua')).toBe("d'");
  });

  it('handles accented vowels', () => {
    expect(articleDevant('Émile')).toBe("d'");
    expect(articleDevant('Ïmane')).toBe("d'");
  });
});

describe('buildLineage', () => {
  it('returns empty when no relations', () => {
    const m = mk('alice');
    expect(buildLineage(m, { alice: m })).toBe('');
  });

  it('adds "Fils de X" when father has consonant initial', () => {
    const f = mk('mamadou', { name: 'Mamadou' });
    const m = mk('ali', { name: 'Ali', father_id: 'mamadou' });
    expect(buildLineage(m, { mamadou: f, ali: m })).toBe('Fils de Mamadou');
  });

  it('adds "Fils d\'X" with elision when father starts with vowel', () => {
    const f = mk('omar', { name: 'Omar' });
    const m = mk('ali', { name: 'Ali', father_id: 'omar' });
    expect(buildLineage(m, { omar: f, ali: m })).toBe("Fils d'Omar");
  });

  it('uses "Fille de" / "Fille d\'" for female', () => {
    const f = mk('omar', { name: 'Omar' });
    const m = mk('amina', { name: 'Amina', gender: 'F', father_id: 'omar' });
    expect(buildLineage(m, { omar: f, amina: m })).toBe("Fille d'Omar");
  });

  it('adds grandfather with elision when applicable', () => {
    const gf = mk('alkamahamane', { name: 'Alkamahamane' });
    const f = mk('omar', { name: 'Omar', father_id: 'alkamahamane' });
    const m = mk('ali', { name: 'Ali', father_id: 'omar' });
    expect(buildLineage(m, { alkamahamane: gf, omar: f, ali: m })).toBe(
      "Fils d'Omar, petit-fils d'Alkamahamane",
    );
  });

  it('stops at maxAncestors', () => {
    const gggf = mk('ggg', { name: 'Grand3' });
    const ggf = mk('gg', { name: 'Grand2', father_id: 'ggg' });
    const gf = mk('g', { name: 'Grand1', father_id: 'gg' });
    const f = mk('f', { name: 'Father', father_id: 'g' });
    const m = mk('me', { name: 'Me', father_id: 'f' });
    const dict: MemberDict = { ggg: gggf, gg: ggf, g: gf, f, me: m };
    // Default maxAncestors=3 → father + grand + arrière-grand (pas plus)
    const result = buildLineage(m, dict);
    expect(result).toContain('Fils de Father');
    expect(result).toContain('petit-fils de Grand1');
    expect(result).toContain('arrière-petit-fils de Grand2');
    expect(result).not.toContain('Grand3');
  });

  it('lists spouses joined with et', () => {
    const s1 = mk('fatou', { name: 'Fatou', gender: 'F' });
    const s2 = mk('awa', { name: 'Awa', gender: 'F' });
    const s3 = mk('aicha', { name: 'Aicha', gender: 'F' });
    const m = mk('ali', { name: 'Ali', spouses: ['fatou', 'awa', 'aicha'] });
    const dict: MemberDict = { ali: m, fatou: s1, awa: s2, aicha: s3 };
    expect(buildLineage(m, dict)).toBe('époux de Fatou, Awa et Aicha');
  });

  it('uses "épouse d\'" for female with single spouse (elision)', () => {
    const s = mk('alkamahamane', { name: 'Alkamahamane' });
    const m = mk('fatou', { name: 'Fatou', gender: 'F', spouses: ['alkamahamane'] });
    expect(buildLineage(m, { alkamahamane: s, fatou: m })).toBe(
      "épouse d'Alkamahamane",
    );
  });

  it('excludes a given spouse ID via options.excludeSpouseId', () => {
    const s1 = mk('fatou', { name: 'Fatou', gender: 'F' });
    const s2 = mk('awa', { name: 'Awa', gender: 'F' });
    const m = mk('ali', { name: 'Ali', spouses: ['fatou', 'awa'] });
    const dict: MemberDict = { ali: m, fatou: s1, awa: s2 };
    // On exclut Fatou car elle est affichée à côté dans la section Parents.
    expect(buildLineage(m, dict, { excludeSpouseId: 'fatou' })).toBe(
      "époux d'Awa",
    );
  });

  it('omits the spouse segment entirely when only excluded spouse exists', () => {
    const s = mk('fatou', { name: 'Fatou', gender: 'F' });
    const m = mk('ali', { name: 'Ali', spouses: ['fatou'] });
    const dict: MemberDict = { ali: m, fatou: s };
    expect(buildLineage(m, dict, { excludeSpouseId: 'fatou' })).toBe('');
  });

  it('combines all segments with elision', () => {
    const gf = mk('alkamahamane', { name: 'Alkamahamane' });
    const f = mk('omar', { name: 'Omar', father_id: 'alkamahamane' });
    const sp = mk('fatou', { name: 'Fatou', gender: 'F' });
    const m = mk('ali', { name: 'Ali', father_id: 'omar', spouses: ['fatou'] });
    const dict: MemberDict = { alkamahamane: gf, omar: f, ali: m, fatou: sp };
    expect(buildLineage(m, dict)).toBe(
      "Fils d'Omar, petit-fils d'Alkamahamane, époux de Fatou",
    );
  });
});

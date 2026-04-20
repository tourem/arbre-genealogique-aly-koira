// react-app/src/lib/parenteSonghay/index.test.ts
import { describe, it, expect } from 'vitest';
import { computeRelations } from './index';
import { makeTestFamily } from './fixtures/testFamily';
import type { Member, MemberDict } from '../types';

function toMemberDict(dict: ReturnType<typeof makeTestFamily>): MemberDict {
  const out: MemberDict = {};
  for (const id of Object.keys(dict)) {
    const p = dict[id];
    out[id] = {
      id: p.id, name: p.name, first_name: null, alias: null,
      gender: p.sex, generation: 0,
      father_id: p.fatherId, mother_ref: p.motherId,
      spouses: [], children: [], photo_url: null, note: null,
      birth_city: null, birth_country: null, village: null,
    } as Member;
  }
  return out;
}

function mkMember(
  id: string,
  name: string,
  gender: 'M' | 'F',
  fatherId: string | null,
  motherId: string | null,
  spouses: string[] = [],
): Member {
  return {
    id, name, first_name: null, alias: null,
    gender, generation: 0,
    father_id: fatherId, mother_ref: motherId,
    spouses, children: [], photo_url: null, note: null,
    birth_city: null, birth_country: null, village: null,
  };
}

const members = toMemberDict(makeTestFamily());

function firstTerms(idA: string, idB: string) {
  const r = computeRelations(idA, idB, members);
  if (r.kind !== 'relations') throw new Error(`expected relations, got ${r.kind}`);
  return { termA: r.relations[0].termForA, termB: r.relations[0].termForB, relations: r.relations };
}

describe('computeRelations — Cas de test du spec', () => {
  it('Modibo ↔ Hadja → arma / woyma', () => {
    const { termA, termB } = firstTerms('modibo', 'hadja');
    expect(termA).toBe('arma');
    expect(termB).toBe('woyma');
  });

  it('Bakary ↔ Adama → arma / arma', () => {
    const { termA, termB } = firstTerms('bakary', 'adama');
    expect(termA).toBe('arma');
    expect(termB).toBe('arma');
  });

  it('Drissa ↔ Awa → arma / woyma', () => {
    const { termA, termB } = firstTerms('drissa', 'awa');
    expect(termA).toBe('arma');
    expect(termB).toBe('woyma');
  });

  it('Sira ↔ Modibo → gna / izé', () => {
    const { termA, termB } = firstTerms('sira', 'modibo');
    expect(termA).toBe('gna');
    expect(termB).toBe('izé');
  });

  it('Modibo ↔ Sékou → baba / izé', () => {
    const { termA, termB } = firstTerms('modibo', 'sekou');
    expect(termA).toBe('baba');
    expect(termB).toBe('izé');
  });

  it('Sira ↔ Sékou → kaga woy coté baba / haama', () => {
    const { termA, termB } = firstTerms('sira', 'sekou');
    expect(termA).toBe('kaga woy coté baba');
    expect(termB).toBe('haama');
  });

  it('Sira ↔ Bakary → kaga kaga woy coté baba / haama haama', () => {
    const { termA, termB } = firstTerms('sira', 'bakary');
    expect(termA).toBe('kaga kaga woy coté baba');
    expect(termB).toBe('haama haama');
  });

  it('Modibo ↔ Lassana → kaga kaga arou coté baba / haama haama', () => {
    const { termA, termB } = firstTerms('modibo', 'lassana');
    expect(termA).toBe('kaga kaga arou coté baba');
    expect(termB).toBe('haama haama');
  });

  it('Sira ↔ Boubou → kaga×5 coté baba / haama×5', () => {
    const { termA, termB } = firstTerms('sira', 'boubou');
    expect(termA).toBe('kaga kaga kaga kaga kaga woy coté baba');
    expect(termB).toBe('haama haama haama haama haama');
  });

  it('Bakary ↔ Cheick returns ≥2 relations, first = hassa/touba via Sékou', () => {
    const r = computeRelations('bakary', 'cheick', members);
    if (r.kind !== 'relations') throw new Error();
    expect(r.relations.length).toBeGreaterThanOrEqual(2);
    expect(r.relations[0].termForA).toBe('hassa');
    expect(r.relations[0].termForB).toBe('touba');
    expect(r.relations[0].viaName).toBe('Sékou');
    expect(r.relations[1].termForA).toBe('arma');
    expect(r.relations[1].termForB).toBe('arma');
    expect(r.relations[1].viaName).toBe('Sira');
  });

  it('Djéneba ↔ Lassana → hawa / izé', () => {
    const { termA, termB } = firstTerms('djeneba', 'lassana');
    expect(termA).toBe('hawa');
    expect(termB).toBe('izé');
  });

  it('Bakary ↔ Koniba → arma / arma', () => {
    const { termA, termB } = firstTerms('bakary', 'koniba');
    expect(termA).toBe('arma');
    expect(termB).toBe('arma');
  });

  it('Soumaïla ↔ Aïssata → arma / woyma', () => {
    const { termA, termB } = firstTerms('soumaila', 'aissata');
    expect(termA).toBe('arma');
    expect(termB).toBe('woyma');
  });

  it('Boubou ↔ Néné → arma / woyma', () => {
    const { termA, termB } = firstTerms('boubou', 'nene');
    expect(termA).toBe('arma');
    expect(termB).toBe('woyma');
  });

  it('returns no-link when no common ancestor', () => {
    const extraMembers: MemberDict = {
      ...members,
      stranger: {
        ...members.sira, id: 'stranger', name: 'Stranger',
        father_id: null, mother_ref: null,
      },
    };
    const r = computeRelations('stranger', 'bakary', extraMembers);
    expect(r.kind).toBe('no-link');
  });

  it('Khadidia ↔ Niamoye → izé / gna', () => {
    const { termA, termB } = firstTerms('khadidia', 'niamoye');
    expect(termA).toBe('izé');
    expect(termB).toBe('gna');
  });

  it('Khadidia ↔ Mariam → woyma / woyma', () => {
    const { termA, termB } = firstTerms('khadidia', 'mariam');
    expect(termA).toBe('woyma');
    expect(termB).toBe('woyma');
  });

  it('Khadidia ↔ Djéneba → baassa woy / baassa woy', () => {
    const { termA, termB } = firstTerms('khadidia', 'djeneba');
    expect(termA).toBe('baassa woy');
    expect(termB).toBe('baassa woy');
  });

  it('returns same-person when idA === idB', () => {
    const r = computeRelations('sira', 'sira', members);
    expect(r).toEqual({ kind: 'same-person' });
  });
});

describe('computeRelations — dedup via couple marié', () => {
  it('merges duplicate relations coming from husband and wife of the same couple', () => {
    // Fixture : un couple Omar+Amina avec 2 enfants Ali et Bintou.
    // Ali a un fils Salif, Bintou a une fille Aya.
    // Salif ↔ Aya devraient être baassa (cousins croisés) via UN seul lien
    //   (pas deux : via Omar ET via Amina).
    const synthMembers: MemberDict = {
      omar:  mkMember('omar',  'Omar',  'M', null, null, ['amina']),
      amina: mkMember('amina', 'Amina', 'F', null, null, ['omar']),
      ali:    mkMember('ali',    'Ali',    'M', 'omar', 'amina', []),
      bintou: mkMember('bintou', 'Bintou', 'F', 'omar', 'amina', []),
      salif:  mkMember('salif',  'Salif',  'M', 'ali', null, []),
      aya:    mkMember('aya',    'Aya',    'F', null, 'bintou', []),
    };
    const r = computeRelations('salif', 'aya', synthMembers);
    if (r.kind !== 'relations') throw new Error('expected relations');
    // SANS dedup couple: 2 relations baassa (via Omar via Amina).
    // AVEC dedup couple: 1 seule relation.
    expect(r.relations).toHaveLength(1);
    // Salif♂ père Ali♂, Aya♀ mère Bintou♀ → parents sexes opposés → cross → baassa
    expect(r.relations[0].termForA).toBe('baassa arou');
    expect(r.relations[0].termForB).toBe('baassa woy');
    // NEW assertions: viaSpouse must reference the OTHER LCA of the couple
    const rel = r.relations[0];
    expect(rel.viaSpouse).toBeDefined();
    // The kept via is either omar or amina; viaSpouse must be the other one.
    const ids = [rel.via, rel.viaSpouse!.id].sort();
    expect(ids).toEqual(['amina', 'omar']);
  });

  it('does NOT merge relations when the two LCAs are not spouses', () => {
    // Fixture : même pattern mais Omar et Amina ne sont PAS spouses.
    // (Ils sont tous deux parents des mêmes enfants Ali/Bintou — situation rare
    // mais possible dans une base imparfaite.)
    // On attend alors 2 relations distinctes (pas de dedup).
    const synthMembers: MemberDict = {
      omar:  mkMember('omar',  'Omar',  'M', null, null, []),  // PAS marié à amina
      amina: mkMember('amina', 'Amina', 'F', null, null, []),  // PAS mariée à omar
      ali:    mkMember('ali',    'Ali',    'M', 'omar', 'amina', []),
      bintou: mkMember('bintou', 'Bintou', 'F', 'omar', 'amina', []),
      salif:  mkMember('salif',  'Salif',  'M', 'ali', null, []),
      aya:    mkMember('aya',    'Aya',    'F', null, 'bintou', []),
    };
    const r = computeRelations('salif', 'aya', synthMembers);
    if (r.kind !== 'relations') throw new Error('expected relations');
    expect(r.relations.length).toBe(2);
  });
});

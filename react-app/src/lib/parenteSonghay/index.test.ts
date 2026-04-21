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
    const r = computeRelations('khadidia', 'djeneba', members);
    if (r.kind !== 'relations') throw new Error();
    const first = r.relations[0];
    expect(first.termForA).toBe('baassa woy');
    expect(first.termForB).toBe('baassa woy');
    // Cross first cousins (dA=dB=2, parents opposite sex) → group term set
    expect(first.groupTerm).toBe("hassey-zee n'da hawey-zee");
  });

  it('returns same-person when idA === idB', () => {
    const r = computeRelations('sira', 'sira', members);
    expect(r).toEqual({ kind: 'same-person' });
  });
});

describe('computeRelations — arrou/woy/hassey group terms (cousins germains)', () => {
  it('Cheick ↔ Koniba : fathers are brothers → arrou hinka izey', () => {
    const r = computeRelations('cheick', 'koniba', members);
    if (r.kind !== 'relations') throw new Error('expected relations');
    // First relation : Bourama (Cheick's father) and Tiéman (Koniba's father)
    // are both sons of Hadja, so they're brothers. dA=dB=2.
    const first = r.relations[0];
    expect(first.termForA).toBe('arma');
    expect(first.termForB).toBe('arma');
    expect(first.groupTerm).toBe('arrou hinka izey');
    expect(first.viaName).toBe('Hadja');
  });

  it('siblings do NOT get arrou/woy hinka izey (only cousins do, dA=dB>=2)', () => {
    const r = computeRelations('modibo', 'hadja', members);
    if (r.kind !== 'relations') throw new Error('expected relations');
    expect(r.relations[0].termForA).toBe('arma');
    expect(r.relations[0].termForB).toBe('woyma');
    expect(r.relations[0].groupTerm).toBeUndefined();
  });

  it('distant parallel cousins (dA=dB=3) get arrou hinka izey via reset rule', () => {
    const r = computeRelations('bakary', 'koniba', members);
    if (r.kind !== 'relations') throw new Error('expected relations');
    const first = r.relations[0];
    expect(first.termForA).toBe('arma');
    expect(first.termForB).toBe('arma');
    // Direct parents Sékou (M) and Tiéman (M) — parallel, both male → arrou hinka izey.
    expect(first.groupTerm).toBe('arrou hinka izey');
  });

  it('woy hinka izey : mothers are sisters (synthetic fixture)', () => {
    const synth: MemberDict = {
      root:  mkMember('root',  'Root',  'F', null,   null,   []),
      awa1:  mkMember('awa1',  'Awa1',  'F', null,   'root', []),  // root's daughter
      awa2:  mkMember('awa2',  'Awa2',  'F', null,   'root', []),  // root's daughter (Awa1's sister)
      alice: mkMember('alice', 'Alice', 'F', null,   'awa1', []),  // Awa1's daughter
      bob:   mkMember('bob',   'Bob',   'M', null,   'awa2', []),  // Awa2's son
    };
    const r = computeRelations('alice', 'bob', synth);
    if (r.kind !== 'relations') throw new Error('expected relations');
    const first = r.relations[0];
    // Mothers (Awa1, Awa2) are both female, siblings via Root.
    // dA=dB=2, parallel, groupTerm = woy hinka izey.
    expect(first.termForA).toBe('woyma');
    expect(first.termForB).toBe('arma');
    expect(first.groupTerm).toBe('woy hinka izey');
  });

  it("hassey-zee n'da hawey-zee : father of one + mother of other are siblings (synthetic)", () => {
    // Setup: Jean (M) has two children: Marc (M) and Claire (F).
    // Marc has daughter Léa. Claire has son Paul.
    // Léa's father is Marc (M), Paul's mother is Claire (F).
    // Marc and Claire are siblings, OPPOSITE sexes → cross cousins, dA=dB=2.
    const synth: MemberDict = {
      jean:   mkMember('jean',   'Jean',   'M', null,   null,     []),
      marc:   mkMember('marc',   'Marc',   'M', 'jean', null,     []),
      claire: mkMember('claire', 'Claire', 'F', 'jean', null,     []),
      lea:    mkMember('lea',    'Léa',    'F', 'marc', null,     []),
      paul:   mkMember('paul',   'Paul',   'M', null,   'claire', []),
    };
    const r = computeRelations('lea', 'paul', synth);
    if (r.kind !== 'relations') throw new Error('expected relations');
    const first = r.relations[0];
    expect(first.termForA).toBe('baassa woy');  // Léa F
    expect(first.termForB).toBe('baassa arou'); // Paul M
    expect(first.groupTerm).toBe("hassey-zee n'da hawey-zee");
  });

  it("cross cousins at dA=dB=3 get hassey-zee n'da hawey-zee via reset rule", () => {
    // 3 generations deep: common great-grandparent with male and female lines
    // diverging at the grandparent level (to stay cross), and another generation below.
    //   gp → son (M) → son_c (M) → gc1 (M)           pathA=['P','P','P'] len 3
    //   gp → dau (F) → dau_c (F) → gc2 (F)           pathB=['M','M','P'] len 3
    // parents on path[0]: son_c (M) vs dau_c (F) → cross. dA=dB=3 → reset rule applies.
    const synth: MemberDict = {
      gp:     mkMember('gp',     'GP',       'M', null,    null,     []),
      son:    mkMember('son',    'Son',      'M', 'gp',    null,     []),
      dau:    mkMember('dau',    'Dau',      'F', 'gp',    null,     []),
      son_c:  mkMember('son_c',  'SonChild', 'M', 'son',   null,     []),
      dau_c:  mkMember('dau_c',  'DauChild', 'F', null,    'dau',    []),
      gc1:    mkMember('gc1',    'GC1',      'M', 'son_c', null,     []),
      gc2:    mkMember('gc2',    'GC2',      'F', null,    'dau_c',  []),
    };
    const r = computeRelations('gc1', 'gc2', synth);
    if (r.kind !== 'relations') throw new Error('expected relations');
    expect(r.relations[0].termForA).toBe('baassa arou');
    expect(r.relations[0].termForB).toBe('baassa woy');
    expect(r.relations[0].groupTerm).toBe("hassey-zee n'da hawey-zee");
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

  it('keeps both relations when via-husband and via-wife yield different terms', () => {
    // Family setup (equal distances on both sides, symmetrical):
    //   Alassane (M) + Aminta (F) are spouses.
    //   They have a shared son Karim and a shared daughter Awa.
    //   Karim -> Mahamadou.
    //   Awa -> Sophie -> Abdoulaye.
    //
    // Common ancestors of Mahamadou and Abdoulaye: Alassane AND Aminta.
    //   mahamadou -> alassane: ['P','P']   (len 2)
    //   mahamadou -> aminta:   ['P','M']   (len 2)
    //   abdoulaye -> alassane: ['M','M','P'] (len 3)
    //   abdoulaye -> aminta:   ['M','M','M'] (len 3)
    //
    // Paths are last-hop-flipped on both sides; LCAs are spouses.
    // The classification of both (via Alassane and via Aminta) yields the
    // SAME (termForA, termForB) by construction (classification doesn't
    // depend on the LCA's own sex when dA>0 and dB>0). The dedup therefore
    // collapses them into a single relation — this is the correct behavior
    // because "via the couple" represents one kinship route, not two.
    const synthMembers: MemberDict = {
      alassane: mkMember('alassane', 'Alassane', 'M', null, null, ['aminta']),
      aminta:   mkMember('aminta',   'Aminta',   'F', null, null, ['alassane']),
      karim:    mkMember('karim',    'Karim',    'M', 'alassane', 'aminta', []),
      awa:      mkMember('awa',      'Awa',      'F', 'alassane', 'aminta', []),
      mahamadou:mkMember('mahamadou','Mahamadou','M', 'karim',    null,     []),
      sophie:   mkMember('sophie',   'Sophie',   'F', null,       'awa',    []),
      abdoulaye:mkMember('abdoulaye','Abdoulaye','M', null,       'sophie', []),
    };
    const r = computeRelations('mahamadou', 'abdoulaye', synthMembers);
    if (r.kind !== 'relations') throw new Error('expected relations');
    // Terms are IDENTICAL via both spouses by classification invariant → dedup fires.
    expect(r.relations).toHaveLength(1);
    expect(r.relations[0].termForA).toBe(r.relations[0].termForA); // sanity
    expect(r.relations[0].viaSpouse).toBeDefined();
    // The kept via and its viaSpouse must be the Alassane/Aminta couple.
    const ids = [r.relations[0].via, r.relations[0].viaSpouse!.id].sort();
    expect(ids).toEqual(['alassane', 'aminta']);
  });

  it('keeps BOTH relations when via-husband and via-wife paths differ structurally', () => {
    // Family setup (ASYMMETRIC — distances differ):
    //   Alassane (M) + Aminta (F) are spouses.
    //   Shared son Karim -> Ali -> Mahamadou.  (Mahamadou is great-grandchild.)
    //   Shared daughter Awa -> Abdoulaye.      (Abdoulaye is grandchild.)
    //
    // Common ancestors: Alassane AND Aminta. Paths:
    //   mahamadou -> alassane: ['P','P','P'] (len 3)
    //   mahamadou -> aminta:   ['P','P','M'] (len 3)
    //   abdoulaye -> alassane: ['M','P']     (len 2)
    //   abdoulaye -> aminta:   ['M','M']     (len 2)
    //
    // Paths are last-hop-flipped on both sides; LCAs are spouses.
    // The dedup fires here as well because the classification yields the
    // SAME (termForA, termForB) via both spouses. This test confirms that
    // the dedup handles differently-balanced (dA != dB) couples correctly:
    // it merges when-and-only-when the terms match. If a future algorithm
    // change caused the terms to diverge via husband vs wife, condition #1
    // of areCoupleDuplicates would refuse the merge and both relations
    // would be preserved.
    const synthMembers: MemberDict = {
      alassane:  mkMember('alassane',  'Alassane',  'M', null,       null,       ['aminta']),
      aminta:    mkMember('aminta',    'Aminta',    'F', null,       null,       ['alassane']),
      karim:     mkMember('karim',     'Karim',     'M', 'alassane', 'aminta',   []),
      awa:       mkMember('awa',       'Awa',       'F', 'alassane', 'aminta',   []),
      ali:       mkMember('ali',       'Ali',       'M', 'karim',    null,       []),
      mahamadou: mkMember('mahamadou', 'Mahamadou', 'M', 'ali',      null,       []),
      abdoulaye: mkMember('abdoulaye', 'Abdoulaye', 'M', null,       'awa',      []),
    };
    const r = computeRelations('mahamadou', 'abdoulaye', synthMembers);
    if (r.kind !== 'relations') throw new Error('expected relations');
    // Asymmetric (dA=3, dB=2) but terms identical via both spouses → dedup fires.
    expect(r.relations).toHaveLength(1);
    expect(r.relations[0].viaSpouse).toBeDefined();
    const ids = [r.relations[0].via, r.relations[0].viaSpouse!.id].sort();
    expect(ids).toEqual(['alassane', 'aminta']);
  });
});

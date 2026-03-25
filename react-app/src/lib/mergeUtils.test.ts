import { describe, it, expect } from 'vitest';
import type { Member, MemberDict, MergeHistory } from './types';
import {
  getMemberRelations,
  filterActiveMembersDict,
  detectConflicts,
  computeMergeChanges,
  computeMergeResult,
  createMemberSnapshot,
  createMergeSnapshot,
  computeMergeImpact,
  getDaysRemaining,
  canRevertMerge,
} from './mergeUtils';

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

function createMember(overrides: Partial<Member> & { id: string; name: string }): Member {
  return {
    gender: 'M',
    generation: 3,
    father_id: null,
    mother_ref: null,
    first_name: null,
    alias: null,
    spouses: [],
    children: [],
    photo_url: null,
    note: null,
    birth_city: null,
    birth_country: null,
    village: null,
    ...overrides,
  };
}

// Sample family tree:
// Generation 1: Ali Koira (patriarch)
// Generation 2: Moussa (son of Ali) + Fati (wife of Moussa)
// Generation 3: Jato, Jeto (sons of Moussa & Fati), Aminata (daughter)
// Generation 4: Ibrahima (son of Jato)

function createSampleFamily(): MemberDict {
  const ali = createMember({
    id: 'ali_koira',
    name: 'Ali Koira',
    generation: 1,
    children: ['moussa_ali'],
  });

  const moussa = createMember({
    id: 'moussa_ali',
    name: 'Moussa Ali',
    generation: 2,
    father_id: 'ali_koira',
    spouses: ['fati_moussa'],
    children: ['jato_moussa', 'jeto_moussa', 'aminata_moussa'],
  });

  const fati = createMember({
    id: 'fati_moussa',
    name: 'Fati',
    gender: 'F',
    generation: 2,
    spouses: ['moussa_ali'],
    children: ['jato_moussa', 'jeto_moussa', 'aminata_moussa'],
  });

  const jato = createMember({
    id: 'jato_moussa',
    name: 'Jato',
    generation: 3,
    father_id: 'moussa_ali',
    mother_ref: 'fati_moussa',
    spouses: ['aissa_jato'],
    children: ['ibrahima_jato'],
  });

  const jeto = createMember({
    id: 'jeto_moussa',
    name: 'Jeto',
    generation: 3,
    father_id: 'moussa_ali',
    mother_ref: 'fati_moussa',
    spouses: ['mariama_jeto'],
    children: ['hamidou_jeto'],
    note: 'Premier fils',
  });

  const aminata = createMember({
    id: 'aminata_moussa',
    name: 'Aminata',
    gender: 'F',
    generation: 3,
    father_id: 'moussa_ali',
    mother_ref: 'fati_moussa',
  });

  const aissa = createMember({
    id: 'aissa_jato',
    name: 'Aissa',
    gender: 'F',
    generation: 3,
    spouses: ['jato_moussa'],
  });

  const mariama = createMember({
    id: 'mariama_jeto',
    name: 'Mariama',
    gender: 'F',
    generation: 3,
    spouses: ['jeto_moussa'],
  });

  const ibrahima = createMember({
    id: 'ibrahima_jato',
    name: 'Ibrahima',
    generation: 4,
    father_id: 'jato_moussa',
  });

  const hamidou = createMember({
    id: 'hamidou_jeto',
    name: 'Hamidou',
    generation: 4,
    father_id: 'jeto_moussa',
  });

  return {
    ali_koira: ali,
    moussa_ali: moussa,
    fati_moussa: fati,
    jato_moussa: jato,
    jeto_moussa: jeto,
    aminata_moussa: aminata,
    aissa_jato: aissa,
    mariama_jeto: mariama,
    ibrahima_jato: ibrahima,
    hamidou_jeto: hamidou,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST: getMemberRelations
// ═══════════════════════════════════════════════════════════════════════════

describe('getMemberRelations', () => {
  const members = createSampleFamily();

  it('should return all relations for a member with parents, spouses and children', () => {
    const rels = getMemberRelations('jato_moussa', members);

    expect(rels.father?.id).toBe('moussa_ali');
    expect(rels.mother?.id).toBe('fati_moussa');
    expect(rels.spouses).toHaveLength(1);
    expect(rels.spouses[0].id).toBe('aissa_jato');
    expect(rels.children).toHaveLength(1);
    expect(rels.children[0].id).toBe('ibrahima_jato');
    expect(rels.totalCount).toBe(4); // father + mother + 1 spouse + 1 child
  });

  it('should handle member with no parents', () => {
    const rels = getMemberRelations('ali_koira', members);

    expect(rels.father).toBeNull();
    expect(rels.mother).toBeNull();
    expect(rels.children).toHaveLength(1);
    expect(rels.totalCount).toBe(1);
  });

  it('should handle member with no spouse or children', () => {
    const rels = getMemberRelations('aminata_moussa', members);

    expect(rels.spouses).toHaveLength(0);
    expect(rels.children).toHaveLength(0);
    expect(rels.totalCount).toBe(2); // just parents
  });

  it('should return empty relations for non-existent member', () => {
    const rels = getMemberRelations('non_existent', members);

    expect(rels.father).toBeNull();
    expect(rels.mother).toBeNull();
    expect(rels.spouses).toHaveLength(0);
    expect(rels.children).toHaveLength(0);
    expect(rels.totalCount).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: filterActiveMembersDict
// ═══════════════════════════════════════════════════════════════════════════

describe('filterActiveMembersDict', () => {
  it('should filter out merged members', () => {
    const members = createSampleFamily();
    members['jeto_moussa'].merged = true;
    members['jeto_moussa'].merged_into_id = 'jato_moussa';

    const active = filterActiveMembersDict(members);

    expect(Object.keys(active)).not.toContain('jeto_moussa');
    expect(Object.keys(active)).toContain('jato_moussa');
    expect(Object.keys(active)).toHaveLength(9); // 10 - 1 merged
  });

  it('should keep all members when none are merged', () => {
    const members = createSampleFamily();
    const active = filterActiveMembersDict(members);

    expect(Object.keys(active)).toHaveLength(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: detectConflicts
// ═══════════════════════════════════════════════════════════════════════════

describe('detectConflicts', () => {
  it('should detect gender conflict', () => {
    const members = createSampleFamily();
    // Try to merge a male with a female
    const conflicts = detectConflicts('jato_moussa', 'aminata_moussa', members);

    const genderConflict = conflicts.find((c) => c.title === 'Sexe différent');
    expect(genderConflict).toBeDefined();
    expect(genderConflict?.type).toBe('danger');
  });

  it('should detect generation conflict', () => {
    const members = createSampleFamily();
    // Add a member with different generation
    members['jeto_wrong_gen'] = createMember({
      id: 'jeto_wrong_gen',
      name: 'Jeto Wrong Gen',
      generation: 4, // Different from jato's gen 3
      father_id: 'moussa_ali',
      mother_ref: 'fati_moussa',
    });

    const conflicts = detectConflicts('jeto_wrong_gen', 'jato_moussa', members);

    const genConflict = conflicts.find((c) => c.title === 'Génération différente');
    expect(genConflict).toBeDefined();
    expect(genConflict?.type).toBe('warning');
  });

  it('should detect parents conflict', () => {
    const members = createSampleFamily();
    // Create a member with different parents
    members['other_person'] = createMember({
      id: 'other_person',
      name: 'Other Person',
      generation: 3,
      father_id: 'ali_koira', // Different father
      mother_ref: null,
    });

    const conflicts = detectConflicts('other_person', 'jato_moussa', members);

    const parentsConflict = conflicts.find((c) => c.title === 'Parents différents');
    expect(parentsConflict).toBeDefined();
    expect(parentsConflict?.type).toBe('warning');
  });

  it('should indicate transfers when there are new relations to add', () => {
    const members = createSampleFamily();
    // Jeto has Mariama as spouse and Hamidou as child
    // Jato has Aissa as spouse and Ibrahima as child
    // Merging should transfer Mariama and Hamidou to Jato

    const conflicts = detectConflicts('jeto_moussa', 'jato_moussa', members);

    const transferInfo = conflicts.find((c) => c.title === 'Transfert');
    expect(transferInfo).toBeDefined();
    expect(transferInfo?.type).toBe('info');
    expect(transferInfo?.message).toContain('1 conjoint');
    expect(transferInfo?.message).toContain('1 enfant');
  });

  it('should return no conflicts when members are similar', () => {
    const members = createSampleFamily();
    // Jato and Jeto are similar (same parents, same generation, same gender)

    const conflicts = detectConflicts('jeto_moussa', 'jato_moussa', members);

    // Should only have info about transfers, no danger or warning
    const dangerOrWarning = conflicts.filter(
      (c) => c.type === 'danger' || c.type === 'warning'
    );
    expect(dangerOrWarning).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: computeMergeChanges
// ═══════════════════════════════════════════════════════════════════════════

describe('computeMergeChanges', () => {
  it('should compute transfers for new spouses', () => {
    const members = createSampleFamily();
    const changes = computeMergeChanges('jeto_moussa', 'jato_moussa', members);

    // Mariama should be transferred
    const spouseTransfer = changes.spouses.find(
      (c) => c.type === 'transfer' && c.name === 'Mariama'
    );
    expect(spouseTransfer).toBeDefined();
    expect(changes.summary.transferred).toBeGreaterThan(0);
  });

  it('should compute transfers for new children', () => {
    const members = createSampleFamily();
    const changes = computeMergeChanges('jeto_moussa', 'jato_moussa', members);

    // Hamidou should be transferred
    const childTransfer = changes.children.find(
      (c) => c.type === 'transfer' && c.name === 'Hamidou'
    );
    expect(childTransfer).toBeDefined();
  });

  it('should identify same parents as unchanged', () => {
    const members = createSampleFamily();
    const changes = computeMergeChanges('jeto_moussa', 'jato_moussa', members);

    // Both have same parents (Moussa and Fati)
    const sameFather = changes.parents.find(
      (c) => c.type === 'same' && c.text.includes('Père identique')
    );
    const sameMother = changes.parents.find(
      (c) => c.type === 'same' && c.text.includes('Mère identique')
    );
    expect(sameFather).toBeDefined();
    expect(sameMother).toBeDefined();
  });

  it('should compute note transfer when source has note and target does not', () => {
    const members = createSampleFamily();
    // jeto has note "Premier fils", jato has no note
    const changes = computeMergeChanges('jeto_moussa', 'jato_moussa', members);

    const noteTransfer = changes.notes.find((c) => c.type === 'transfer');
    expect(noteTransfer).toBeDefined();
  });

  it('should identify note conflict when both have notes', () => {
    const members = createSampleFamily();
    members['jato_moussa'].note = 'A different note';

    const changes = computeMergeChanges('jeto_moussa', 'jato_moussa', members);

    const noteConflict = changes.notes.find((c) => c.type === 'conflict');
    expect(noteConflict).toBeDefined();
    expect(changes.summary.conflicts).toBeGreaterThan(0);
  });

  it('should compute summary totals correctly', () => {
    const members = createSampleFamily();
    const changes = computeMergeChanges('jeto_moussa', 'jato_moussa', members);

    // Should have: 2 same parents, 1 spouse transfer, 1 child transfer, 1 note transfer
    expect(changes.summary.transferred).toBe(3); // spouse + child + note
    expect(changes.summary.unchanged).toBe(2); // same father + same mother
    expect(changes.summary.conflicts).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: computeMergeResult
// ═══════════════════════════════════════════════════════════════════════════

describe('computeMergeResult', () => {
  it('should show merged spouses list', () => {
    const members = createSampleFamily();
    const result = computeMergeResult('jeto_moussa', 'jato_moussa', members);

    expect(result).not.toBeNull();
    // Should have Aissa (target's spouse) and Mariama (source's spouse)
    expect(result!.spouses).toHaveLength(2);
    expect(result!.spouses.map((s) => s.name).sort()).toEqual(['Aissa', 'Mariama']);
  });

  it('should show merged children list', () => {
    const members = createSampleFamily();
    const result = computeMergeResult('jeto_moussa', 'jato_moussa', members);

    expect(result).not.toBeNull();
    // Should have Ibrahima (target's child) and Hamidou (source's child)
    expect(result!.children).toHaveLength(2);
    expect(result!.children.map((c) => c.name).sort()).toEqual(['Hamidou', 'Ibrahima']);
  });

  it('should identify new spouses correctly', () => {
    const members = createSampleFamily();
    const result = computeMergeResult('jeto_moussa', 'jato_moussa', members);

    expect(result!.newSpouses).toHaveLength(1);
    expect(result!.newSpouses[0].name).toBe('Mariama');
  });

  it('should identify new children correctly', () => {
    const members = createSampleFamily();
    const result = computeMergeResult('jeto_moussa', 'jato_moussa', members);

    expect(result!.newChildren).toHaveLength(1);
    expect(result!.newChildren[0].name).toBe('Hamidou');
  });

  it('should preserve target\'s basic info', () => {
    const members = createSampleFamily();
    const result = computeMergeResult('jeto_moussa', 'jato_moussa', members);

    expect(result!.name).toBe('Jato');
    expect(result!.gender).toBe('M');
    expect(result!.generation).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: computeMergeImpact
// ═══════════════════════════════════════════════════════════════════════════

describe('computeMergeImpact', () => {
  it('should find children with source as father', () => {
    const members = createSampleFamily();
    const impact = computeMergeImpact('jeto_moussa', members);

    // Hamidou has Jeto as father
    expect(impact.childrenWithFather).toHaveLength(1);
    expect(impact.childrenWithFather[0].name).toBe('Hamidou');
  });

  it('should find members with source in spouses array', () => {
    const members = createSampleFamily();
    const impact = computeMergeImpact('jeto_moussa', members);

    // Mariama has Jeto in spouses
    expect(impact.membersWithSpouse).toHaveLength(1);
    expect(impact.membersWithSpouse[0].name).toBe('Mariama');
  });

  it('should calculate total references', () => {
    const members = createSampleFamily();
    const impact = computeMergeImpact('jeto_moussa', members);

    // 1 child with father (Hamidou), 0 child with mother, 1 member with spouse (Mariama),
    // 2 members with child (Moussa + Fati have jeto_moussa in their children[])
    expect(impact.totalReferences).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: createMemberSnapshot / createMergeSnapshot
// ═══════════════════════════════════════════════════════════════════════════

describe('createMemberSnapshot', () => {
  it('should capture member data and relations', () => {
    const members = createSampleFamily();
    const snapshot = createMemberSnapshot('jato_moussa', members);

    expect(snapshot).not.toBeNull();
    expect(snapshot!.member.id).toBe('jato_moussa');
    expect(snapshot!.member.name).toBe('Jato');
    expect(snapshot!.relations.father?.name).toBe('Moussa Ali');
    expect(snapshot!.relations.mother?.name).toBe('Fati');
    expect(snapshot!.relations.spouses).toHaveLength(1);
    expect(snapshot!.relations.children).toHaveLength(1);
  });

  it('should return null for non-existent member', () => {
    const members = createSampleFamily();
    const snapshot = createMemberSnapshot('non_existent', members);

    expect(snapshot).toBeNull();
  });
});

describe('createMergeSnapshot', () => {
  it('should capture both source and target snapshots', () => {
    const members = createSampleFamily();
    const snapshot = createMergeSnapshot('jeto_moussa', 'jato_moussa', members);

    expect(snapshot).not.toBeNull();
    expect(snapshot!.source.member.name).toBe('Jeto');
    expect(snapshot!.target.member.name).toBe('Jato');
    expect(snapshot!.mergedAt).toBeDefined();
  });

  it('should include timestamp', () => {
    const members = createSampleFamily();
    const before = new Date().toISOString();
    const snapshot = createMergeSnapshot('jeto_moussa', 'jato_moussa', members);
    const after = new Date().toISOString();

    expect(snapshot!.mergedAt >= before).toBe(true);
    expect(snapshot!.mergedAt <= after).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: getDaysRemaining
// ═══════════════════════════════════════════════════════════════════════════

describe('getDaysRemaining', () => {
  it('should return 30 for merge just performed', () => {
    const now = new Date().toISOString();
    const days = getDaysRemaining(now);

    expect(days).toBe(30);
  });

  it('should return 20 for merge performed 10 days ago', () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const days = getDaysRemaining(tenDaysAgo.toISOString());

    expect(days).toBe(20);
  });

  it('should return 0 for merge performed 30+ days ago', () => {
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

    const days = getDaysRemaining(thirtyOneDaysAgo.toISOString());

    expect(days).toBe(0);
  });

  it('should return 0 for very old merge', () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const days = getDaysRemaining(oneYearAgo.toISOString());

    expect(days).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: canRevertMerge
// ═══════════════════════════════════════════════════════════════════════════

describe('canRevertMerge', () => {
  const baseMergeHistory: MergeHistory = {
    id: 'merge-123',
    source_id: 'jeto_moussa',
    target_id: 'jato_moussa',
    performed_by: 'user-123',
    performed_at: new Date().toISOString(),
    reverted_at: null,
    reverted_by: null,
    status: 'ACTIVE',
    snapshot: {} as any,
    operations: [],
  };

  it('should allow revert for active merge within 30 days', () => {
    const result = canRevertMerge(baseMergeHistory);

    expect(result.canRevert).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should not allow revert for reverted merge', () => {
    const history: MergeHistory = {
      ...baseMergeHistory,
      status: 'REVERTED',
      reverted_at: new Date().toISOString(),
    };

    const result = canRevertMerge(history);

    expect(result.canRevert).toBe(false);
    expect(result.reason).toContain('déjà été annulée');
  });

  it('should not allow revert for expired merge', () => {
    const history: MergeHistory = {
      ...baseMergeHistory,
      status: 'EXPIRED',
    };

    const result = canRevertMerge(history);

    expect(result.canRevert).toBe(false);
    expect(result.reason).toContain('30 jours');
  });

  it('should not allow revert for active merge older than 30 days', () => {
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

    const history: MergeHistory = {
      ...baseMergeHistory,
      performed_at: thirtyOneDaysAgo.toISOString(),
    };

    const result = canRevertMerge(history);

    expect(result.canRevert).toBe(false);
    expect(result.reason).toContain('30 jours');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge cases', () => {
  it('should handle merging members with overlapping spouses', () => {
    const members = createSampleFamily();
    // Both Jato and Jeto are married to the same person (hypothetical)
    members['jeto_moussa'].spouses = ['aissa_jato']; // Same spouse as Jato

    const result = computeMergeResult('jeto_moussa', 'jato_moussa', members);

    // Should not duplicate Aissa
    expect(result!.spouses).toHaveLength(1);
    expect(result!.newSpouses).toHaveLength(0); // No new spouses
  });

  it('should handle merging members with overlapping children', () => {
    const members = createSampleFamily();
    // Both claim the same child (hypothetical)
    members['jeto_moussa'].children = ['ibrahima_jato'];

    const result = computeMergeResult('jeto_moussa', 'jato_moussa', members);

    // Should not duplicate Ibrahima
    expect(result!.children).toHaveLength(1);
    expect(result!.newChildren).toHaveLength(0);
  });

  it('should handle member with empty arrays', () => {
    const members = createSampleFamily();
    const rels = getMemberRelations('aminata_moussa', members);

    expect(rels.spouses).toHaveLength(0);
    expect(rels.children).toHaveLength(0);
  });

  it('should handle merge when source has null arrays', () => {
    const members = createSampleFamily();
    // @ts-ignore - testing edge case
    members['aminata_moussa'].spouses = null;
    // @ts-ignore
    members['aminata_moussa'].children = null;

    // Should not throw
    const impact = computeMergeImpact('aminata_moussa', members);
    expect(impact.totalReferences).toBeGreaterThanOrEqual(0);
  });
});

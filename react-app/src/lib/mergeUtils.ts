import type {
  Member,
  MemberDict,
  MergeSnapshot,
  MemberSnapshot,
  MergeOperation,
  MergeHistory,
} from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES LOCAUX
// ═══════════════════════════════════════════════════════════════════════════

export interface MemberRelations {
  father: Member | null;
  mother: Member | null;
  spouses: Member[];
  children: Member[];
  totalCount: number;
}

export interface MergeConflict {
  type: 'danger' | 'warning' | 'info';
  icon: string;
  title: string;
  message: string;
}

export interface ChangeItem {
  type: 'transfer' | 'same' | 'conflict';
  icon: string;
  text: string;
  name?: string;
}

export interface MergeChanges {
  parents: ChangeItem[];
  spouses: ChangeItem[];
  children: ChangeItem[];
  notes: ChangeItem[];
  summary: {
    transferred: number;
    conflicts: number;
    unchanged: number;
  };
}

export interface MergeResultPreview {
  name: string;
  gender: 'M' | 'F';
  generation: number;
  father: Member | null;
  mother: Member | null;
  spouses: Member[];
  children: Member[];
  newSpouses: Member[];
  newChildren: Member[];
}

export interface MergeImpact {
  childrenWithFather: Member[];
  childrenWithMother: Member[];
  membersWithSpouse: Member[];
  membersWithChild: Member[];
  totalReferences: number;
}

export interface MergeOptions {
  transferNote?: boolean;
  performedBy: string; // User ID
}

export interface PerformMergeResult {
  success: boolean;
  mergeHistoryId?: string;
  error?: string;
}

export interface RevertMergeResult {
  success: boolean;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all relations for a member (parents, spouses, children)
 */
export function getMemberRelations(
  memberId: string,
  members: MemberDict
): MemberRelations {
  const member = members[memberId];
  if (!member) {
    return { father: null, mother: null, spouses: [], children: [], totalCount: 0 };
  }

  const father = member.father_id ? members[member.father_id] || null : null;
  const mother = member.mother_ref ? members[member.mother_ref] || null : null;
  const spouses = (member.spouses || [])
    .map((id) => members[id])
    .filter(Boolean) as Member[];
  const children = (member.children || [])
    .map((id) => members[id])
    .filter(Boolean) as Member[];

  const totalCount =
    (father ? 1 : 0) + (mother ? 1 : 0) + spouses.length + children.length;

  return { father, mother, spouses, children, totalCount };
}

/**
 * Filter out merged members from a MemberDict
 */
export function filterActiveMembersDict(members: MemberDict): MemberDict {
  const result: MemberDict = {};
  for (const [id, member] of Object.entries(members)) {
    if (!member.merged) {
      result[id] = member;
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFLICTS DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect conflicts between source and target members
 */
export function detectConflicts(
  sourceId: string,
  targetId: string,
  members: MemberDict
): MergeConflict[] {
  const conflicts: MergeConflict[] = [];
  const source = members[sourceId];
  const target = members[targetId];

  if (!source || !target) return conflicts;

  // Gender conflict (danger)
  if (source.gender !== target.gender) {
    conflicts.push({
      type: 'danger',
      icon: '⛔',
      title: 'Sexe différent',
      message: `Le doublon est ${source.gender === 'F' ? 'une Femme' : 'un Homme'} mais l'original est ${target.gender === 'F' ? 'une Femme' : 'un Homme'}. Vérifiez !`,
    });
  }

  // Generation conflict (warning)
  if (source.generation !== target.generation) {
    conflicts.push({
      type: 'warning',
      icon: '⚠',
      title: 'Génération différente',
      message: `Gén. ${source.generation} vs Gén. ${target.generation}. Les doublons ont normalement la même génération.`,
    });
  }

  // Parents conflict (warning)
  const sourceRels = getMemberRelations(sourceId, members);
  const targetRels = getMemberRelations(targetId, members);

  const sameFather =
    (sourceRels.father?.id === targetRels.father?.id) ||
    (!sourceRels.father && !targetRels.father);
  const sameMother =
    (sourceRels.mother?.id === targetRels.mother?.id) ||
    (!sourceRels.mother && !targetRels.mother);

  if (!sameFather || !sameMother) {
    conflicts.push({
      type: 'warning',
      icon: '⚠',
      title: 'Parents différents',
      message: 'Les deux personnes n\'ont pas les mêmes parents.',
    });
  }

  // Info about transfers
  const spousesToTransfer = sourceRels.spouses.filter(
    (s) => !targetRels.spouses.some((ts) => ts.id === s.id)
  );
  const childrenToTransfer = sourceRels.children.filter(
    (c) => !targetRels.children.some((tc) => tc.id === c.id)
  );

  if (spousesToTransfer.length > 0 || childrenToTransfer.length > 0) {
    const parts: string[] = [];
    if (spousesToTransfer.length > 0) {
      parts.push(`${spousesToTransfer.length} conjoint${spousesToTransfer.length > 1 ? 's' : ''}`);
    }
    if (childrenToTransfer.length > 0) {
      parts.push(`${childrenToTransfer.length} enfant${childrenToTransfer.length > 1 ? 's' : ''}`);
    }
    conflicts.push({
      type: 'info',
      icon: 'ℹ',
      title: 'Transfert',
      message: `${parts.join(' et ')} du doublon seront transférés vers l'original.`,
    });
  }

  return conflicts;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHANGES PREVIEW
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute detailed changes that will happen during merge
 */
export function computeMergeChanges(
  sourceId: string,
  targetId: string,
  members: MemberDict
): MergeChanges {
  const source = members[sourceId];
  const target = members[targetId];
  const sourceRels = getMemberRelations(sourceId, members);
  const targetRels = getMemberRelations(targetId, members);

  const changes: MergeChanges = {
    parents: [],
    spouses: [],
    children: [],
    notes: [],
    summary: { transferred: 0, conflicts: 0, unchanged: 0 },
  };

  if (!source || !target) return changes;

  // Parents
  if (sourceRels.father && targetRels.father) {
    if (sourceRels.father.id === targetRels.father.id) {
      changes.parents.push({
        type: 'same',
        icon: '✓',
        text: `Père identique : ${sourceRels.father.name}`,
        name: sourceRels.father.name,
      });
      changes.summary.unchanged++;
    } else {
      changes.parents.push({
        type: 'conflict',
        icon: '⚠',
        text: `Père du doublon : ${sourceRels.father.name} ≠ Père de l'original : ${targetRels.father.name} — le père de l'original sera conservé`,
        name: targetRels.father.name,
      });
      changes.summary.conflicts++;
    }
  } else if (sourceRels.father && !targetRels.father) {
    changes.parents.push({
      type: 'transfer',
      icon: '↗',
      text: `${sourceRels.father.name} — sera transféré comme père de l'original`,
      name: sourceRels.father.name,
    });
    changes.summary.transferred++;
  } else if (!sourceRels.father && targetRels.father) {
    changes.parents.push({
      type: 'same',
      icon: '✓',
      text: `Père conservé : ${targetRels.father.name}`,
      name: targetRels.father.name,
    });
    changes.summary.unchanged++;
  }

  if (sourceRels.mother && targetRels.mother) {
    if (sourceRels.mother.id === targetRels.mother.id) {
      changes.parents.push({
        type: 'same',
        icon: '✓',
        text: `Mère identique : ${sourceRels.mother.name}`,
        name: sourceRels.mother.name,
      });
      changes.summary.unchanged++;
    } else {
      changes.parents.push({
        type: 'conflict',
        icon: '⚠',
        text: `Mère du doublon : ${sourceRels.mother.name} ≠ Mère de l'original : ${targetRels.mother.name} — la mère de l'original sera conservée`,
        name: targetRels.mother.name,
      });
      changes.summary.conflicts++;
    }
  } else if (sourceRels.mother && !targetRels.mother) {
    changes.parents.push({
      type: 'transfer',
      icon: '↗',
      text: `${sourceRels.mother.name} — sera transférée comme mère de l'original`,
      name: sourceRels.mother.name,
    });
    changes.summary.transferred++;
  } else if (!sourceRels.mother && targetRels.mother) {
    changes.parents.push({
      type: 'same',
      icon: '✓',
      text: `Mère conservée : ${targetRels.mother.name}`,
      name: targetRels.mother.name,
    });
    changes.summary.unchanged++;
  }

  // Spouses
  for (const spouse of sourceRels.spouses) {
    const alreadySpouse = targetRels.spouses.some((s) => s.id === spouse.id);
    if (alreadySpouse) {
      changes.spouses.push({
        type: 'same',
        icon: '✓',
        text: `${spouse.name} — déjà conjoint(e) de l'original`,
        name: spouse.name,
      });
      changes.summary.unchanged++;
    } else {
      changes.spouses.push({
        type: 'transfer',
        icon: '↗',
        text: `${spouse.name} — sera transféré(e) comme conjoint(e) de l'original`,
        name: spouse.name,
      });
      changes.summary.transferred++;
    }
  }

  // Children
  for (const child of sourceRels.children) {
    const alreadyChild = targetRels.children.some((c) => c.id === child.id);
    if (alreadyChild) {
      changes.children.push({
        type: 'same',
        icon: '✓',
        text: `${child.name} — déjà enfant de l'original`,
        name: child.name,
      });
      changes.summary.unchanged++;
    } else {
      changes.children.push({
        type: 'transfer',
        icon: '↗',
        text: `${child.name} — sera rattaché(e) comme enfant de l'original`,
        name: child.name,
      });
      changes.summary.transferred++;
    }
  }

  // Notes
  if (source.note && target.note) {
    changes.notes.push({
      type: 'conflict',
      icon: '⚠',
      text: `Les deux ont des notes — la note de l'original sera conservée`,
    });
    changes.summary.conflicts++;
  } else if (source.note && !target.note) {
    changes.notes.push({
      type: 'transfer',
      icon: '↗',
      text: `La note du doublon sera transférée`,
    });
    changes.summary.transferred++;
  } else {
    changes.notes.push({
      type: 'same',
      icon: '✓',
      text: `Aucune note sur le doublon — rien à transférer`,
    });
  }

  return changes;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULT PREVIEW
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the result after merge (what the target will look like)
 */
export function computeMergeResult(
  sourceId: string,
  targetId: string,
  members: MemberDict
): MergeResultPreview | null {
  const source = members[sourceId];
  const target = members[targetId];
  if (!source || !target) return null;

  const sourceRels = getMemberRelations(sourceId, members);
  const targetRels = getMemberRelations(targetId, members);

  const newSpouses = sourceRels.spouses.filter(
    (s) => !targetRels.spouses.some((ts) => ts.id === s.id)
  );
  const newChildren = sourceRels.children.filter(
    (c) => !targetRels.children.some((tc) => tc.id === c.id)
  );

  const finalSpouses = [...targetRels.spouses, ...newSpouses];
  const finalChildren = [...targetRels.children, ...newChildren];

  return {
    name: target.name,
    gender: target.gender,
    generation: target.generation,
    father: targetRels.father,
    mother: targetRels.mother,
    spouses: finalSpouses,
    children: finalChildren,
    newSpouses,
    newChildren,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MERGE IMPACT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the impact of merging sourceId into targetId
 */
export function computeMergeImpact(
  sourceId: string,
  members: MemberDict
): MergeImpact {
  const allMembers = Object.values(members);

  const childrenWithFather = allMembers.filter((m) => m.father_id === sourceId);
  const childrenWithMother = allMembers.filter((m) => m.mother_ref === sourceId);
  const membersWithSpouse = allMembers.filter((m) => m.spouses?.includes(sourceId));
  const membersWithChild = allMembers.filter((m) => m.children?.includes(sourceId));

  const totalReferences =
    childrenWithFather.length +
    childrenWithMother.length +
    membersWithSpouse.length +
    membersWithChild.length;

  return {
    childrenWithFather,
    childrenWithMother,
    membersWithSpouse,
    membersWithChild,
    totalReferences,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SNAPSHOT CREATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a snapshot of a member and their relations
 */
export function createMemberSnapshot(
  memberId: string,
  members: MemberDict
): MemberSnapshot | null {
  const member = members[memberId];
  if (!member) return null;

  const rels = getMemberRelations(memberId, members);

  return {
    member: { ...member },
    relations: {
      father: rels.father ? { id: rels.father.id, name: rels.father.name } : null,
      mother: rels.mother ? { id: rels.mother.id, name: rels.mother.name } : null,
      spouses: rels.spouses.map((s) => ({ id: s.id, name: s.name })),
      children: rels.children.map((c) => ({ id: c.id, name: c.name })),
    },
  };
}

/**
 * Create a complete merge snapshot (source + target before merge)
 */
export function createMergeSnapshot(
  sourceId: string,
  targetId: string,
  members: MemberDict
): MergeSnapshot | null {
  const sourceSnapshot = createMemberSnapshot(sourceId, members);
  const targetSnapshot = createMemberSnapshot(targetId, members);

  if (!sourceSnapshot || !targetSnapshot) return null;

  return {
    source: sourceSnapshot,
    target: targetSnapshot,
    mergedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFORM MERGE (with snapshot and soft delete)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Perform the merge operation with snapshot for rollback
 */
export async function performMerge(
  sourceId: string,
  targetId: string,
  options: MergeOptions,
  members: MemberDict,
  supabase: SupabaseClient
): Promise<PerformMergeResult> {
  const source = members[sourceId];
  const target = members[targetId];

  if (!source || !target) {
    return { success: false, error: 'Source or target member not found' };
  }

  if (source.merged) {
    return { success: false, error: 'Source member is already merged' };
  }

  if (target.merged) {
    return { success: false, error: 'Target member is already merged' };
  }

  // 1. Create snapshot BEFORE any changes
  const snapshot = createMergeSnapshot(sourceId, targetId, members);
  if (!snapshot) {
    return { success: false, error: 'Failed to create snapshot' };
  }

  const operations: MergeOperation[] = [];
  const impact = computeMergeImpact(sourceId, members);

  try {
    // 2. Merge children[] arrays with deduplication
    const mergedChildren = [
      ...new Set([...(target.children || []), ...(source.children || [])]),
    ].filter((id) => id !== targetId && id !== sourceId);

    await supabase
      .from('members')
      .update({ children: mergedChildren })
      .eq('id', targetId);

    // Log operations for new children
    for (const childId of source.children || []) {
      if (!target.children?.includes(childId)) {
        const child = members[childId];
        operations.push({
          type: 'TRANSFER',
          relationshipType: 'CHILD',
          description: `Enfant ${child?.name || childId} transféré`,
          personId: childId,
          personName: child?.name,
        });
      } else {
        const child = members[childId];
        operations.push({
          type: 'SKIP',
          relationshipType: 'CHILD',
          description: `Enfant ${child?.name || childId} déjà présent`,
          personId: childId,
          personName: child?.name,
        });
      }
    }

    // 3. Merge spouses[] arrays with deduplication
    const mergedSpouses = [
      ...new Set([...(target.spouses || []), ...(source.spouses || [])]),
    ].filter((id) => id !== targetId && id !== sourceId);

    await supabase
      .from('members')
      .update({ spouses: mergedSpouses })
      .eq('id', targetId);

    // Log operations for new spouses
    for (const spouseId of source.spouses || []) {
      if (!target.spouses?.includes(spouseId)) {
        const spouse = members[spouseId];
        operations.push({
          type: 'TRANSFER',
          relationshipType: 'SPOUSE',
          description: `Conjoint ${spouse?.name || spouseId} transféré`,
          personId: spouseId,
          personName: spouse?.name,
        });
      } else {
        const spouse = members[spouseId];
        operations.push({
          type: 'SKIP',
          relationshipType: 'SPOUSE',
          description: `Conjoint ${spouse?.name || spouseId} déjà présent`,
          personId: spouseId,
          personName: spouse?.name,
        });
      }
    }

    // 4. Update father_id references
    if (impact.childrenWithFather.length > 0) {
      await supabase
        .from('members')
        .update({ father_id: targetId })
        .eq('father_id', sourceId);

      for (const child of impact.childrenWithFather) {
        operations.push({
          type: 'TRANSFER',
          relationshipType: 'FATHER',
          description: `${child.name} : père mis à jour vers ${target.name}`,
          personId: child.id,
          personName: child.name,
        });
      }
    }

    // 5. Update mother_ref references
    if (impact.childrenWithMother.length > 0) {
      await supabase
        .from('members')
        .update({ mother_ref: targetId })
        .eq('mother_ref', sourceId);

      for (const child of impact.childrenWithMother) {
        operations.push({
          type: 'TRANSFER',
          relationshipType: 'MOTHER',
          description: `${child.name} : mère mise à jour vers ${target.name}`,
          personId: child.id,
          personName: child.name,
        });
      }
    }

    // 6. Replace source in spouses[] of other members
    for (const m of impact.membersWithSpouse) {
      const updatedSpouses = m.spouses
        .map((s) => (s === sourceId ? targetId : s))
        .filter((s) => s !== m.id);
      const dedupedSpouses = [...new Set(updatedSpouses)];

      await supabase
        .from('members')
        .update({ spouses: dedupedSpouses })
        .eq('id', m.id);
    }

    // 7. Replace source in children[] of other members
    for (const m of impact.membersWithChild) {
      const updatedChildren = m.children
        .map((c) => (c === sourceId ? targetId : c))
        .filter((c) => c !== m.id);
      const dedupedChildren = [...new Set(updatedChildren)];

      await supabase
        .from('members')
        .update({ children: dedupedChildren })
        .eq('id', m.id);
    }

    // 8. Transfer note if target has no note
    if (options.transferNote && source.note && !target.note) {
      await supabase
        .from('members')
        .update({ note: source.note })
        .eq('id', targetId);
    }

    // 9. SOFT DELETE source member (instead of hard delete)
    await supabase
      .from('members')
      .update({
        merged: true,
        merged_into_id: targetId,
        merged_at: new Date().toISOString(),
      })
      .eq('id', sourceId);

    // 10. Save merge history
    const { data: historyData, error: historyError } = await supabase
      .from('merge_history')
      .insert({
        source_id: sourceId,
        target_id: targetId,
        performed_by: options.performedBy,
        snapshot: snapshot,
        operations: operations,
        status: 'ACTIVE',
      })
      .select('id')
      .single();

    if (historyError) {
      console.error('Failed to save merge history:', historyError);
      // Don't fail the merge, but log the error
    }

    return {
      success: true,
      mergeHistoryId: historyData?.id,
    };
  } catch (error) {
    console.error('Merge failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REVERT MERGE (Rollback)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate days remaining for rollback
 */
export function getDaysRemaining(performedAt: string): number {
  const performed = new Date(performedAt);
  const now = new Date();
  const diffMs = now.getTime() - performed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, 30 - diffDays);
}

/**
 * Check if a merge can be reverted
 */
export function canRevertMerge(history: MergeHistory): { canRevert: boolean; reason?: string } {
  if (history.status !== 'ACTIVE') {
    return {
      canRevert: false,
      reason: history.status === 'REVERTED' ? 'Cette fusion a déjà été annulée' : 'La période d\'annulation de 30 jours est dépassée',
    };
  }

  const daysRemaining = getDaysRemaining(history.performed_at);
  if (daysRemaining <= 0) {
    return { canRevert: false, reason: 'La période d\'annulation de 30 jours est dépassée' };
  }

  return { canRevert: true };
}

/**
 * Revert a merge operation
 */
export async function revertMerge(
  mergeHistoryId: string,
  revertedBy: string,
  supabase: SupabaseClient
): Promise<RevertMergeResult> {
  // 1. Get the merge history
  const { data: history, error: fetchError } = await supabase
    .from('merge_history')
    .select('*')
    .eq('id', mergeHistoryId)
    .single();

  if (fetchError || !history) {
    return { success: false, error: 'Fusion non trouvée' };
  }

  // 2. Check if can revert
  const { canRevert, reason } = canRevertMerge(history as MergeHistory);
  if (!canRevert) {
    return { success: false, error: reason };
  }

  const snapshot = history.snapshot as MergeSnapshot;
  const sourceId = history.source_id;
  const targetId = history.target_id;

  try {
    // 3. Restore the source member (un-merge)
    const sourceData = snapshot.source.member;
    await supabase
      .from('members')
      .update({
        merged: false,
        merged_into_id: null,
        merged_at: null,
        // Restore original arrays
        spouses: sourceData.spouses,
        children: sourceData.children,
      })
      .eq('id', sourceId);

    // 4. Restore the target member to its original state
    const targetData = snapshot.target.member;
    await supabase
      .from('members')
      .update({
        spouses: targetData.spouses,
        children: targetData.children,
        note: targetData.note, // Restore original note
      })
      .eq('id', targetId);

    // 5. Restore father_id references
    // Find members who had source as father and restore
    const sourceRelations = snapshot.source.relations;
    if (sourceRelations.children.length > 0) {
      for (const child of sourceRelations.children) {
        // Check if this child had source as father
        const { data: childData } = await supabase
          .from('members')
          .select('father_id')
          .eq('id', child.id)
          .single();

        if (childData?.father_id === targetId) {
          // Restore to original father (source)
          await supabase
            .from('members')
            .update({ father_id: sourceId })
            .eq('id', child.id);
        }
      }
    }

    // 6. Restore spouses references
    // For each spouse of source that was transferred to target, restore
    for (const spouse of sourceRelations.spouses) {
      const { data: spouseData } = await supabase
        .from('members')
        .select('spouses')
        .eq('id', spouse.id)
        .single();

      if (spouseData) {
        let spousesList = spouseData.spouses || [];
        // Remove target from spouse's spouses list if it was added during merge
        if (spousesList.includes(targetId) && !snapshot.target.relations.spouses.some(s => s.id === spouse.id)) {
          spousesList = spousesList.filter((s: string) => s !== targetId);
        }
        // Add source back if not already there
        if (!spousesList.includes(sourceId)) {
          spousesList.push(sourceId);
        }

        await supabase
          .from('members')
          .update({ spouses: spousesList })
          .eq('id', spouse.id);
      }
    }

    // 7. Update merge history status
    await supabase
      .from('merge_history')
      .update({
        status: 'REVERTED',
        reverted_at: new Date().toISOString(),
        reverted_by: revertedBy,
      })
      .eq('id', mergeHistoryId);

    return { success: true };
  } catch (error) {
    console.error('Revert failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'annulation',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MERGE HISTORY QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch merge history with additional info
 */
export async function fetchMergeHistory(
  supabase: SupabaseClient,
  options?: { limit?: number; offset?: number }
): Promise<MergeHistory[]> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const { data, error } = await supabase
    .from('merge_history')
    .select(`
      *,
      performer:profiles!performed_by(display_name)
    `)
    .order('performed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to fetch merge history:', error);
    return [];
  }

  // Enrich with member names and days remaining
  return (data || []).map((h) => ({
    ...h,
    performer_name: (h.performer as { display_name: string } | null)?.display_name || 'Inconnu',
    source_name: (h.snapshot as MergeSnapshot)?.source?.member?.name || h.source_id,
    target_name: (h.snapshot as MergeSnapshot)?.target?.member?.name || h.target_id,
    days_remaining: h.status === 'ACTIVE' ? getDaysRemaining(h.performed_at) : 0,
  }));
}

/**
 * Expire old merges (should be called periodically)
 */
export async function expireOldMerges(supabase: SupabaseClient): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('merge_history')
    .update({ status: 'EXPIRED' })
    .eq('status', 'ACTIVE')
    .lt('performed_at', thirtyDaysAgo.toISOString())
    .select('id');

  if (error) {
    console.error('Failed to expire old merges:', error);
    return 0;
  }

  return data?.length || 0;
}

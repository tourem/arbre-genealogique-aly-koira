import type { Member, MemberDict } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

// ═══ TYPES ═══

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

export interface MergeResult {
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

// ═══ RELATIONS ═══

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

// ═══ CONFLICTS ═══

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

// ═══ CHANGES PREVIEW ═══

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

// ═══ RESULT PREVIEW ═══

/**
 * Compute the result after merge (what the target will look like)
 */
export function computeMergeResult(
  sourceId: string,
  targetId: string,
  members: MemberDict
): MergeResult | null {
  const source = members[sourceId];
  const target = members[targetId];
  if (!source || !target) return null;

  const sourceRels = getMemberRelations(sourceId, members);
  const targetRels = getMemberRelations(targetId, members);

  // New spouses (from source, not already in target)
  const newSpouses = sourceRels.spouses.filter(
    (s) => !targetRels.spouses.some((ts) => ts.id === s.id)
  );

  // New children (from source, not already in target)
  const newChildren = sourceRels.children.filter(
    (c) => !targetRels.children.some((tc) => tc.id === c.id)
  );

  // Final spouses and children
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

// ═══ MERGE IMPACT ═══

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

// ═══ PERFORM MERGE ═══

export interface MergeOptions {
  transferNote?: boolean;
}

/**
 * Perform the merge operation via Supabase
 */
export async function performMerge(
  sourceId: string,
  targetId: string,
  options: MergeOptions,
  members: MemberDict,
  supabase: SupabaseClient
): Promise<void> {
  const source = members[sourceId];
  const target = members[targetId];

  if (!source || !target) {
    throw new Error('Source or target member not found');
  }

  const impact = computeMergeImpact(sourceId, members);

  // 1. Merge children[] arrays with deduplication
  const mergedChildren = [
    ...new Set([...(target.children || []), ...(source.children || [])]),
  ].filter((id) => id !== targetId && id !== sourceId);

  await supabase
    .from('members')
    .update({ children: mergedChildren })
    .eq('id', targetId);

  // 2. Merge spouses[] arrays with deduplication
  const mergedSpouses = [
    ...new Set([...(target.spouses || []), ...(source.spouses || [])]),
  ].filter((id) => id !== targetId && id !== sourceId);

  await supabase
    .from('members')
    .update({ spouses: mergedSpouses })
    .eq('id', targetId);

  // 3. Update father_id references
  if (impact.childrenWithFather.length > 0) {
    await supabase
      .from('members')
      .update({ father_id: targetId })
      .eq('father_id', sourceId);
  }

  // 4. Update mother_ref references
  if (impact.childrenWithMother.length > 0) {
    await supabase
      .from('members')
      .update({ mother_ref: targetId })
      .eq('mother_ref', sourceId);
  }

  // 5. Replace source in spouses[] of other members
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

  // 6. Replace source in children[] of other members
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

  // 7. Transfer note if requested and target has no note
  if (options.transferNote && source.note && !target.note) {
    await supabase
      .from('members')
      .update({ note: source.note })
      .eq('id', targetId);
  }

  // 8. Delete source member
  await supabase.from('members').delete().eq('id', sourceId);
}

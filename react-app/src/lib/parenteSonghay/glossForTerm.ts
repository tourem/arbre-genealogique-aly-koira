/**
 * Given a Songhay term (possibly compound like "kaga arou coté baba"),
 * return a French gloss ("grand-père (côté paternel)") using the labels
 * dict. Returns undefined if no atomic match found.
 *
 * Note: Songhay repeats words like "kaga" or "haama" to mark extra
 * generations ("kaga kaga arou" = arrière-grand-père). For glossing, we
 * collapse consecutive duplicate words so the atomic prefix match
 * succeeds on both the 1-level and multi-level forms.
 */
export function glossForTerm(
  term: string,
  labels: Record<string, string>,
): string | undefined {
  // Collapse consecutive duplicate words before prefix matching.
  const words = term.split(' ');
  const collapsed: string[] = [];
  for (const w of words) {
    if (collapsed.length > 0 && collapsed[collapsed.length - 1] === w) continue;
    collapsed.push(w);
  }
  const normalized = collapsed.join(' ');

  // Find the longest atomic term from labels.term.* that is a PREFIX of `term`.
  let best: { key: string; length: number } = { key: '', length: 0 };
  for (const key of Object.keys(labels)) {
    if (key.startsWith('term.') && !key.startsWith('term.cote_')) {
      const atomic = labels[key];
      if (!atomic) continue;
      if (normalized.startsWith(atomic) && atomic.length > best.length) {
        best = { key, length: atomic.length };
      }
    }
  }
  if (!best.key) return undefined;
  const glossKey = best.key.replace('term.', 'gloss.');
  let gloss = labels[glossKey];
  if (!gloss) return undefined;

  // Append side indicator if the compound term contains coté baba / coté gna
  const coteBaba = labels['term.cote_baba'] ?? 'coté baba';
  const coteGna = labels['term.cote_gna'] ?? 'coté gna';
  if (term.includes(coteBaba)) gloss += ' (côté paternel)';
  else if (term.includes(coteGna)) gloss += ' (côté maternel)';

  return gloss;
}

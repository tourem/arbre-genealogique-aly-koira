/**
 * Songhay tooltips registry.
 *
 * Source of truth : `./tooltips-songhay.md` — mirror of the authoritative
 * document at repo root `parente/new/tooltips-songhay.md`. When the user
 * updates the public spec, copy the file back into this folder :
 *
 *     cp parente/new/tooltips-songhay.md react-app/src/lib/tooltips-songhay.md
 *
 * This file NEVER generates or modifies definitions — it only parses the
 * Markdown input into a typed record that the UI consumes.
 */

// Vite handles the `?raw` suffix as a string import at build time.
// Typed via the ambient declaration in `src/vite-env.d.ts`.
import raw from './tooltips-songhay.md?raw';

export type SonghayTermCategory =
  | 'ligne-directe'
  | 'fratrie'
  | 'avunculat'
  | 'ancetres'
  | 'foyer'
  | 'social';

export interface SonghayTermDefinition {
  term: string;
  short: string;
  long: string;
  category: SonghayTermCategory;
}

/**
 * Parses the Markdown document. Each term block looks like :
 *
 *   ### `term`
 *
 *   - **Court** : short translation
 *   - **Long** : long definition paragraph
 *   - **Catégorie** : `category`
 *
 * Robust to multi-line `Long` content and optional blank lines between fields.
 */
export function parseTooltipsMd(md: string): Record<string, SonghayTermDefinition> {
  const out: Record<string, SonghayTermDefinition> = {};
  const blockRe = /^###\s+`([^`]+)`\s*$/gm;
  const matches = Array.from(md.matchAll(blockRe));
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const term = m[1].trim();
    const start = m.index! + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : md.length;
    const body = md.slice(start, end);

    const courtM = /-\s*\*\*Court\*\*\s*:\s*([^\n]+)/.exec(body);
    const longM  = /-\s*\*\*Long\*\*\s*:\s*([\s\S]+?)(?=\n-\s*\*\*Catégorie\*\*)/.exec(body);
    const catM   = /-\s*\*\*Catégorie\*\*\s*:\s*`([^`]+)`/.exec(body);

    if (!courtM || !longM || !catM) {
      // Skip malformed block silently; surface in tests if needed.
      continue;
    }
    const short = courtM[1].trim();
    const long = longM[1].trim().replace(/\s+/g, ' ');
    const category = catM[1].trim() as SonghayTermCategory;
    out[term] = { term, short, long, category };
  }
  return out;
}

/** Parsed once at module load — stable across the app lifecycle. */
export const songhayTooltips: Record<string, SonghayTermDefinition> = parseTooltipsMd(raw as string);

/**
 * Resolve a term (possibly compound, e.g. "kaga arou coté baba") to the
 * longest atomic match from the registry. Returns undefined if nothing
 * matches. Mirrors the existing glossForTerm algorithm (lib/parenteSonghay/
 * glossForTerm.ts) but returns the full definition object.
 */
export function resolveSonghayTerm(
  input: string,
): SonghayTermDefinition | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  // Direct exact match first.
  if (songhayTooltips[trimmed]) return songhayTooltips[trimmed];
  // Longest-prefix match among known terms.
  let best: SonghayTermDefinition | undefined;
  let bestLen = 0;
  for (const key of Object.keys(songhayTooltips)) {
    if (trimmed.startsWith(key) && key.length > bestLen) {
      best = songhayTooltips[key];
      bestLen = key.length;
    }
  }
  return best;
}

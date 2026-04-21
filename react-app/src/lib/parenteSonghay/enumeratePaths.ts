// react-app/src/lib/parenteSonghay/enumeratePaths.ts
import { MAX_DEPTH } from './types';
import type { AncestorPath, Hop, PersonDict } from './types';

/**
 * DFS récursif : énumère tous les chemins ancestraux d'une personne.
 * Inclut la personne elle-même (hops=[]).
 * Protection cycles via maxDepth.
 */
export function enumeratePaths(
  personId: string,
  dict: PersonDict,
  maxDepth: number = MAX_DEPTH,
): AncestorPath[] {
  const results: AncestorPath[] = [];

  function dfs(currentId: string, hops: Hop[]): void {
    results.push({ ancestor: currentId, hops: [...hops] });
    if (hops.length >= maxDepth) return;
    const person = dict[currentId];
    if (!person) return;
    if (person.fatherId && dict[person.fatherId]) {
      dfs(person.fatherId, [...hops, 'P']);
    }
    if (person.motherId && dict[person.motherId]) {
      dfs(person.motherId, [...hops, 'M']);
    }
  }

  dfs(personId, []);
  return results;
}

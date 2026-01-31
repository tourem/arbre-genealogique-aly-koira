import type { Member, MemberDict, RelationResult } from './types';

function getPaths(
  id: string,
  dict: MemberDict,
  visited: Set<string> = new Set(),
): Member[][] {
  const paths: Member[][] = [];
  const p = dict[id];
  if (!p || visited.has(id)) return [[p]];
  visited.add(id);

  if (p.father_id && dict[p.father_id]) {
    getPaths(p.father_id, dict, new Set(visited)).forEach((x) =>
      paths.push([p, ...x]),
    );
  }
  if (p.mother_ref && dict[p.mother_ref]) {
    getPaths(p.mother_ref, dict, new Set(visited)).forEach((x) =>
      paths.push([p, ...x]),
    );
  }
  if (!paths.length) paths.push([p]);
  return paths;
}

export function findAncestor(
  id1: string,
  id2: string,
  dict: MemberDict,
): RelationResult | null {
  const p1 = getPaths(id1, dict);
  const p2 = getPaths(id2, dict);
  let best: RelationResult | null = null;
  let min = Infinity;

  for (const a of p1) {
    for (const b of p2) {
      for (let i = 0; i < a.length; i++) {
        const j = b.findIndex((x) => x.id === a[i].id);
        if (j !== -1 && i + j < min) {
          min = i + j;
          best = {
            anc: a[i],
            path1: a.slice(0, i + 1),
            path2: b.slice(0, j + 1),
            d1: i,
            d2: j,
          };
          break;
        }
      }
    }
  }
  return best;
}

export function getRelationType(
  d1: number,
  d2: number,
  p1: Member,
  p2: Member,
): string {
  if (d1 === 0 && d2 === 0) return 'Meme personne';
  if (d1 === 1 && d2 === 1)
    return p1.gender === p2.gender
      ? p1.gender === 'M'
        ? 'Freres'
        : 'Soeurs'
      : 'Frere et soeur';
  if (d1 === 0)
    return d2 === 1
      ? p1.gender === 'M'
        ? 'Pere'
        : 'Mere'
      : d2 === 2
        ? p1.gender === 'M'
          ? 'Grand-pere'
          : 'Grand-mere'
        : 'Ancetre';
  if (d2 === 0)
    return d1 === 1
      ? p1.gender === 'M'
        ? 'Fils'
        : 'Fille'
      : d1 === 2
        ? p1.gender === 'M'
          ? 'Petit-fils'
          : 'Petite-fille'
        : 'Descendant';
  if ((d1 === 1 && d2 === 2) || (d1 === 2 && d2 === 1))
    return d1 === 1
      ? p1.gender === 'M'
        ? 'Oncle'
        : 'Tante'
      : p1.gender === 'M'
        ? 'Neveu'
        : 'Niece';
  if (d1 === 2 && d2 === 2) return 'Cousins germains';
  return 'Parents eloignes';
}

// react-app/src/lib/parenteSonghay/types.ts

export type Sex = 'M' | 'F';
export type Hop = 'P' | 'M';

export type RelationKind =
  | 'direct-descendant'
  | 'direct-ascendant'
  | 'parallel'
  | 'cross'
  | 'avuncular'
  | 'distant-vertical';

/** Personne minimale consommée par le moteur. */
export interface Person {
  id: string;
  name: string;
  sex: Sex;
  fatherId: string | null;
  motherId: string | null;
}

/** Dict {id → Person} — forme interne du moteur. */
export type PersonDict = Record<string, Person>;

/** Un chemin ancestral d'une personne. */
export interface AncestorPath {
  ancestor: string;
  hops: Hop[];
}

/** Une instance (candidate) de LCA entre A et B. */
export interface LCAInstance {
  ancestor: string;
  pathA: Hop[];
  pathB: Hop[];
}

/** Relation computed between A and B. */
export interface Relation {
  termForA: string;
  termForB: string;
  kind: RelationKind;
  via: string;
  viaName: string;
  /** When this relation was deduplicated with another via a married couple,
   *  this holds the info of the spouse LCA that was dropped. */
  viaSpouse?: { id: string; name: string };
  /** Optional group/link label naming the relationship itself
   *  (ex: "arrou hinka izey" = "enfants de deux frères"). Set when
   *  the parallel-cousin first-cousin structure (dA=dB=2, same-sex
   *  parents who are siblings at the LCA level) is detected. */
  groupTerm?: string;
  pathA: Hop[];
  pathB: Hop[];
  distanceA: number;
  distanceB: number;
  proximityScore: number;
  balanceScore: number;
}

export interface MissingParent {
  personId: string;
  missing: 'father' | 'mother';
}

export type RelationResult =
  | { kind: 'same-person' }
  | { kind: 'no-link' }
  | { kind: 'incomplete'; missingParents: MissingParent[] }
  | { kind: 'relations'; relations: Relation[] };

export const MAX_DEPTH = 20;

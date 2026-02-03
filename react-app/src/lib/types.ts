export interface Member {
  id: string;
  name: string;
  first_name: string | null;
  alias: string | null;
  gender: 'M' | 'F';
  generation: number;
  father_id: string | null;
  mother_ref: string | null;
  spouses: string[];
  children: string[];
  photo_url: string | null;
  note: string | null;
  birth_city: string | null;
  birth_country: string | null;
  village: string | null;
}

export type MemberDict = Record<string, Member>;

export interface RelationResult {
  anc: Member;
  path1: Member[];
  path2: Member[];
  d1: number;
  d2: number;
}

export interface ContributionData {
  nom: string;
  prenom: string;
  genre: string;
  pere: { nom: string; prenom: string };
  mere: { nom: string; prenom: string };
  epoux: { nom: string; prenom: string } | null;
  epouses: { nom: string; prenom: string }[];
  enfants: { nom: string; prenom: string; genre: string }[];
}

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
}

export interface Suggestion {
  id: string;
  user_id: string;
  type: 'add' | 'edit' | 'delete';
  member_id: string | null;
  payload: ContributionData;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

// --- Systeme de relations Songhoy ---

export interface RelationCategory {
  code: string;
  label_songhoy: string | null;
  label_fr: string;
  description: string | null;
  sort_order: number;
}

export interface RelationTerm {
  id: string;
  category_code: string;
  term_code: string;
  term_songhoy: string;
  prononciation: string | null;
  label_fr: string;
  description: string | null;
  speaker_gender: 'M' | 'F' | 'ANY';
  target_gender: 'M' | 'F' | 'ANY';
  context_condition: string | null;
  is_active: boolean;
  display_order: number;
}

export type TermsDict = Record<string, RelationTerm>;
export type CategoriesDict = Record<string, RelationCategory>;

export interface AncestorInfo {
  ancestor: Member;
  path: Member[];
  level: number;
}

export interface SonghoyRelationResult {
  commonAncestor: Member;
  category: RelationCategory;
  termAtoB: RelationTerm | null;
  termBtoA: RelationTerm | null;
  additionalTermAtoB?: RelationTerm | null;
  additionalTermBtoA?: RelationTerm | null;
  pathA: Member[];
  pathB: Member[];
  details: {
    distanceA: number;
    distanceB: number;
    labelFr: string;
  };
}

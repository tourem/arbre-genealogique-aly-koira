export interface Member {
  id: string;
  name: string;
  alias: string | null;
  gender: 'M' | 'F';
  generation: number;
  father_id: string | null;
  mother_ref: string | null;
  spouses: string[];
  children: string[];
  photo_url: string | null;
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

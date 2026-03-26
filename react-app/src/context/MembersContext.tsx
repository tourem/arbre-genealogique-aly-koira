import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMembers } from '../hooks/useMembers';
import type { Member, MemberDict } from '../lib/types';

interface MembersContextType {
  members: MemberDict;
  loading: boolean;
  error: string | null;
  refetchMembers: () => Promise<void>;
  updateMember: (id: string, data: Partial<Member>) => void;
  stats: {
    total: number;
    males: number;
    females: number;
    generations: number;
  };
}

const MembersContext = createContext<MembersContextType | null>(null);

export function MembersProvider({ children }: { children: ReactNode }) {
  const { members, loading, error, refetchMembers, updateMember } = useMembers();

  const stats = useMemo(() => {
    const list = Object.values(members);
    const males = list.filter((m) => m.gender === 'M').length;
    const females = list.filter((m) => m.gender === 'F').length;
    const maxGen =
      list.length > 0 ? Math.max(...list.map((m) => m.generation)) : 0;
    return {
      total: list.length,
      males,
      females,
      generations: list.length > 0 ? maxGen + 1 : 0,
    };
  }, [members]);

  return (
    <MembersContext.Provider value={{ members, loading, error, refetchMembers, updateMember, stats }}>
      {children}
    </MembersContext.Provider>
  );
}

export function useMembersContext(): MembersContextType {
  const ctx = useContext(MembersContext);
  if (!ctx) throw new Error('useMembersContext must be used within MembersProvider');
  return ctx;
}

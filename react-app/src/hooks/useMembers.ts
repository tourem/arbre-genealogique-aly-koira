import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, MemberDict } from '../lib/types';

export function useMembers() {
  const [members, setMembers] = useState<MemberDict>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('members')
      .select('*')
      .order('generation', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const dict: MemberDict = {};
    for (const row of data as Member[]) {
      dict[row.id] = row;
    }

    setMembers(dict);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, loading, error, refetchMembers: fetchMembers };
}

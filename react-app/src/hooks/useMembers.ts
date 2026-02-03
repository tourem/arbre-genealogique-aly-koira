import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getCachedMembers, setCachedMembers } from '../lib/cache';
import type { Member, MemberDict } from '../lib/types';

export function useMembers() {
  const [members, setMembers] = useState<MemberDict>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didInit = useRef(false);

  const fetchFromNetwork = useCallback(async (): Promise<MemberDict | null> => {
    const { data, error: fetchError } = await supabase
      .from('members')
      .select('*')
      .order('generation', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      return null;
    }

    const dict: MemberDict = {};
    for (const row of data as Member[]) {
      dict[row.id] = row;
    }
    return dict;
  }, []);

  // Initial load: cache-first, then network sync in background
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    async function init() {
      // 1. Try cache first for instant display
      const cached = await getCachedMembers();
      if (cached && Object.keys(cached).length > 0) {
        setMembers(cached);
        setLoading(false);

        // 2. Sync from network in background
        try {
          const fresh = await fetchFromNetwork();
          if (fresh && Object.keys(fresh).length > 0) {
            setMembers(fresh);
            setCachedMembers(fresh);
          }
        } catch {
          // Offline — cached data is fine
        }
      } else {
        // No cache — must load from network
        try {
          const fresh = await fetchFromNetwork();
          if (fresh && Object.keys(fresh).length > 0) {
            setMembers(fresh);
            setCachedMembers(fresh);
          }
        } catch {
          setError('Impossible de charger les donn\u00E9es. V\u00E9rifiez votre connexion.');
        }
        setLoading(false);
      }
    }

    init();
  }, [fetchFromNetwork]);

  const refetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await fetchFromNetwork();
      if (fresh && Object.keys(fresh).length > 0) {
        setMembers(fresh);
        setCachedMembers(fresh);
      }
    } catch {
      setError('Synchronisation \u00E9chou\u00E9e. Les donn\u00E9es locales sont affich\u00E9es.');
    }
    setLoading(false);
  }, [fetchFromNetwork]);

  return { members, loading, error, refetchMembers };
}

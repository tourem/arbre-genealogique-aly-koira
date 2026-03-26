import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  RelationCategory,
  RelationTerm,
  TermsDict,
  CategoriesDict,
} from '../lib/types';

export function useRelationTerms() {
  const [terms, setTerms] = useState<TermsDict>({});
  const [categories, setCategories] = useState<CategoriesDict>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [catRes, termRes] = await Promise.all([
      supabase
        .from('relation_categories')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('relation_terms')
        .select('*')
        .eq('is_active', true)
        .order('category_code', { ascending: true }),
    ]);

    if (catRes.error) {
      setError(catRes.error.message);
      setLoading(false);
      return;
    }
    if (termRes.error) {
      setError(termRes.error.message);
      setLoading(false);
      return;
    }

    const catDict: CategoriesDict = {};
    for (const row of catRes.data as RelationCategory[]) {
      catDict[row.code] = row;
    }

    const termDict: TermsDict = {};
    for (const row of termRes.data as RelationTerm[]) {
      termDict[row.term_code] = row;
    }

    setCategories(catDict);
    setTerms(termDict);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  return { terms, categories, loading, error, refetchTerms: fetchTerms };
}

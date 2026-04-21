import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { applyLabels, defaultLabels } from '../lib/parenteSonghay';

interface ParenteLabelsContextValue {
  labels: Record<string, string>;
  overrides: Record<string, string>;
  defaults: Record<string, string>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ParenteLabelsContext = createContext<ParenteLabelsContextValue | null>(null);

export function ParenteLabelsProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('parente_labels').select('key, value');
    if (err) {
      console.warn('[parente] labels fetch failed, falling back to defaults:', err.message);
      setError(err.message);
      setOverrides({});
    } else {
      const dict: Record<string, string> = {};
      for (const row of data ?? []) {
        dict[(row as { key: string }).key] = (row as { value: string }).value;
      }
      setOverrides(dict);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const labels = useMemo(() => applyLabels(overrides), [overrides]);

  const value: ParenteLabelsContextValue = {
    labels, overrides, defaults: defaultLabels, loading, error, refetch,
  };

  return (
    <ParenteLabelsContext.Provider value={value}>{children}</ParenteLabelsContext.Provider>
  );
}

export function useParenteLabels(): ParenteLabelsContextValue {
  const ctx = useContext(ParenteLabelsContext);
  if (!ctx) throw new Error('useParenteLabels must be used within ParenteLabelsProvider');
  return ctx;
}

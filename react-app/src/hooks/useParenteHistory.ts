import { useCallback, useEffect, useState } from 'react';

export interface HistoryEntry {
  aId: string;
  aName: string;
  bId: string;
  bName: string;
  topTerm?: string;
  timestamp: number;
}

const STORAGE_KEY = 'parente.history.v1';
const MAX_ENTRIES = 10;

function pairKey(aId: string, bId: string): string {
  return [aId, bId].sort().join('|');
}

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e) =>
      e && typeof e.aId === 'string' && typeof e.bId === 'string' &&
      typeof e.aName === 'string' && typeof e.bName === 'string' &&
      typeof e.timestamp === 'number'
    );
  } catch {
    return [];
  }
}

function save(history: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Quota exceeded or disabled — silently ignore
  }
}

export function useParenteHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => load());

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setHistory(load());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const add = useCallback((entry: Omit<HistoryEntry, 'timestamp'>) => {
    setHistory((prev) => {
      const key = pairKey(entry.aId, entry.bId);
      const filtered = prev.filter((e) => pairKey(e.aId, e.bId) !== key);
      const next = [{ ...entry, timestamp: Date.now() }, ...filtered].slice(0, MAX_ENTRIES);
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((aId: string, bId: string) => {
    setHistory((prev) => {
      const key = pairKey(aId, bId);
      const next = prev.filter((e) => pairKey(e.aId, e.bId) !== key);
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, []);

  return { history, add, remove, clear };
}

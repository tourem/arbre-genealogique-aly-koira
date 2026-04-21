// react-app/src/components/relationship/PersonPicker.tsx
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { MemberDict } from '../../lib/types';

interface Props {
  label: string;
  value: string | null;
  members: MemberDict;
  onChange: (id: string | null) => void;
  side: 'a' | 'b';
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
}

export default function PersonPicker({ label, value, members, onChange, side }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const all = useMemo(
    () =>
      Object.values(members).sort((a, b) =>
        a.generation !== b.generation ? a.generation - b.generation : a.name.localeCompare(b.name, 'fr'),
      ),
    [members],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return all.slice(0, 10);
    const q = normalize(query.trim());
    const terms = q.split(/\s+/);
    const scored = all
      .map((m) => {
        const hay = normalize(`${m.name} ${m.first_name ?? ''} ${m.alias ?? ''} ${m.note ?? ''}`);
        if (!terms.every((t) => hay.includes(t))) return null;
        let score = 0;
        for (const t of terms) {
          if (normalize(m.name).startsWith(t) || (m.alias && normalize(m.alias).startsWith(t))) score += 3;
          else if (normalize(m.name).split(/\s+/).some((w) => w.startsWith(t))) score += 2;
          else score += 1;
        }
        return { m, score };
      })
      .filter(Boolean) as { m: (typeof all)[number]; score: number }[];
    scored.sort((a, b) => b.score - a.score || a.m.name.localeCompare(b.m.name, 'fr'));
    return scored.slice(0, 10).map((s) => s.m);
  }, [query, all]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setActiveIdx(0); }, [query]);

  const selected = value ? members[value] : null;

  const handleSelect = (id: string) => {
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
    onChange(id);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[activeIdx]) handleSelect(filtered[activeIdx].id); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div className={`parente-pc ${side}`} ref={containerRef}>
      <div className="parente-pc-l">{label}</div>

      {selected && !open ? (
        <div className="parente-pc-r" onClick={() => { setQuery(''); setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}>
          <div className={`parente-av ${selected.gender === 'F' ? 'f' : 'm'}`}>
            {initials(selected.name)}
            <span className="parente-av-g">G{selected.generation}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="parente-pc-nm" title={selected.name}>{selected.name}</div>
            <div className="parente-pc-mt">
              <span>{selected.gender === 'F' ? '\u2640' : '\u2642'}</span>{' '}Génération {selected.generation}
            </div>
          </div>
          <button
            className="parente-pc-clear"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            aria-label="Effacer la sélection"
          >&times;</button>
        </div>
      ) : (
        <div className="member-search-input-wrap">
          <span className="member-search-icon">{'\uD83D\uDD0D'}</span>
          <input
            ref={inputRef}
            type="text"
            className="member-search-input"
            placeholder="Rechercher un membre..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKey}
            aria-label={label}
          />
          {query && (
            <button className="member-search-clear" onClick={() => setQuery('')} aria-label="Effacer">&times;</button>
          )}
        </div>
      )}

      {open && (
        <div className="member-search-dropdown" role="listbox">
          {filtered.length === 0 ? (
            <div className="member-search-empty">Aucun résultat</div>
          ) : (
            filtered.map((m, idx) => (
              <div
                key={m.id}
                className={`member-search-item${idx === activeIdx ? ' active' : ''}${m.id === value ? ' selected' : ''}`}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => handleSelect(m.id)}
              >
                <span className="member-search-name">
                  {m.name}
                  {m.alias ? <span className="member-search-alias"> ({m.alias})</span> : null}
                </span>
                <span className="member-search-gender">{m.gender === 'F' ? '\u2640' : '\u2642'}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

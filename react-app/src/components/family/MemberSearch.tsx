import { useState, useRef, useEffect, useMemo } from 'react';
import type { MemberDict } from '../../lib/types';
import { genColors } from '../../lib/constants';

interface Props {
  members: MemberDict;
  currentPersonId: string;
  onSelect: (id: string) => void;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function MemberSearch({ members, currentPersonId, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allMembers = useMemo(
    () =>
      Object.values(members).sort((a, b) => {
        if (a.generation !== b.generation) return a.generation - b.generation;
        return a.name.localeCompare(b.name);
      }),
    [members],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allMembers.slice(0, 20);
    const q = normalize(query.trim());
    const terms = q.split(/\s+/);
    return allMembers.filter((m) => {
      const haystack = normalize(
        `${m.name} ${m.alias || ''}`,
      );
      return terms.every((t) => haystack.includes(t));
    });
  }, [query, allMembers]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (id: string) => {
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
    onSelect(id);
  };

  const current = members[currentPersonId];
  const placeholder = current
    ? `${current.name}${current.alias ? ` (${current.alias})` : ''}`
    : 'Rechercher un membre...';

  return (
    <div className="member-search" ref={containerRef}>
      <div className="member-search-input-wrap">
        <span className="member-search-icon">{'\uD83D\uDD0D'}</span>
        <input
          ref={inputRef}
          type="text"
          className="member-search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button
            className="member-search-clear"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
          >
            &times;
          </button>
        )}
      </div>

      {open && (
        <div className="member-search-dropdown">
          {filtered.length === 0 ? (
            <div className="member-search-empty">Aucun r&eacute;sultat</div>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                className={`member-search-item ${m.id === currentPersonId ? 'active' : ''}`}
                onClick={() => handleSelect(m.id)}
              >
                <span
                  className="member-search-gen"
                  style={{ background: genColors[m.generation] || '#6366f1' }}
                >
                  G{m.generation}
                </span>
                <span className="member-search-name">
                  {m.name}
                  {m.alias ? <span className="member-search-alias"> ({m.alias})</span> : null}
                </span>
                <span className="member-search-gender">{m.gender === 'F' ? '\u2640' : '\u2642'}</span>
              </div>
            ))
          )}
          {!query.trim() && filtered.length < allMembers.length && (
            <div className="member-search-hint">
              Tapez un nom pour chercher parmi {allMembers.length} membres
            </div>
          )}
        </div>
      )}
    </div>
  );
}

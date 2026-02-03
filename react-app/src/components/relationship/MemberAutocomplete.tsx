import { useState, useRef, useEffect, useMemo } from 'react';
import type { MemberDict } from '../../lib/types';
import { genColors } from '../../lib/constants';

interface Props {
  label: string;
  value: string;
  members: MemberDict;
  onChange: (id: string) => void;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function MemberAutocomplete({
  label,
  value,
  members,
  onChange,
}: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allMembers = useMemo(
    () =>
      Object.values(members).sort((a, b) => {
        if (a.generation !== b.generation) return a.generation - b.generation;
        return a.name.localeCompare(b.name, 'fr');
      }),
    [members],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allMembers.slice(0, 20);
    const q = normalize(query.trim());
    const termsArr = q.split(/\s+/);

    // Score-based search: higher score = better match
    const scored = allMembers
      .map((m) => {
        const nameNorm = normalize(m.name);
        const aliasNorm = m.alias ? normalize(m.alias) : '';
        const noteNorm = m.note ? normalize(m.note) : '';
        const haystack = `${nameNorm} ${aliasNorm} ${noteNorm}`;
        const matches = termsArr.every((t) => haystack.includes(t));
        if (!matches) return null;

        // Prioritize: starts-with on name/alias > includes
        let score = 0;
        for (const t of termsArr) {
          if (nameNorm.startsWith(t) || aliasNorm.startsWith(t)) {
            score += 3;
          } else if (
            nameNorm.split(/\s+/).some((w) => w.startsWith(t)) ||
            aliasNorm.split(/\s+/).some((w) => w.startsWith(t))
          ) {
            score += 2;
          } else {
            score += 1;
          }
        }
        return { member: m, score };
      })
      .filter(Boolean) as { member: (typeof allMembers)[0]; score: number }[];

    scored.sort((a, b) => b.score - a.score || a.member.name.localeCompare(b.member.name, 'fr'));
    return scored.map((s) => s.member);
  }, [query, allMembers]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
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
    onChange(id);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    inputRef.current?.focus();
  };

  const selected = value ? members[value] : null;
  const placeholder = selected
    ? `${selected.name}${selected.alias ? ` (${selected.alias})` : ''}`
    : 'Rechercher un membre...';

  return (
    <div className="member-autocomplete" ref={containerRef}>
      <label className="member-autocomplete-label">{label}</label>
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
        {(query || value) && (
          <button className="member-search-clear" onClick={handleClear}>
            &times;
          </button>
        )}
      </div>

      {selected && !open && (
        <div className="member-autocomplete-selected">
          <span
            className="member-search-gen"
            style={{
              background: genColors[selected.generation] || '#6366f1',
            }}
          >
            G{selected.generation}
          </span>
          <span>{selected.name}</span>
          <span className="member-search-gender">
            {selected.gender === 'F' ? '\u2640' : '\u2642'}
          </span>
        </div>
      )}

      {open && (
        <div className="member-search-dropdown">
          {filtered.length === 0 ? (
            <div className="member-search-empty">Aucun resultat</div>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                className={`member-search-item${m.id === value ? ' active' : ''}`}
                onClick={() => handleSelect(m.id)}
              >
                <span
                  className="member-search-gen"
                  style={{
                    background: genColors[m.generation] || '#6366f1',
                  }}
                >
                  G{m.generation}
                </span>
                <span className="member-search-name">
                  {m.name}
                  {m.alias ? (
                    <span className="member-search-alias">
                      {' '}
                      ({m.alias})
                    </span>
                  ) : null}
                </span>
                <span className="member-search-gender">
                  {m.gender === 'F' ? '\u2640' : '\u2642'}
                </span>
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

import { useState, useMemo } from 'react';
import type { MemberDict } from '../../lib/types';
import { genColors } from '../../lib/constants';

interface Props {
  members: MemberDict;
  excludeIds: string[];
  genderFilter?: 'M' | 'F';
  generationHint?: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function MemberPicker({
  members,
  excludeIds,
  genderFilter,
  generationHint,
  selectedId,
  onSelect,
}: Props) {
  const [query, setQuery] = useState('');

  const candidates = useMemo(() => {
    const excludeSet = new Set(excludeIds);
    let list = Object.values(members).filter((m) => !excludeSet.has(m.id));
    if (genderFilter) list = list.filter((m) => m.gender === genderFilter);

    // Sort: prioritize generationHint, then by generation, then by name
    list.sort((a, b) => {
      if (generationHint != null) {
        const aMatch = a.generation === generationHint ? 0 : 1;
        const bMatch = b.generation === generationHint ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
      }
      if (a.generation !== b.generation) return a.generation - b.generation;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [members, excludeIds, genderFilter, generationHint]);

  const filtered = useMemo(() => {
    if (!query.trim()) return candidates.slice(0, 30);
    const terms = normalize(query.trim()).split(/\s+/);
    return candidates.filter((m) => {
      const haystack = normalize(`${m.name} ${m.alias || ''}`);
      return terms.every((t) => haystack.includes(t));
    });
  }, [query, candidates]);

  const handleClick = (id: string) => {
    onSelect(selectedId === id ? null : id);
  };

  return (
    <div className="member-picker">
      <input
        type="text"
        className="member-picker-input"
        placeholder="Rechercher un membre..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="member-picker-list">
        {filtered.length === 0 ? (
          <div className="member-picker-empty">Aucun résultat</div>
        ) : (
          filtered.map((m) => (
            <div
              key={m.id}
              className={`member-picker-item${selectedId === m.id ? ' selected' : ''}`}
              onClick={() => handleClick(m.id)}
            >
              <span
                className="member-picker-gen"
                style={{ background: genColors[m.generation] || '#6366f1' }}
              >
                G{m.generation}
              </span>
              <span className="member-picker-name">
                {m.name}
                {m.alias ? <span className="member-picker-alias"> ({m.alias})</span> : null}
              </span>
              <span className="member-picker-gender">
                {m.gender === 'F' ? '\u2640' : '\u2642'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

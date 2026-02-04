import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMembersContext } from '../context/MembersContext';
import SearchBar from '../components/search/SearchBar';
import PersonListItem from '../components/search/PersonListItem';

export default function RecherchePage() {
  const { members, loading } = useMembersContext();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const sortedMembers = useMemo(
    () =>
      Object.values(members).sort((a, b) =>
        a.name.localeCompare(b.name, 'fr'),
      ),
    [members],
  );

  const filteredMembers = useMemo(() => {
    if (!query) return sortedMembers;
    const q = query.toLowerCase();
    return sortedMembers.filter((p) => {
      const searchStr =
        `${p.name} ${p.alias || ''}`.toLowerCase();
      return searchStr.includes(q);
    });
  }, [sortedMembers, query]);

  const goToPerson = (id: string) => {
    navigate(`/?person=${id}`);
  };

  if (loading) {
    return (
      <div className="page active">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div>Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page active">
      <div className="scroll" tabIndex={0}>
        <SearchBar value={query} onChange={setQuery} />
        <div className="person-list">
          {filteredMembers.map((p) => (
            <PersonListItem
              key={p.id}
              person={p}
              onClick={() => goToPerson(p.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

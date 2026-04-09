import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMembersContext } from '../../context/MembersContext';
import ProfileMenu from './ProfileMenu';
import type { Member } from '../../lib/types';

export default function Header() {
  const { user } = useAuth();
  const { members } = useMembersContext();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  const filteredMembers = useCallback((): Member[] => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return Object.values(members)
      .filter((m) => m.name.toLowerCase().includes(q))
      .slice(0, 15);
  }, [searchQuery, members]);

  const handleSelectMember = (id: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(`/?person=${id}`);
  };

  const initials = user?.display_name
    ? user.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">
            <div className="header-logo-icon">{'\u{1F333}'}</div>
            <span className="header-logo-text">Aly Ko&iuml;ra</span>
          </div>

          <button
            className="header-search-trigger"
            onClick={() => setSearchOpen(true)}
            aria-label="Rechercher"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span className="header-search-placeholder">Rechercher...</span>
          </button>

          <button
            className="header-avatar"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu profil"
          >
            {initials}
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="search-overlay">
          <div className="search-overlay-header">
            <div className="search-overlay-input-wrap">
              <svg className="search-overlay-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="search-overlay-input"
                placeholder="Rechercher un membre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="search-overlay-close" onClick={() => setSearchOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="search-overlay-results">
            {filteredMembers().map((m) => (
              <button
                key={m.id}
                className="search-overlay-item"
                onClick={() => handleSelectMember(m.id)}
              >
                <div className={`search-overlay-item-avatar ${m.gender === 'F' ? 'female' : 'male'}`}>
                  {m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="search-overlay-item-info">
                  <div className="search-overlay-item-name">{m.name}</div>
                  <div className="search-overlay-item-gen">G&eacute;n&eacute;ration {m.generation}</div>
                </div>
              </button>
            ))}
            {searchQuery.trim() && filteredMembers().length === 0 && (
              <div className="search-overlay-empty">Aucun membre trouv&eacute;</div>
            )}
          </div>
        </div>
      )}

      {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
    </>
  );
}

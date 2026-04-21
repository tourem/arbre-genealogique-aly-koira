import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useMembersContext } from '../../context/MembersContext';
import { useTheme } from '../../context/ThemeContext';
import ProfileMenu from './ProfileMenu';
import type { Member } from '../../lib/types';

export default function Header() {
  const { members } = useMembersContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [plusOpen, setPlusOpen] = useState(false);
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

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="header-logo" aria-label="Accueil Aly Koïra">
            <div className="header-logo-mark" aria-hidden="true">A</div>
            <span className="header-logo-text">Aly K<em>oï</em>ra</span>
          </NavLink>

          <button
            className="header-search-trigger"
            onClick={() => setSearchOpen(true)}
            aria-label="Rechercher un membre"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span className="header-search-placeholder">Rechercher une personne, un surnom…</span>
          </button>

          <nav className="header-nav" aria-label="Navigation principale">
            <NavLink to="/" end className={({ isActive }) => `header-nav-item${isActive ? ' active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Famille</span>
            </NavLink>
            <NavLink to="/parente" className={({ isActive }) => `header-nav-item${isActive ? ' active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="7" r="4" />
                <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <path d="M21 21v-2a6 6 0 0 0-3-5.2" />
              </svg>
              <span>Parenté</span>
            </NavLink>
            <button
              type="button"
              className={`header-nav-item${plusOpen ? ' active' : ''}`}
              onClick={() => setPlusOpen(true)}
              aria-expanded={plusOpen}
              aria-haspopup="dialog"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
              <span>Plus</span>
            </button>
          </nav>

          <button
            type="button"
            className="header-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
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
                  <div className="search-overlay-item-gen">Génération {m.generation}</div>
                </div>
              </button>
            ))}
            {searchQuery.trim() && filteredMembers().length === 0 && (
              <div className="search-overlay-empty">Aucun membre trouvé</div>
            )}
          </div>
        </div>
      )}

      {plusOpen && <ProfileMenu onClose={() => setPlusOpen(false)} />}
    </>
  );
}

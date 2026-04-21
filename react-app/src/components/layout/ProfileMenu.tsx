import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMembersContext } from '../../context/MembersContext';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  onClose: () => void;
}

export default function ProfileMenu({ onClose }: Props) {
  const { user, isAdmin, logout } = useAuth();
  const { stats } = useMembersContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const sheetRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  // Click outside closes
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Autofocus first menu item
  useEffect(() => {
    requestAnimationFrame(() => firstItemRef.current?.focus());
  }, []);

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const displayName = user?.display_name || user?.email || 'Utilisateur';
  const version = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

  return createPortal(
    <div
      className="plus-sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Menu utilisateur"
    >
      <div className="plus-sheet" ref={sheetRef}>
        <button
          type="button"
          className="plus-sheet-handle"
          onClick={onClose}
          aria-label="Fermer le menu"
        >
          <span className="plus-sheet-handle-grip" aria-hidden="true" />
        </button>

        <header className="plus-sheet-user">
          <div className="plus-sheet-user-main">
            <div className="plus-sheet-user-name">{displayName}</div>
            <div className="plus-sheet-user-stats">
              <span>{stats.total || 0} membres</span>
              <span className="plus-sheet-user-stats-sep" aria-hidden="true">·</span>
              <span>{stats.generations || 0} générations</span>
            </div>
          </div>
          <span className={`plus-sheet-badge ${isAdmin ? 'plus-sheet-badge--admin' : 'plus-sheet-badge--member'}`}>
            {isAdmin ? 'Admin' : 'Membre'}
          </span>
        </header>

        <div className="plus-sheet-separator" role="separator" />

        <nav className="plus-sheet-items" role="menu">
          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
            className="plus-sheet-item"
            onClick={() => go('/contribuer')}
          >
            <span className="plus-sheet-item-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <span className="plus-sheet-item-label">Contribuer</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="plus-sheet-item"
            onClick={() => go('/mes-suggestions')}
          >
            <span className="plus-sheet-item-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
            <span className="plus-sheet-item-label">Mes suggestions</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              role="menuitem"
              className="plus-sheet-item"
              onClick={() => go('/admin')}
            >
              <span className="plus-sheet-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </span>
              <span className="plus-sheet-item-label">Administration</span>
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            className="plus-sheet-item"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            <span className="plus-sheet-item-icon" aria-hidden="true">
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </span>
            <span className="plus-sheet-item-label">
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="plus-sheet-item plus-sheet-item--danger"
            onClick={() => void logout()}
          >
            <span className="plus-sheet-item-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="plus-sheet-item-label">Déconnexion</span>
          </button>
        </nav>

        <footer className="plus-sheet-version" aria-hidden="true">v{version}</footer>
      </div>
    </div>,
    document.body,
  );
}

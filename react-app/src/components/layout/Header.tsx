import { useAuth } from '../../context/AuthContext';
import { useMembersContext } from '../../context/MembersContext';
import { useTheme } from '../../context/ThemeContext';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { stats } = useMembersContext();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      <div className="header-top">
        <div className="logo">
          <div className="logo-icon">{'\u{1F333}'}</div>
          <div className="logo-text">
            <h1>Famille Aly Ko&iuml;ra</h1>
            <span>Arbre g&eacute;n&eacute;alogique</span>
          </div>
        </div>
        <div className="header-user">
          {user && (
            <div className="header-user-info">
              <span className="header-user-name">{user.display_name || user.email}</span>
              <span className={`header-role-badge ${isAdmin ? 'admin' : 'user'}`}>
                {isAdmin ? 'Admin' : 'Membre'}
              </span>
            </div>
          )}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button className="logout-btn" onClick={() => void logout()} title="D&eacute;connexion">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="header-stats">
        <div className="header-stat">
          <div className="header-stat-value">{stats.total || '-'}</div>
          <div className="header-stat-label">Membres</div>
        </div>
        <div className="header-stat">
          <div className="header-stat-value">{stats.generations || '-'}</div>
          <div className="header-stat-label">G&eacute;n&eacute;rations</div>
        </div>
        <div className="header-stat">
          <div className="header-stat-value">{stats.males || '-'}</div>
          <div className="header-stat-label">Hommes</div>
        </div>
        <div className="header-stat">
          <div className="header-stat-value">{stats.females || '-'}</div>
          <div className="header-stat-label">Femmes</div>
        </div>
      </div>
    </header>
  );
}

import { useAuth } from '../../context/AuthContext';
import { useMembersContext } from '../../context/MembersContext';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { stats } = useMembersContext();

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

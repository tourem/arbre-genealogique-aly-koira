import { useAuth } from '../../context/AuthContext';
import { WHATSAPP_ACTIVATION_NUMBER } from '../../lib/constants';

export default function PendingActivationScreen() {
  const { user, logout } = useAuth();

  const whatsappMessage = encodeURIComponent(
    `Bonjour, je souhaite activer mon compte sur l'arbre généalogique Aly Koïra.\n\nNom: ${user?.display_name || ''}\nEmail: ${user?.email || ''}`
  );

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-logo">
          <div className="login-logo-icon">{'\u{23F3}'}</div>
          <h1>Compte en attente</h1>
          <p>Activation requise</p>
        </div>

        <div className="login-box pending-box">
          <div className="pending-icon">{'\u{1F512}'}</div>
          <h2>Bienvenue, {user?.display_name || 'Utilisateur'} !</h2>
          <p className="pending-message">
            Votre compte a été créé avec succès, mais il doit être activé par un
            administrateur avant que vous puissiez accéder à l'application.
          </p>

          <div className="pending-info">
            <div className="pending-info-row">
              <span className="pending-info-label">Email</span>
              <span className="pending-info-value">{user?.email}</span>
            </div>
            <div className="pending-info-row">
              <span className="pending-info-label">Statut</span>
              <span className="pending-info-value pending-status">En attente d'activation</span>
            </div>
          </div>

          <p className="pending-hint">
            Pour demander l'activation de votre compte, contactez un administrateur via WhatsApp :
          </p>

          <a
            href={`https://wa.me/${WHATSAPP_ACTIVATION_NUMBER}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="login-whatsapp-btn"
          >
            <span className="wa-icon">{'\uD83D\uDCAC'}</span>
            Demander l'activation via WhatsApp
          </a>

          <button className="login-btn logout-btn" onClick={logout} type="button">
            Se déconnecter
          </button>
        </div>

        <div className="login-footer">
          <p>{'\u{1F333}'} Famille Aly Ko&iuml;ra</p>
        </div>
      </div>
    </div>
  );
}

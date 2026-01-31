import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

type Tab = 'login' | 'signup';

export default function LoginScreen() {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, [tab]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
    setSuccess('');
  };

  const switchTab = (t: Tab) => {
    resetForm();
    setTab(t);
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Veuillez saisir votre email');
      return;
    }
    if (!password) {
      setError('Veuillez saisir votre mot de passe');
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await login(email.trim(), password);
    if (result.error) {
      setError(result.error);
      setPassword('');
    }
    setSubmitting(false);
  };

  const handleSignup = async () => {
    if (!email.trim()) {
      setError('Veuillez saisir votre email');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (!displayName.trim()) {
      setError("Veuillez saisir votre nom d'affichage");
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await signup(email.trim(), password, displayName.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
      setPassword('');
    }
    setSubmitting(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (tab === 'login') handleLogin();
      else handleSignup();
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-logo">
          <div className="login-logo-icon">{'\u{1F333}'}</div>
          <h1>Famille Aly Ko&iuml;ra</h1>
          <p>Arbre g&eacute;n&eacute;alogique familial</p>
        </div>

        <div className="login-box">
          <div className="login-tabs">
            <button
              className={`login-tab${tab === 'login' ? ' active' : ''}`}
              onClick={() => switchTab('login')}
              type="button"
            >
              Connexion
            </button>
            <button
              className={`login-tab${tab === 'signup' ? ' active' : ''}`}
              onClick={() => switchTab('signup')}
              type="button"
            >
              Inscription
            </button>
          </div>

          <div className="login-form">
            <div className="login-input-group">
              <label>Email</label>
              <div className="login-input-wrapper">
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Mot de passe</label>
              <div className="login-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={tab === 'signup' ? 'Min. 6 caractères' : 'Mot de passe'}
                />
                <button
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? '\u{1F648}' : '\u{1F441}\uFE0F'}
                </button>
              </div>
            </div>

            {tab === 'signup' && (
              <div className="login-input-group">
                <label>Nom d&apos;affichage</label>
                <div className="login-input-wrapper">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ex: Moussa Ali"
                  />
                </div>
              </div>
            )}

            <button
              className="login-btn"
              onClick={tab === 'login' ? handleLogin : handleSignup}
              disabled={submitting}
              type="button"
            >
              {submitting
                ? 'Chargement...'
                : tab === 'login'
                  ? 'Se connecter'
                  : 'Créer un compte'}
            </button>

            {error && <div className="login-error">{error}</div>}
            {success && <div className="login-success">{success}</div>}
          </div>
        </div>

        <div className="login-footer">
          <p>{'\u{1F512}'} Espace priv&eacute; familial</p>
        </div>
      </div>
    </div>
  );
}

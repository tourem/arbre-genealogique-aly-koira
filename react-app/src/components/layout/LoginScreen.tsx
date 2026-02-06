import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WHATSAPP_ACTIVATION_NUMBER } from '../../lib/constants';

type View = 'login' | 'signup' | 'forgot' | 'reset';

// SVG Icons
const EnvelopeIcon = () => (
  <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M22 6L12 13 2 6"/>
  </svg>
);

const LockIcon = () => (
  <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const UserIcon = () => (
  <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

export default function LoginScreen() {
  const { login, signup, resetPassword, updatePassword, isRecoveryMode } = useAuth();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notActivated, setNotActivated] = useState<{ email: string; displayName: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Detect password recovery mode from Supabase
  useEffect(() => {
    if (isRecoveryMode) {
      setView('reset');
      setError('');
      setSuccess('');
    }
  }, [isRecoveryMode]);

  useEffect(() => {
    if (view !== 'reset') {
      emailRef.current?.focus();
    }
  }, [view]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setError('');
    setSuccess('');
    setNotActivated(null);
    setResetEmailSent(false);
  };

  const switchView = (v: View) => {
    resetForm();
    setView(v);
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
    setNotActivated(null);
    try {
      const result = await login(email.trim(), password);
      if (result.error) {
        setError(result.error);
        setPassword('');
      } else if (result.notActivated) {
        setNotActivated({
          email: result.email || email.trim(),
          displayName: result.displayName || '',
        });
        setPassword('');
      }
    } catch {
      setError('Erreur de connexion. Vérifiez votre réseau.');
    } finally {
      setSubmitting(false);
    }
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
    } else if (result.needsActivation) {
      setSuccess('ACTIVATION_NEEDED');
      setPassword('');
    } else {
      setSuccess('Compte créé !');
      setPassword('');
    }
    setSubmitting(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Veuillez saisir votre adresse email');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await resetPassword(email.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setResetEmailSent(true);
      }
    } catch {
      setError('Erreur lors de l\'envoi. Vérifiez votre réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await updatePassword(password);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Mot de passe mis à jour avec succès !');
        // Nettoyer le hash de l'URL et recharger
        setTimeout(() => {
          window.history.replaceState(null, '', window.location.pathname);
          window.location.reload();
        }, 2000);
      }
    } catch {
      setError('Erreur lors de la mise à jour. Vérifiez votre réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (view === 'login') handleLogin();
      else if (view === 'signup') handleSignup();
      else if (view === 'forgot') handleForgotPassword();
      else if (view === 'reset') handleUpdatePassword();
    }
  };

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (password.length === 0) return { level: '', text: 'Min. 6 caractères' };
    if (password.length < 6) return { level: 'weak', text: 'Trop court' };
    if (password.length < 8) return { level: 'medium', text: 'Moyen' };
    if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return { level: 'good', text: 'Bon' };
    }
    return { level: 'strong', text: 'Fort' };
  }, [password]);

  // Render password reset screen (when user clicks email link)
  if (view === 'reset') {
    return (
      <div className="login-screen">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo-wrap">
              <span className="login-logo-tree">🌳</span>
            </div>
            <h1 className="login-title">Famille <span>Aly Koïra</span></h1>
            <p className="login-subtitle">Nouveau mot de passe</p>
          </div>

          <div className="login-card">
            <div className="login-card-header">
              <h2>Réinitialiser votre mot de passe</h2>
              <p>Choisissez un nouveau mot de passe sécurisé</p>
            </div>

            <div className={`login-error-banner ${error ? 'show' : ''}`}>
              <AlertIcon />
              <p>{error}</p>
            </div>

            {success ? (
              <div className="login-success-box">
                <div className="login-success-icon"><CheckCircleIcon /></div>
                <div className="login-success-title">{success}</div>
                <p>Vous allez être redirigé vers la page de connexion...</p>
              </div>
            ) : (
              <div className="login-form active">
                <div className="login-field">
                  <label className="login-field-label">Nouveau mot de passe</label>
                  <div className="login-input-wrap has-toggle">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 caractères"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyPress}
                      autoFocus
                    />
                    <LockIcon />
                    <button
                      type="button"
                      className="login-pwd-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <div className={`login-pwd-strength ${passwordStrength.level}`}>
                    <div className="login-pwd-strength-bar">
                      <span /><span /><span /><span />
                    </div>
                    <div className="login-pwd-strength-text">{passwordStrength.text}</div>
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-field-label">Confirmer le mot de passe</label>
                  <div className="login-input-wrap has-toggle">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Retapez le mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={handleKeyPress}
                    />
                    <LockIcon />
                    <button
                      type="button"
                      className="login-pwd-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className={`login-btn ${submitting ? 'loading' : ''}`}
                  onClick={handleUpdatePassword}
                  disabled={submitting}
                >
                  <span className="login-btn-text">Mettre à jour le mot de passe</span>
                  <span className="login-btn-spinner" />
                </button>
              </div>
            )}
          </div>

          <div className="login-footer">
            <span>🔒</span> Espace privé familial
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo-wrap">
            <span className="login-logo-tree">🌳</span>
          </div>
          <h1 className="login-title">Famille <span>Aly Koïra</span></h1>
          <p className="login-subtitle">Arbre généalogique familial</p>
        </div>

        {/* Card */}
        <div className="login-card">
          {/* Tabs - hidden in forgot mode */}
          {view !== 'forgot' && (
            <div className={`login-tabs ${view === 'signup' ? 'signup' : ''}`}>
              <div className="login-tab-indicator" />
              <button
                type="button"
                className={`login-tab ${view === 'login' ? 'active' : ''}`}
                onClick={() => switchView('login')}
              >
                Connexion
              </button>
              <button
                type="button"
                className={`login-tab ${view === 'signup' ? 'active' : ''}`}
                onClick={() => switchView('signup')}
              >
                Inscription
              </button>
            </div>
          )}

          {/* Forgot password header */}
          {view === 'forgot' && (
            <div className="login-card-header">
              <button
                type="button"
                className="login-back-btn"
                onClick={() => switchView('login')}
              >
                <ArrowLeftIcon />
                Retour
              </button>
              <h2>Mot de passe oublié</h2>
              <p>Entrez votre email pour recevoir un lien de réinitialisation</p>
            </div>
          )}

          {/* Error Banner */}
          <div className={`login-error-banner ${error ? 'show' : ''}`}>
            <AlertIcon />
            <p>{error}</p>
          </div>

          {/* Forgot Password Form */}
          {view === 'forgot' && (
            <div className="login-form active">
              {resetEmailSent ? (
                <div className="login-success-box">
                  <div className="login-success-icon"><CheckCircleIcon /></div>
                  <div className="login-success-title">Email envoyé !</div>
                  <p>
                    Si un compte existe avec l'adresse <strong>{email}</strong>,
                    vous recevrez un lien de réinitialisation dans quelques instants.
                  </p>
                  <p className="login-activation-hint">
                    Pensez à vérifier vos spams si vous ne voyez pas l'email.
                  </p>
                  <button
                    type="button"
                    className="login-btn-secondary"
                    onClick={() => switchView('login')}
                  >
                    Retour à la connexion
                  </button>

                  <div className="login-alt-help">
                    <p>Vous n'avez pas accès à votre email ?</p>
                    <a
                      href={`https://wa.me/${WHATSAPP_ACTIVATION_NUMBER}?text=${encodeURIComponent(
                        `Bonjour, je n'ai plus accès à mon email et j'aimerais réinitialiser mon mot de passe sur l'arbre généalogique Aly Koïra.\n\nEmail du compte: ${email}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="login-whatsapp-link"
                    >
                      <span className="wa-icon">💬</span>
                      Demander de l'aide via WhatsApp
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="login-field">
                    <label className="login-field-label">Adresse email</label>
                    <div className="login-input-wrap">
                      <input
                        ref={emailRef}
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyPress}
                      />
                      <EnvelopeIcon />
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`login-btn ${submitting ? 'loading' : ''}`}
                    onClick={handleForgotPassword}
                    disabled={submitting}
                  >
                    <span className="login-btn-text">Envoyer le lien</span>
                    <span className="login-btn-spinner" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Login Form */}
          <div className={`login-form ${view === 'login' ? 'active' : ''}`}>
            <div className="login-field">
              <label className="login-field-label">Adresse email</label>
              <div className="login-input-wrap">
                <input
                  ref={emailRef}
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <EnvelopeIcon />
              </div>
            </div>

            <div className="login-field">
              <label className="login-field-label">Mot de passe</label>
              <div className="login-input-wrap has-toggle">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <LockIcon />
                <button
                  type="button"
                  className="login-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <button
                type="button"
                className="login-forgot-link"
                onClick={() => switchView('forgot')}
              >
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="button"
              className={`login-btn ${submitting ? 'loading' : ''}`}
              onClick={handleLogin}
              disabled={submitting}
            >
              <span className="login-btn-text">Se connecter</span>
              <span className="login-btn-spinner" />
            </button>

            {/* Compte non activé */}
            {notActivated && (
              <div className="login-activation-box warning">
                <div className="login-activation-icon">🔒</div>
                <div className="login-activation-title">Compte non activé</div>
                <p>
                  Votre compte existe mais n'a pas encore été activé par un administrateur.
                </p>
                <p className="login-activation-hint">
                  Pour demander l'activation, contactez un administrateur via WhatsApp :
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_ACTIVATION_NUMBER}?text=${encodeURIComponent(
                    `Bonjour, je souhaite activer mon compte sur l'arbre généalogique Aly Koïra.\n\nNom: ${notActivated.displayName}\nEmail: ${notActivated.email}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="login-whatsapp-btn"
                >
                  <span className="wa-icon">💬</span>
                  Demander l'activation via WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Signup Form */}
          <div className={`login-form ${view === 'signup' ? 'active' : ''}`}>
            <div className="login-field">
              <label className="login-field-label">Adresse email</label>
              <div className="login-input-wrap">
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <EnvelopeIcon />
              </div>
            </div>

            <div className="login-field">
              <label className="login-field-label">Mot de passe</label>
              <div className="login-input-wrap has-toggle">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <LockIcon />
                <button
                  type="button"
                  className="login-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <div className={`login-pwd-strength ${passwordStrength.level}`}>
                <div className="login-pwd-strength-bar">
                  <span /><span /><span /><span />
                </div>
                <div className="login-pwd-strength-text">{passwordStrength.text}</div>
              </div>
            </div>

            <div className="login-field">
              <label className="login-field-label">Nom d'affichage</label>
              <div className="login-input-wrap">
                <input
                  type="text"
                  placeholder="Ex: Moussa Ali"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <UserIcon />
              </div>
              <p className="login-field-helper">Ce nom sera visible par les autres membres de la famille</p>
            </div>

            <button
              type="button"
              className={`login-btn ${submitting ? 'loading' : ''}`}
              onClick={handleSignup}
              disabled={submitting}
            >
              <span className="login-btn-text">Créer mon compte</span>
              <span className="login-btn-spinner" />
            </button>

            {success && success !== 'ACTIVATION_NEEDED' && (
              <div className="login-success">{success}</div>
            )}

            {/* Compte créé avec succès */}
            {success === 'ACTIVATION_NEEDED' && (
              <div className="login-activation-box">
                <div className="login-activation-icon">✅</div>
                <div className="login-activation-title">Compte créé avec succès !</div>
                <p>
                  Votre compte doit être activé par un administrateur avant de pouvoir
                  vous connecter.
                </p>
                <p className="login-activation-hint">
                  Pour demander l'activation, contactez un administrateur via WhatsApp :
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_ACTIVATION_NUMBER}?text=${encodeURIComponent(
                    `Bonjour, je souhaite activer mon compte sur l'arbre généalogique Aly Koïra.\n\nNom: ${displayName}\nEmail: ${email}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="login-whatsapp-btn"
                >
                  <span className="wa-icon">💬</span>
                  Demander l'activation via WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <span>🔒</span> Espace privé familial
        </div>
      </div>
    </div>
  );
}

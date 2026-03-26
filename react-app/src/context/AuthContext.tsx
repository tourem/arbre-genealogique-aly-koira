import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/types';

interface LoginResult {
  error?: string;
  notActivated?: boolean;
  email?: string;
  displayName?: string;
}

interface SignupResult {
  error?: string;
  needsActivation?: boolean;
}

interface ResetPasswordResult {
  error?: string;
  success?: boolean;
}

interface UpdatePasswordResult {
  error?: string;
  success?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isActive: boolean;
  isRecoveryMode: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (email: string, password: string, displayName: string) => Promise<SignupResult>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<ResetPasswordResult>;
  updatePassword: (newPassword: string) => Promise<UpdatePasswordResult>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, role, is_active')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as UserProfile;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // --- Demarrage : verifier la session existante ---
  useEffect(() => {
    let cancelled = false;

    // Vérifier si on est en mode recovery via le hash de l'URL
    const checkRecoveryFromUrl = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        setIsRecoveryMode(true);
        return true;
      }
      return false;
    };

    async function init() {
      // Vérifier le mode recovery en premier
      const isRecovery = checkRecoveryFromUrl();

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session?.user) {
          // Si on est en mode recovery, ne pas charger le profil complet
          if (!isRecovery) {
            const profile = await fetchProfile(session.user.id);
            if (!cancelled) setUser(profile);
          }
        }
      } catch {
        // Session corrompue/expiree — on la nettoie
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    // Ecouter logout, refresh token et password recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;
        if (event === 'PASSWORD_RECOVERY') {
          // L'utilisateur a cliqué sur le lien de réinitialisation
          setIsRecoveryMode(true);
        }
        if (!session) {
          setUser(null);
          setIsRecoveryMode(false);
        }
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // --- Login : signIn + fetch profil dans le meme appel ---
  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        // Nettoyer toute session perimee avant de se connecter
        await supabase.auth.signOut().catch(() => {});

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          // Si erreur d'authentification, vérifier si c'est un compte non activé
          if (error.message === 'Invalid login credentials' || error.message === 'Email not confirmed') {
            try {
              // Vérifier si un profil existe avec cet email et n'est pas activé
              const { data: activationData, error: rpcError } = await supabase
                .rpc('check_account_activation', { user_email: email });

              console.log('Activation check:', { email, activationData, rpcError });

              if (!rpcError && activationData) {
                // Le résultat peut être un tableau ou un objet unique
                const result = Array.isArray(activationData) ? activationData[0] : activationData;
                if (result && result.is_inactive === true) {
                  return {
                    notActivated: true,
                    email: email,
                    displayName: result.display_name || '',
                  };
                }
              }
            } catch (rpcErr) {
              console.error('RPC error:', rpcErr);
            }

            return { error: 'Email ou mot de passe incorrect' };
          }
          return { error: error.message };
        }

        // Recuperer le profil immediatement
        if (data.user) {
          const profile = await fetchProfile(data.user.id);
          if (profile) {
            // Vérifier si le compte est activé
            if (!profile.is_active) {
              // Déconnecter l'utilisateur car son compte n'est pas activé
              await supabase.auth.signOut().catch(() => {});
              return {
                notActivated: true,
                email: profile.email,
                displayName: profile.display_name,
              };
            }
            setUser(profile);
          } else {
            return { error: 'Profil introuvable. Contactez un administrateur.' };
          }
        }

        return {};
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Erreur de connexion' };
      }
    },
    [],
  );

  const signup = useCallback(
    async (email: string, password: string, displayName: string): Promise<SignupResult> => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) {
          if (error.message.includes('already registered')) {
            return { error: 'Un compte existe déjà avec cette adresse email. Essayez de vous connecter.' };
          }
          if (error.message.includes('Database error')) {
            return { error: 'Erreur serveur lors de la création du compte. Contactez un administrateur.' };
          }
          return { error: error.message };
        }
        // Inscription réussie - le compte doit être activé par un admin
        return { needsActivation: true };
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Erreur lors de l\'inscription' };
      }
    },
    [],
  );

  const resetPassword = useCallback(
    async (email: string): Promise<ResetPasswordResult> => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`,
        });
        if (error) {
          return { error: error.message };
        }
        return { success: true };
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Erreur lors de l\'envoi' };
      }
    },
    [],
  );

  const updatePassword = useCallback(
    async (newPassword: string): Promise<UpdatePasswordResult> => {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          return { error: error.message };
        }
        setIsRecoveryMode(false);
        return { success: true };
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour' };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    setUser(null);
    setIsRecoveryMode(false);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isActive = user?.is_active ?? false;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isActive, isRecoveryMode, login, signup, logout, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

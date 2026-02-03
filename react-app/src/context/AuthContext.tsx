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

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, role')
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

  // --- Demarrage : verifier la session existante ---
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (!cancelled) setUser(profile);
        }
      } catch {
        // Session corrompue/expiree — on la nettoie
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    // Ecouter logout et refresh token (pas utilise pour le login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return;
        if (!session) {
          setUser(null);
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
    async (email: string, password: string): Promise<{ error?: string }> => {
      try {
        // Nettoyer toute session perimee avant de se connecter
        await supabase.auth.signOut().catch(() => {});

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          if (error.message === 'Invalid login credentials') {
            return { error: 'Email ou mot de passe incorrect' };
          }
          return { error: error.message };
        }

        // Recuperer le profil immediatement
        if (data.user) {
          const profile = await fetchProfile(data.user.id);
          if (profile) {
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
    async (email: string, password: string, displayName: string): Promise<{ error?: string }> => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) {
          if (error.message.includes('already registered')) {
            return { error: 'Cet email est d\u00E9j\u00E0 utilis\u00E9' };
          }
          if (error.message.includes('Database error')) {
            return { error: 'Erreur serveur lors de la cr\u00E9ation du compte. Contactez un administrateur.' };
          }
          return { error: error.message };
        }
        return {};
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Erreur lors de l\'inscription' };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

-- ═══════════════════════════════════════════════════════════════
-- Migration: Activation des comptes utilisateurs
-- A executer dans le Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ═══ 1. AJOUT COLONNE is_active SUR PROFILES ═══
-- Par défaut false = les nouveaux comptes doivent être activés par un admin

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE;

-- Activer tous les comptes existants (pour ne pas bloquer les utilisateurs actuels)
UPDATE profiles SET is_active = TRUE WHERE is_active = FALSE;

-- ═══ 2. MISE À JOUR DU TRIGGER DE CRÉATION DE PROFIL ═══
-- Les nouveaux utilisateurs sont créés avec is_active = false

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    'user',
    FALSE  -- Compte inactif par défaut
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ═══ 3. FONCTION HELPER POUR VÉRIFIER SI UN UTILISATEUR EST ACTIF ═══

CREATE OR REPLACE FUNCTION is_active_user() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══ 4. MISE À JOUR DES POLITIQUES RLS ═══
-- Les utilisateurs inactifs ne peuvent pas accéder aux données

-- Supprimer les anciennes politiques sur members (si elles existent)
DROP POLICY IF EXISTS "Users can read members" ON members;
DROP POLICY IF EXISTS "Authenticated users can read members" ON members;

-- Nouvelle politique: seuls les utilisateurs actifs peuvent lire les membres
CREATE POLICY "Active users can read members"
  ON members
  FOR SELECT
  TO authenticated
  USING (is_active_user());

-- Les admins restent les seuls à pouvoir modifier (pas de changement)
-- Les politiques INSERT/UPDATE/DELETE utilisent déjà is_admin()

-- ═══ 5. MISE À JOUR POLITIQUE SUR SUGGESTIONS ═══

DROP POLICY IF EXISTS "Users can view their own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Admins can view all suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can insert own suggestions" ON suggestions;

-- Nouvelle politique: seuls les utilisateurs actifs peuvent voir leurs suggestions
CREATE POLICY "Active users can view their own suggestions"
  ON suggestions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_active_user());

-- Les admins peuvent voir toutes les suggestions
CREATE POLICY "Admins can view all suggestions"
  ON suggestions
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Seuls les utilisateurs actifs peuvent créer des suggestions
CREATE POLICY "Active users can insert suggestions"
  ON suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_active_user());

-- ═══ 6. POLITIQUE SUR PROFILES ═══
-- Un utilisateur peut toujours voir son propre profil (même inactif)
-- pour qu'on puisse afficher le message d'attente d'activation

-- Les politiques existantes sur profiles restent inchangées

-- ═══ 7. FONCTION POUR VÉRIFIER LE STATUT D'ACTIVATION ═══
-- Cette fonction peut être appelée sans authentification pour vérifier
-- si un email correspond à un compte non activé

CREATE OR REPLACE FUNCTION check_account_activation(user_email TEXT)
RETURNS TABLE(is_inactive BOOLEAN, display_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    NOT p.is_active AS is_inactive,
    p.display_name
  FROM profiles p
  WHERE LOWER(p.email) = LOWER(user_email)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Autoriser l'appel anonyme de cette fonction
GRANT EXECUTE ON FUNCTION check_account_activation(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_account_activation(TEXT) TO authenticated;

-- ═══ FIN DE LA MIGRATION ═══

-- ═══════════════════════════════════════════════════════════════
-- Fix: "Database error saving new user" lors de l'inscription
--
-- Cause : le trigger handle_new_user() echoue car :
--   1) Il manque SET search_path = public sur la fonction SECURITY DEFINER
--   2) Il manque une policy INSERT sur la table profiles
--
-- A executer dans le Supabase SQL Editor (Dashboard > SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- 1. Recreer la fonction trigger avec le search_path correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. S'assurer que le trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Ajouter la policy INSERT manquante sur profiles
-- (permet au trigger SECURITY DEFINER d'inserer, et aussi a l'utilisateur
--  de voir son propre profil juste apres creation)
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (true);

-- 4. Verifier que les policies SELECT et UPDATE existent
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (is_admin());

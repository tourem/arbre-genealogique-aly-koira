-- =============================================================
-- Schema: Systeme de roles ADMIN / USER avec Supabase Auth
-- =============================================================

-- 1. Table profiles (liee a auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Trigger auto-creation de profil a l'inscription
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Table suggestions
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('add', 'edit', 'delete')),
  member_id TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- RLS Policies
-- =============================================================

-- Helper: verifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- profiles ----

-- Chacun voit son propre profil ; les admins voient tous les profils
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR is_admin()
  );

-- Seuls les admins peuvent modifier les profils
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (is_admin());

-- ---- members ----

-- SELECT : tous les utilisateurs authentifies
DROP POLICY IF EXISTS "members_select" ON members;
CREATE POLICY "members_select" ON members
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT : admins uniquement
DROP POLICY IF EXISTS "members_insert" ON members;
CREATE POLICY "members_insert" ON members
  FOR INSERT WITH CHECK (is_admin());

-- UPDATE : admins uniquement
DROP POLICY IF EXISTS "members_update" ON members;
CREATE POLICY "members_update" ON members
  FOR UPDATE USING (is_admin());

-- DELETE : admins uniquement
DROP POLICY IF EXISTS "members_delete" ON members;
CREATE POLICY "members_delete" ON members
  FOR DELETE USING (is_admin());

-- ---- suggestions ----

-- SELECT : ses propres suggestions ; admins voient toutes
CREATE POLICY "suggestions_select" ON suggestions
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

-- INSERT : tout utilisateur authentifie
CREATE POLICY "suggestions_insert" ON suggestions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE : admins uniquement (pour changer le statut)
CREATE POLICY "suggestions_update" ON suggestions
  FOR UPDATE USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- SCHEMA - Arbre Genealogique Aly Koira
-- A executer en PREMIER dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Supprimer la table si elle existe deja (optionnel)
-- DROP TABLE IF EXISTS members;

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  alias TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  generation INTEGER NOT NULL,
  father_id TEXT,
  mother_ref TEXT,
  spouses TEXT[] DEFAULT '{}',
  children TEXT[] DEFAULT '{}'
);

-- Index pour accelerer les requetes
CREATE INDEX IF NOT EXISTS idx_members_generation ON members (generation);
CREATE INDEX IF NOT EXISTS idx_members_father_id ON members (father_id);
CREATE INDEX IF NOT EXISTS idx_members_mother_ref ON members (mother_ref);
CREATE INDEX IF NOT EXISTS idx_members_gender ON members (gender);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Lecture publique (anon key), ecriture admin seulement
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : tout le monde peut lire
CREATE POLICY "Lecture publique des membres"
  ON members FOR SELECT
  USING (true);

-- Politique d'insertion : seulement service_role
CREATE POLICY "Insertion admin seulement"
  ON members FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Politique de mise a jour : seulement service_role
CREATE POLICY "Mise a jour admin seulement"
  ON members FOR UPDATE
  USING (auth.role() = 'service_role');

-- Politique de suppression : seulement service_role
CREATE POLICY "Suppression admin seulement"
  ON members FOR DELETE
  USING (auth.role() = 'service_role');

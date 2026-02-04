-- ═══════════════════════════════════════════════════════════════
-- Migration: Ajout champs membres (identite + origine)
-- A executer dans le Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE members ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS birth_city TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS birth_country TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS village TEXT;

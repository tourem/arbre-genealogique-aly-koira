-- Migration : ajout du champ "note" sur chaque membre
-- A executer dans le SQL Editor de Supabase

ALTER TABLE members ADD COLUMN IF NOT EXISTS note TEXT DEFAULT NULL;

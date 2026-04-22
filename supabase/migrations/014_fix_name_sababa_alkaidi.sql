-- Migration : correction orthographique "Sabalkaidi" -> "Sababa Alkaidi"
-- Le nom avait été saisi en un seul mot dans le corpus initial.
-- La forme correcte, validée par la famille, est en deux mots :
-- "Sababa Alkaidi".
--
-- Impact : toutes les occurrences du membre "Sabalkaidi" (y compris dans
-- les noms composés comme "Alkamahamane Sabalkaidi", "Sabalkaidi Hamma")
-- sont remplacées via REGEXP_REPLACE. Les IDs (UUID), les relations
-- parents/enfants/conjoints, les liens de parenté restent intacts.
--
-- Cette migration est IDEMPOTENTE : relancer ne change rien si les
-- occurrences ont déjà été corrigées.
--
-- Colonnes mises à jour si elles existent :
--   members.name, members.first_name, members.alias, members.mother_ref,
--   members.note, suggestions.payload.

BEGIN;

-- 1. members.name (colonne toujours présente)
UPDATE members
   SET name = REGEXP_REPLACE(name, 'Sabalkaidi', 'Sababa Alkaidi', 'g')
 WHERE name LIKE '%Sabalkaidi%';

-- 2. first_name (migration 003) — conditionnel pour tolérer les schémas anciens
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'members' AND column_name = 'first_name') THEN
    UPDATE members
       SET first_name = REGEXP_REPLACE(first_name, 'Sabalkaidi', 'Sababa Alkaidi', 'g')
     WHERE first_name LIKE '%Sabalkaidi%';
  END IF;
END $$;

-- 3. alias
UPDATE members
   SET alias = REGEXP_REPLACE(alias, 'Sabalkaidi', 'Sababa Alkaidi', 'g')
 WHERE alias LIKE '%Sabalkaidi%';

-- 4. mother_ref (texte libre pour les mères sans fiche dédiée)
UPDATE members
   SET mother_ref = REGEXP_REPLACE(mother_ref, 'Sabalkaidi', 'Sababa Alkaidi', 'g')
 WHERE mother_ref LIKE '%Sabalkaidi%';

-- 5. note (migration 002) — conditionnel
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'members' AND column_name = 'note') THEN
    UPDATE members
       SET note = REGEXP_REPLACE(note, 'Sabalkaidi', 'Sababa Alkaidi', 'g')
     WHERE note LIKE '%Sabalkaidi%';
  END IF;
END $$;

-- 6. suggestions.payload (JSONB) — conditionnel
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_name = 'suggestions') THEN
    UPDATE suggestions
       SET payload = REGEXP_REPLACE(payload::text, 'Sabalkaidi', 'Sababa Alkaidi', 'g')::jsonb
     WHERE payload::text LIKE '%Sabalkaidi%';
  END IF;
END $$;

COMMIT;

-- Vérification post-migration : la requête suivante doit retourner 0
-- SELECT COUNT(*) FROM members
--  WHERE name LIKE '%Sabalkaidi%'
--     OR COALESCE(alias, '') LIKE '%Sabalkaidi%'
--     OR COALESCE(mother_ref, '') LIKE '%Sabalkaidi%';

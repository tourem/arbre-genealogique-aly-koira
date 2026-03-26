-- ============================================================================
-- MIGRATION CRITIQUE : Harmonisation de tous les IDs vers UUID
-- ============================================================================
--
-- AVANT D'EXÉCUTER :
-- 1. Faites un BACKUP complet de la table members
-- 2. Testez d'abord sur un environnement de développement
--
-- Cette migration :
-- 1. Crée une table de mapping ancien_id → nouveau_uuid
-- 2. Met à jour tous les IDs des membres
-- 3. Met à jour toutes les références (father_id, spouses, children, mother_ref)
-- 4. Met à jour les tables liées (merge_history)
-- ============================================================================

-- Étape 0 : Créer une table de backup (optionnel mais recommandé)
CREATE TABLE IF NOT EXISTS members_backup_before_uuid AS SELECT * FROM members;

-- Étape 1 : Créer la table de mapping
DROP TABLE IF EXISTS id_migration_map;
CREATE TABLE id_migration_map (
    old_id TEXT PRIMARY KEY,
    new_id TEXT NOT NULL
);

-- Étape 2 : Générer les mappings pour tous les IDs non-UUID
INSERT INTO id_migration_map (old_id, new_id)
SELECT
    id as old_id,
    gen_random_uuid()::TEXT as new_id
FROM members
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Pour les IDs déjà UUID, on garde le même
INSERT INTO id_migration_map (old_id, new_id)
SELECT id, id FROM members
WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
ON CONFLICT (old_id) DO NOTHING;

-- Afficher le nombre de mappings créés
DO $$
DECLARE
    total_count INT;
    to_migrate INT;
BEGIN
    SELECT COUNT(*) INTO total_count FROM id_migration_map;
    SELECT COUNT(*) INTO to_migrate FROM id_migration_map WHERE old_id != new_id;
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Mappings créés : % total, % à migrer', total_count, to_migrate;
    RAISE NOTICE '===========================================';
END $$;

-- ============================================================================
-- Étape 3 : Mise à jour des références AVANT de changer les IDs principaux
-- ============================================================================

-- 3a. Mettre à jour father_id
UPDATE members m
SET father_id = map.new_id
FROM id_migration_map map
WHERE m.father_id = map.old_id
  AND map.old_id != map.new_id;

-- 3b. Mettre à jour mother_ref (si c'est un ID, pas un nom)
UPDATE members m
SET mother_ref = map.new_id
FROM id_migration_map map
WHERE m.mother_ref = map.old_id
  AND map.old_id != map.new_id;

-- 3c. Mettre à jour spouses[] array
UPDATE members
SET spouses = (
    SELECT COALESCE(
        array_agg(COALESCE(map.new_id, spouse_ref)),
        ARRAY[]::TEXT[]
    )
    FROM unnest(spouses) AS spouse_ref
    LEFT JOIN id_migration_map map ON map.old_id = spouse_ref
)
WHERE spouses IS NOT NULL AND array_length(spouses, 1) > 0;

-- 3d. Mettre à jour children[] array
UPDATE members
SET children = (
    SELECT COALESCE(
        array_agg(COALESCE(map.new_id, child_ref)),
        ARRAY[]::TEXT[]
    )
    FROM unnest(children) AS child_ref
    LEFT JOIN id_migration_map map ON map.old_id = child_ref
)
WHERE children IS NOT NULL AND array_length(children, 1) > 0;

-- 3e. Mettre à jour merge_history si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merge_history') THEN
        UPDATE merge_history mh
        SET source_id = map.new_id
        FROM id_migration_map map
        WHERE mh.source_id = map.old_id AND map.old_id != map.new_id;

        UPDATE merge_history mh
        SET target_id = map.new_id
        FROM id_migration_map map
        WHERE mh.target_id = map.old_id AND map.old_id != map.new_id;

        RAISE NOTICE 'merge_history updated';
    END IF;
END $$;

-- ============================================================================
-- Étape 4 : Mettre à jour les IDs principaux (le plus délicat)
-- ============================================================================

-- On doit désactiver temporairement les contraintes ou procéder membre par membre
-- Pour éviter les conflits, on utilise une approche en deux passes

DO $$
DECLARE
    rec RECORD;
    updated_count INT := 0;
BEGIN
    RAISE NOTICE 'Mise à jour des IDs principaux...';

    -- Désactiver temporairement les triggers si nécessaire
    -- ALTER TABLE members DISABLE TRIGGER ALL;

    FOR rec IN
        SELECT old_id, new_id
        FROM id_migration_map
        WHERE old_id != new_id
        ORDER BY old_id
    LOOP
        -- Vérifier que le nouveau ID n'existe pas déjà
        IF NOT EXISTS (SELECT 1 FROM members WHERE id = rec.new_id) THEN
            UPDATE members SET id = rec.new_id WHERE id = rec.old_id;
            updated_count := updated_count + 1;

            IF updated_count % 50 = 0 THEN
                RAISE NOTICE 'Progression : % membres mis à jour', updated_count;
            END IF;
        ELSE
            RAISE WARNING 'ID % existe déjà, ignoré pour %', rec.new_id, rec.old_id;
        END IF;
    END LOOP;

    -- Réactiver les triggers
    -- ALTER TABLE members ENABLE TRIGGER ALL;

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Migration terminée ! % IDs mis à jour', updated_count;
    RAISE NOTICE '===========================================';
END $$;

-- ============================================================================
-- Étape 5 : Vérification
-- ============================================================================

-- Vérifier qu'il n'y a plus d'IDs non-UUID
SELECT
    'IDs non-UUID restants (devrait être 0)' as verification,
    COUNT(*) as count
FROM members
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Vérifier les références orphelines
SELECT
    'father_id orphelins' as verification,
    COUNT(*) as count
FROM members m
WHERE m.father_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM members WHERE id = m.father_id);

-- Vérifier les spouses orphelins
SELECT
    'spouses orphelins' as verification,
    COUNT(*) as count
FROM members m, unnest(m.spouses) as spouse_ref
WHERE spouse_ref IS NOT NULL
  AND spouse_ref != ''
  AND NOT EXISTS (SELECT 1 FROM members WHERE id = spouse_ref);

-- Vérifier les children orphelins
SELECT
    'children orphelins' as verification,
    COUNT(*) as count
FROM members m, unnest(m.children) as child_ref
WHERE child_ref IS NOT NULL
  AND child_ref != ''
  AND NOT EXISTS (SELECT 1 FROM members WHERE id = child_ref);

-- ============================================================================
-- Étape 6 : Conserver le mapping pour référence (optionnel)
-- ============================================================================
-- La table id_migration_map reste disponible pour référence
-- Vous pouvez la supprimer plus tard avec : DROP TABLE id_migration_map;

-- Afficher quelques exemples de mapping
SELECT old_id, new_id
FROM id_migration_map
WHERE old_id != new_id
LIMIT 10;

-- ============================================================================
-- Étape 7 : Afficher les nouveaux UUIDs des membres importants (roots)
-- ============================================================================
SELECT
    'Nouveaux UUIDs des membres importants' as info,
    m.name,
    m.id as new_uuid,
    map.old_id as ancien_id
FROM members m
LEFT JOIN id_migration_map map ON map.new_id = m.id
WHERE m.name ILIKE ANY(ARRAY[
    '%alkamahamane%',
    '%ali alkama%',
    '%mahamane%',
    '%babachigaw%',
    '%moussa ali%'
])
AND m.generation <= 5
ORDER BY m.generation, m.name
LIMIT 20;

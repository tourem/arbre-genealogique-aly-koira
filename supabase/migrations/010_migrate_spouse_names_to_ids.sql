-- Migration: Convert spouse names to member IDs
-- This migration creates new members for spouses stored as names and updates references

-- Temporary function to generate UUIDs for new members
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    member_rec RECORD;
    spouse_name TEXT;
    spouse_names TEXT[];
    new_id UUID;
    spouse_gender TEXT;
    existing_id TEXT;
    updated_spouses TEXT[];
    created_count INT := 0;
    updated_count INT := 0;
BEGIN
    RAISE NOTICE 'Starting spouse migration...';

    -- Loop through all members with spouses
    FOR member_rec IN
        SELECT id, name, gender, generation, spouses
        FROM members
        WHERE spouses IS NOT NULL AND array_length(spouses, 1) > 0
    LOOP
        updated_spouses := ARRAY[]::TEXT[];

        -- Process each spouse reference
        FOREACH spouse_name IN ARRAY member_rec.spouses
        LOOP
            -- Skip empty values
            IF spouse_name IS NULL OR trim(spouse_name) = '' THEN
                CONTINUE;
            END IF;

            -- Check if this is already a valid member ID
            SELECT id INTO existing_id FROM members WHERE id = spouse_name;

            IF existing_id IS NOT NULL THEN
                -- Already a valid ID, keep it
                updated_spouses := array_append(updated_spouses, spouse_name);
            ELSE
                -- Check if this name was already migrated (exists as a member name with UUID id)
                SELECT id INTO existing_id
                FROM members
                WHERE lower(name) = lower(trim(spouse_name))
                  AND id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                LIMIT 1;

                IF existing_id IS NOT NULL THEN
                    -- Already migrated, use the existing ID
                    updated_spouses := array_append(updated_spouses, existing_id);
                    RAISE NOTICE 'Reusing existing member for "%": %', spouse_name, existing_id;
                ELSE
                    -- Need to create a new member
                    new_id := gen_random_uuid();
                    spouse_gender := CASE WHEN member_rec.gender = 'M' THEN 'F' ELSE 'M' END;

                    -- Insert new member
                    INSERT INTO members (
                        id, name, gender, generation, father_id, mother_ref,
                        spouses, children, note, alias, first_name,
                        photo_url, birth_city, birth_country, village
                    ) VALUES (
                        new_id::TEXT,
                        trim(spouse_name),
                        spouse_gender,
                        member_rec.generation,
                        NULL, NULL,
                        ARRAY[member_rec.id]::TEXT[], -- Bidirectional: point back to the referencing member
                        ARRAY[]::TEXT[],
                        NULL, NULL, NULL, NULL, NULL, NULL, NULL
                    );

                    updated_spouses := array_append(updated_spouses, new_id::TEXT);
                    created_count := created_count + 1;
                    RAISE NOTICE 'Created new member "%" with ID: %', spouse_name, new_id;
                END IF;
            END IF;
        END LOOP;

        -- Update member's spouses array if changed
        IF updated_spouses IS DISTINCT FROM member_rec.spouses THEN
            UPDATE members SET spouses = updated_spouses WHERE id = member_rec.id;
            updated_count := updated_count + 1;
            RAISE NOTICE 'Updated spouses for %: % -> %', member_rec.name, member_rec.spouses, updated_spouses;
        END IF;
    END LOOP;

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Migration complete!';
    RAISE NOTICE 'Created % new members', created_count;
    RAISE NOTICE 'Updated % members with new spouse IDs', updated_count;
    RAISE NOTICE '===========================================';
END $$;

-- Verify the migration
SELECT
    'Members with name-based spouse refs (should be 0)' as check_type,
    COUNT(*) as count
FROM members m, unnest(m.spouses) as spouse_ref
WHERE spouse_ref IS NOT NULL
  AND spouse_ref != ''
  AND NOT EXISTS (SELECT 1 FROM members WHERE id = spouse_ref)
  AND spouse_ref !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

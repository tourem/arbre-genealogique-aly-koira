-- Migration 015 : archivage doux 30 jours + RPCs de suppression
-- symetrique des relations.
--
-- Deux apports conjoints :
--   1) une colonne members.archived_at (timestamptz) pour le soft delete
--      des fiches (strategie : 30 jours de retention avant purge reelle) ;
--   2) trois fonctions PL/pgSQL qui retirent une relation SIMULTANEMENT
--      des deux cotes, au sein d'une meme transaction (BEGIN/EXCEPTION),
--      pour que le client ne puisse jamais laisser la base dans un etat
--      incoherent (p.ex. A.spouses contient B mais pas l'inverse).
--
-- Invariant central : toute suppression de relation est symetrique.
-- Le client n'a pas a le decider, c'est enforced par ces fonctions.
--
-- Migration IDEMPOTENTE : ADD COLUMN IF NOT EXISTS + CREATE OR REPLACE.

BEGIN;

-- ============================================================
-- 1. ARCHIVAGE DOUX DES FICHES
-- ============================================================
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index partiel : n'indexe que les lignes archivees (minoritaires),
-- utile au job quotidien de purge (archived_at < now() - '30 days').
CREATE INDEX IF NOT EXISTS idx_members_archived_at
  ON members(archived_at)
  WHERE archived_at IS NOT NULL;

COMMENT ON COLUMN members.archived_at IS
  'Soft delete timestamp. NULL = actif. Rempli = archive (30 jours pour annuler).';


-- ============================================================
-- 2. HELPER : retirer un element d'un array TEXT[]
-- ============================================================
CREATE OR REPLACE FUNCTION array_remove_elem(arr TEXT[], elem TEXT)
RETURNS TEXT[]
LANGUAGE SQL IMMUTABLE AS $$
  SELECT COALESCE(array_agg(e ORDER BY idx), ARRAY[]::TEXT[])
  FROM unnest(arr) WITH ORDINALITY AS t(e, idx)
  WHERE e IS DISTINCT FROM elem;
$$;


-- ============================================================
-- 3. RPC detach_parent(child_id, role)
--    Retire le lien parent-enfant des deux cotes :
--      - child.{father_id|mother_ref} := NULL
--      - parent.children := children SANS child_id
--    Role = 'father' | 'mother'.
-- ============================================================
CREATE OR REPLACE FUNCTION detach_parent(
  p_child_id TEXT,
  p_role     TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_parent_id TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin required';
  END IF;

  IF p_role NOT IN ('father', 'mother') THEN
    RAISE EXCEPTION 'invalid role: % (expected father|mother)', p_role;
  END IF;

  -- Recupere le parent avant de l'effacer
  IF p_role = 'father' THEN
    SELECT father_id INTO v_parent_id FROM members WHERE id = p_child_id;
  ELSE
    SELECT mother_ref INTO v_parent_id FROM members WHERE id = p_child_id;
  END IF;

  -- Efface le lien cote enfant
  IF p_role = 'father' THEN
    UPDATE members SET father_id = NULL WHERE id = p_child_id;
  ELSE
    UPDATE members SET mother_ref = NULL WHERE id = p_child_id;
  END IF;

  -- Efface le lien cote parent (si parent est bien une fiche referencee par UUID)
  IF v_parent_id IS NOT NULL THEN
    UPDATE members
       SET children = array_remove_elem(children, p_child_id)
     WHERE id = v_parent_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION detach_parent(TEXT, TEXT) TO authenticated;


-- ============================================================
-- 4. RPC dissolve_marriage(a_id, b_id)
--    Retire la relation d'epoux DES DEUX COTES.
--    Ne touche PAS aux enfants : ils conservent leurs parents.
-- ============================================================
CREATE OR REPLACE FUNCTION dissolve_marriage(
  p_a_id TEXT,
  p_b_id TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin required';
  END IF;

  UPDATE members
     SET spouses = array_remove_elem(spouses, p_b_id)
   WHERE id = p_a_id;

  UPDATE members
     SET spouses = array_remove_elem(spouses, p_a_id)
   WHERE id = p_b_id;
END;
$$;

GRANT EXECUTE ON FUNCTION dissolve_marriage(TEXT, TEXT) TO authenticated;


-- ============================================================
-- 5. RPC detach_child_from_foyer(child_id)
--    Detache un enfant de son foyer : clear father_id + mother_ref
--    du cote enfant, et retrait de children[] des DEUX parents.
--    La fiche enfant reste intacte — seulement les liens disparaissent.
-- ============================================================
CREATE OR REPLACE FUNCTION detach_child_from_foyer(
  p_child_id TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_father_id TEXT;
  v_mother_id TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin required';
  END IF;

  SELECT father_id, mother_ref
    INTO v_father_id, v_mother_id
    FROM members
   WHERE id = p_child_id;

  UPDATE members
     SET father_id = NULL, mother_ref = NULL
   WHERE id = p_child_id;

  IF v_father_id IS NOT NULL THEN
    UPDATE members
       SET children = array_remove_elem(children, p_child_id)
     WHERE id = v_father_id;
  END IF;

  IF v_mother_id IS NOT NULL THEN
    UPDATE members
       SET children = array_remove_elem(children, p_child_id)
     WHERE id = v_mother_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION detach_child_from_foyer(TEXT) TO authenticated;


-- ============================================================
-- 6. RPC archive_member(member_id)
--    Soft delete : members.archived_at := now().
--    NE touche PAS aux relations (FK conservees pour 30 jours).
--    Un job quotidien hors scope de cette migration purge reellement.
-- ============================================================
CREATE OR REPLACE FUNCTION archive_member(p_member_id TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin required';
  END IF;

  UPDATE members
     SET archived_at = now()
   WHERE id = p_member_id
     AND archived_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION archive_member(TEXT) TO authenticated;


-- ============================================================
-- 7. RPC restore_member(member_id)
--    Annule l'archivage tant que le delai de 30 jours n'est pas ecoule.
-- ============================================================
CREATE OR REPLACE FUNCTION restore_member(p_member_id TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin required';
  END IF;

  UPDATE members
     SET archived_at = NULL
   WHERE id = p_member_id
     AND archived_at IS NOT NULL
     AND archived_at > now() - INTERVAL '30 days';
END;
$$;

GRANT EXECUTE ON FUNCTION restore_member(TEXT) TO authenticated;


COMMIT;

-- ============================================================
-- Verifications manuelles post-migration (a executer a la main) :
--
-- -- 1. Signature OK ?
-- SELECT proname, pg_get_function_arguments(oid)
--   FROM pg_proc WHERE proname IN
--   ('detach_parent', 'dissolve_marriage', 'detach_child_from_foyer',
--    'archive_member', 'restore_member');
--
-- -- 2. Colonne archived_at presente ?
-- SELECT column_name, data_type FROM information_schema.columns
--  WHERE table_name = 'members' AND column_name = 'archived_at';
--
-- -- 3. Dry-run symetrie (sur un clone de la base) :
-- -- Choisir un (parent_id, child_id) connu ; SELECT avant, appeler
-- -- detach_parent(child_id, 'father'), SELECT apres. Verifier que :
-- --   parent.children ne contient plus child_id
-- --   child.father_id est NULL
-- --   autre parent (mother) inchange
-- ============================================================

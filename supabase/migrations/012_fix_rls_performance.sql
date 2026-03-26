-- ============================================================================
-- MIGRATION : Corriger les warnings RLS Supabase
-- ============================================================================
-- 1. Supprimer les policies en doublon (anciennes en français)
-- 2. Remplacer auth.uid() par (select auth.uid()) pour éviter
--    la réévaluation par ligne
-- ============================================================================

-- ============================================================================
-- Étape 1 : Supprimer les anciennes policies dupliquées sur "members"
-- (Les policies "members_select", "members_insert", etc. restent)
-- ============================================================================

DROP POLICY IF EXISTS "Lecture publique des membres" ON public.members;
DROP POLICY IF EXISTS "Insertion admin seulement" ON public.members;
DROP POLICY IF EXISTS "Mise a jour admin seulement" ON public.members;
DROP POLICY IF EXISTS "Suppression admin seulement" ON public.members;

-- ============================================================================
-- Étape 2 : Supprimer les anciennes policies dupliquées sur "suggestions"
-- (Les policies "suggestions_select", "suggestions_insert" restent)
-- ============================================================================

DROP POLICY IF EXISTS "Active users can insert suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Active users can view their own suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Admins can view all suggestions" ON public.suggestions;

-- ============================================================================
-- Étape 3 : Corriger les policies restantes — auth.uid() → (select auth.uid())
-- On drop + recreate pour garantir la bonne syntaxe
-- ============================================================================

-- --- members ---

DROP POLICY IF EXISTS "members_select" ON public.members;
CREATE POLICY "members_select" ON public.members
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Active users can read members" ON public.members;
-- (supprimé, members_select avec true suffit)

DROP POLICY IF EXISTS "members_insert" ON public.members;
CREATE POLICY "members_insert" ON public.members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "members_update" ON public.members;
CREATE POLICY "members_update" ON public.members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "members_delete" ON public.members;
CREATE POLICY "members_delete" ON public.members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

-- --- profiles ---

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (
        (select auth.uid()) = id
    );

-- --- suggestions ---

DROP POLICY IF EXISTS "suggestions_select" ON public.suggestions;
CREATE POLICY "suggestions_select" ON public.suggestions
    FOR SELECT USING (
        (select auth.uid()) = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "suggestions_insert" ON public.suggestions;
CREATE POLICY "suggestions_insert" ON public.suggestions
    FOR INSERT WITH CHECK (
        (select auth.uid()) = user_id
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.is_active = true
        )
    );

-- --- merge_history ---

DROP POLICY IF EXISTS "Admins can insert merge history" ON public.merge_history;
DROP POLICY IF EXISTS "Admins can update merge history" ON public.merge_history;
DROP POLICY IF EXISTS "Admins can view merge history" ON public.merge_history;

DROP POLICY IF EXISTS "merge_history_select" ON public.merge_history;
CREATE POLICY "merge_history_select" ON public.merge_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "merge_history_insert" ON public.merge_history;
CREATE POLICY "merge_history_insert" ON public.merge_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "merge_history_update" ON public.merge_history;
CREATE POLICY "merge_history_update" ON public.merge_history
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

-- --- term_audit_log ---

DROP POLICY IF EXISTS "term_audit_log_insert" ON public.term_audit_log;
CREATE POLICY "term_audit_log_insert" ON public.term_audit_log
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

-- --- relation_categories (supprimer le doublon SELECT via admin_write) ---

DROP POLICY IF EXISTS "relation_categories_admin_write" ON public.relation_categories;
DROP POLICY IF EXISTS "relation_categories_admin_insert" ON public.relation_categories;
DROP POLICY IF EXISTS "relation_categories_admin_update" ON public.relation_categories;
DROP POLICY IF EXISTS "relation_categories_admin_delete" ON public.relation_categories;
DROP POLICY IF EXISTS "relation_categories_read" ON public.relation_categories;

CREATE POLICY "relation_categories_read" ON public.relation_categories
    FOR SELECT USING (true);

CREATE POLICY "relation_categories_admin_insert" ON public.relation_categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "relation_categories_admin_update" ON public.relation_categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "relation_categories_admin_delete" ON public.relation_categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

-- --- relation_terms (même correction) ---

DROP POLICY IF EXISTS "relation_terms_admin_write" ON public.relation_terms;
DROP POLICY IF EXISTS "relation_terms_admin_insert" ON public.relation_terms;
DROP POLICY IF EXISTS "relation_terms_admin_update" ON public.relation_terms;
DROP POLICY IF EXISTS "relation_terms_admin_delete" ON public.relation_terms;
DROP POLICY IF EXISTS "relation_terms_read" ON public.relation_terms;

CREATE POLICY "relation_terms_read" ON public.relation_terms
    FOR SELECT USING (true);

CREATE POLICY "relation_terms_admin_insert" ON public.relation_terms
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "relation_terms_admin_update" ON public.relation_terms
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "relation_terms_admin_delete" ON public.relation_terms
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- Étape 5 : Fixer search_path sur check_account_activation
-- Empêche l'injection via search_path mutable (warning SECURITY)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_account_activation(user_email TEXT)
RETURNS TABLE(is_inactive BOOLEAN, display_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    NOT p.is_active AS is_inactive,
    p.display_name
  FROM public.profiles p
  WHERE LOWER(p.email) = LOWER(user_email)
  LIMIT 1;
END;
$$;

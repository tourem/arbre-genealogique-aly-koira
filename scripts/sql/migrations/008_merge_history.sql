-- ═══════════════════════════════════════════════════════════════
-- Migration: Système de fusion avec historique et rollback
-- A executer dans le Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ═══ 1. AJOUT CHAMPS SOFT DELETE SUR MEMBERS ═══
-- Ces champs permettent de marquer un membre comme "fusionné" sans le supprimer

ALTER TABLE members ADD COLUMN IF NOT EXISTS merged BOOLEAN DEFAULT FALSE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS merged_into_id TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ;

-- Index pour filtrer efficacement les membres non-fusionnés
CREATE INDEX IF NOT EXISTS idx_members_merged ON members(merged) WHERE merged = FALSE;

-- ═══ 2. TABLE MERGE_HISTORY ═══
-- Stocke l'historique complet des fusions avec snapshot pour rollback

CREATE TABLE IF NOT EXISTS merge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- IDs des personnes impliquées
  source_id TEXT NOT NULL,          -- ID du doublon (personne supprimée)
  target_id TEXT NOT NULL,          -- ID de l'original (personne conservée)

  -- Métadonnées de l'opération
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Rollback
  reverted_at TIMESTAMPTZ,          -- NULL tant que la fusion est active
  reverted_by UUID REFERENCES auth.users(id),

  -- Statut: ACTIVE (peut être annulée), REVERTED (annulée), EXPIRED (> 30 jours)
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVERTED', 'EXPIRED')),

  -- Snapshot complet AVANT fusion (pour rollback)
  -- Contient: source (personne + relations), target (personne + relations)
  snapshot JSONB NOT NULL,

  -- Liste des opérations effectuées
  -- Chaque opération: {type, relationshipType, description, originalRelationId, createdRelationId}
  operations JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Contraintes
  CONSTRAINT merge_history_source_target_different CHECK (source_id != target_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_merge_history_status ON merge_history(status);
CREATE INDEX IF NOT EXISTS idx_merge_history_performed_at ON merge_history(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_merge_history_source_id ON merge_history(source_id);
CREATE INDEX IF NOT EXISTS idx_merge_history_target_id ON merge_history(target_id);

-- ═══ 3. ROW LEVEL SECURITY ═══

ALTER TABLE merge_history ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir l'historique des fusions
CREATE POLICY "Admins can view merge history"
  ON merge_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seuls les admins peuvent insérer des fusions
CREATE POLICY "Admins can insert merge history"
  ON merge_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seuls les admins peuvent mettre à jour (pour le rollback)
CREATE POLICY "Admins can update merge history"
  ON merge_history
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ═══ 4. FONCTION D'EXPIRATION AUTOMATIQUE ═══
-- Marque les fusions de plus de 30 jours comme EXPIRED

CREATE OR REPLACE FUNCTION expire_old_merges()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE merge_history
  SET status = 'EXPIRED'
  WHERE status = 'ACTIVE'
    AND performed_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ 5. VUE POUR MEMBRES NON-FUSIONNÉS ═══
-- Vue pratique pour les requêtes qui doivent exclure les membres fusionnés

CREATE OR REPLACE VIEW active_members AS
SELECT *
FROM members
WHERE merged = FALSE OR merged IS NULL;

-- ═══ 6. FONCTION UTILITAIRE: JOURS RESTANTS POUR ROLLBACK ═══

CREATE OR REPLACE FUNCTION merge_days_remaining(merge_performed_at TIMESTAMPTZ)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(0, 30 - EXTRACT(DAY FROM (NOW() - merge_performed_at))::INTEGER);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ═══ FIN DE LA MIGRATION ═══

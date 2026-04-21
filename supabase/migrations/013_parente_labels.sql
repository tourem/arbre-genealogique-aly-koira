-- supabase/migrations/013_parente_labels.sql
DROP TABLE IF EXISTS term_audit_log;
DROP TABLE IF EXISTS relation_terms;
DROP TABLE IF EXISTS relation_categories;
DROP FUNCTION IF EXISTS update_relation_terms_updated_at();

CREATE TABLE IF NOT EXISTS parente_labels (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_parente_labels_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_parente_labels_updated_at ON parente_labels;
CREATE TRIGGER trg_parente_labels_updated_at
  BEFORE UPDATE ON parente_labels
  FOR EACH ROW EXECUTE FUNCTION update_parente_labels_updated_at();

ALTER TABLE parente_labels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'parente_labels_read') THEN
    CREATE POLICY "parente_labels_read" ON parente_labels
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'parente_labels_admin_write') THEN
    CREATE POLICY "parente_labels_admin_write" ON parente_labels
      FOR ALL TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

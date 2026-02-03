-- ============================================================
-- Migration : Systeme de termes de parente Songhoy
-- Reference : algorithme-relations-songhoy.md
-- ============================================================

-- 1. Table des categories de relations
CREATE TABLE IF NOT EXISTS relation_categories (
  code TEXT PRIMARY KEY,
  label_songhoy TEXT,
  label_fr TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table des termes de parente
CREATE TABLE IF NOT EXISTS relation_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code TEXT NOT NULL REFERENCES relation_categories(code) ON DELETE CASCADE,
  term_code TEXT NOT NULL UNIQUE,
  term_songhoy TEXT NOT NULL,
  prononciation TEXT,
  label_fr TEXT NOT NULL,
  description TEXT,
  speaker_gender TEXT CHECK (speaker_gender IN ('M', 'F', 'ANY')),
  target_gender TEXT CHECK (target_gender IN ('M', 'F', 'ANY')),
  context_condition TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_relation_terms_category ON relation_terms(category_code);
CREATE INDEX IF NOT EXISTS idx_relation_terms_active ON relation_terms(is_active);

-- 3. Table d'audit des modifications
CREATE TABLE IF NOT EXISTS term_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID REFERENCES relation_terms(id) ON DELETE SET NULL,
  category_code TEXT REFERENCES relation_categories(code) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DEACTIVATE', 'REACTIVATE')),
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_term_audit_log_term ON term_audit_log(term_id);

-- 4. Trigger updated_at automatique
CREATE OR REPLACE FUNCTION update_relation_terms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_relation_terms_updated_at ON relation_terms;
CREATE TRIGGER trg_relation_terms_updated_at
  BEFORE UPDATE ON relation_terms
  FOR EACH ROW
  EXECUTE FUNCTION update_relation_terms_updated_at();

-- 5. RLS Policies
ALTER TABLE relation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE relation_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_audit_log ENABLE ROW LEVEL SECURITY;

-- Lecture : tout utilisateur authentifie
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'relation_categories_read') THEN
    CREATE POLICY "relation_categories_read" ON relation_categories
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'relation_terms_read') THEN
    CREATE POLICY "relation_terms_read" ON relation_terms
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'term_audit_log_read') THEN
    CREATE POLICY "term_audit_log_read" ON term_audit_log
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Ecriture : admin uniquement
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'relation_categories_admin_write') THEN
    CREATE POLICY "relation_categories_admin_write" ON relation_categories
      FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'relation_terms_admin_write') THEN
    CREATE POLICY "relation_terms_admin_write" ON relation_terms
      FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'term_audit_log_insert') THEN
    CREATE POLICY "term_audit_log_insert" ON term_audit_log
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- SEED DATA — Categories
-- ============================================================

INSERT INTO relation_categories (code, label_songhoy, label_fr, description, sort_order) VALUES
  ('PARENT',        NULL,                   'Parent direct',                 'Pere ou mere direct',                                      0),
  ('SIBLINGS',      NULL,                   'Freres et Soeurs',              'Enfants du meme parent direct',                            1),
  ('HALF_SIBLINGS', 'BABA FO IZAYES',       'Demi-freres/soeurs',            'Meme pere, meres differentes',                             2),
  ('COUSINS_PATRI', 'ARROUHINKAYE IZAY',    'Cousins patrilateraux',         'Peres sont freres',                                        3),
  ('COUSINS_MATRI', 'WAYUHINKAYE IZAY',     'Cousins matrilateraux',         'Meres sont soeurs, s''appellent aussi ARMA/WEYMA',         4),
  ('COUSINS_CROSS', 'BAASSEY',              'Cousins croises',               'Un pere et une mere sont frere/soeur',                     5),
  ('UNCLE_AUNT',    NULL,                   'Oncle / Tante',                 'Generation superieure, diff=1',                             6),
  ('NEPHEW_NIECE',  NULL,                   'Neveu / Niece',                 'Generation inferieure, diff=1',                             7),
  ('GRANDPARENT',   'KAAGA',                'Grand-parent / Ancetre',        'Generation superieure, diff>=2, avec niveau',               8),
  ('GRANDCHILD',    'HAAMA',                'Petit-enfant / Descendant',     'Generation inferieure, diff>=2',                            9)
ON CONFLICT (code) DO UPDATE SET
  label_songhoy = EXCLUDED.label_songhoy,
  label_fr = EXCLUDED.label_fr,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- SEED DATA — Termes de parente Songhoy
-- ============================================================

-- Parent direct (PARENT)
INSERT INTO relation_terms (category_code, term_code, term_songhoy, prononciation, label_fr, description, speaker_gender, target_gender, context_condition, is_active, display_order) VALUES
  ('PARENT', 'BABA', 'BABA', 'ba-ba', 'Pere',  'Pere direct', 'ANY', 'M', NULL, true, 1),
  ('PARENT', 'NIA',  'NIA',  'gnia',  'Mere',  'Mere directe', 'ANY', 'F', NULL, true, 2)
ON CONFLICT (term_code) DO UPDATE SET
  term_songhoy = EXCLUDED.term_songhoy,
  label_fr = EXCLUDED.label_fr;

-- Fratrie (SIBLINGS)
INSERT INTO relation_terms (category_code, term_code, term_songhoy, prononciation, label_fr, description, speaker_gender, target_gender, context_condition, is_active, display_order) VALUES
  ('SIBLINGS', 'ARMA',   'ARMA',   'ar-ma',    'Frere',                     'Frere — utilise par homme ou femme',                 'ANY', 'M', NULL,  true, 1),
  ('SIBLINGS', 'WAYMA',  'WAYMA',  'ouai-ma',  'Soeur (dit par un homme)',   'Soeur du point de vue d''un homme',                  'M',   'F', NULL,  true, 2),
  ('SIBLINGS', 'WEYMA',  'WEYMA',  'ouey-ma',  'Soeur (entre femmes)',       'Soeur du point de vue d''une femme',                  'F',   'F', NULL,  true, 3)
ON CONFLICT (term_code) DO UPDATE SET
  term_songhoy = EXCLUDED.term_songhoy,
  prononciation = EXCLUDED.prononciation,
  label_fr = EXCLUDED.label_fr,
  description = EXCLUDED.description;

-- Demi-fratrie (HALF_SIBLINGS)
INSERT INTO relation_terms (category_code, term_code, term_songhoy, prononciation, label_fr, description, speaker_gender, target_gender, context_condition, is_active, display_order) VALUES
  ('HALF_SIBLINGS', 'BABA_FO_IZAYES', 'BABA FO IZAYES', 'ba-ba fo i-zay', 'Demi-frere/soeur de meme pere', 'Meme pere, meres differentes — terme de lien', 'ANY', 'ANY', 'SAME_FATHER', true, 1)
ON CONFLICT (term_code) DO UPDATE SET
  term_songhoy = EXCLUDED.term_songhoy,
  label_fr = EXCLUDED.label_fr;

-- Cousins patrilateraux (COUSINS_PATRI)
INSERT INTO relation_terms (category_code, term_code, term_songhoy, prononciation, label_fr, description, speaker_gender, target_gender, context_condition, is_active, display_order) VALUES
  ('COUSINS_PATRI', 'ARROUHINKAYE_IZAY', 'ARROUHINKAYE IZAY', 'ar-rou-hin-kay i-zay', 'Cousins (peres freres)',       'Cousins paralleles patrilateraux — enfants de deux hommes', 'ANY', 'ANY', NULL,     true, 1),
  ('COUSINS_PATRI', 'BABA_BERO',         'BABA BERO',         'ba-ba be-ro',           'Grand-pere / pere aine',       'Frere aine du pere — branche ainee',                        'ANY', 'ANY', 'ELDER',   true, 2),
  ('COUSINS_PATRI', 'BABA_KATCHA',       'BABA KATCHA',       'ba-ba kat-cha',         'Petit pere / pere cadet',      'Frere cadet du pere — branche cadette',                     'ANY', 'ANY', 'YOUNGER', true, 3)
ON CONFLICT (term_code) DO UPDATE SET
  term_songhoy = EXCLUDED.term_songhoy,
  label_fr = EXCLUDED.label_fr;

-- Cousins matrilateraux (COUSINS_MATRI)
INSERT INTO relation_terms (category_code, term_code, term_songhoy, prononciation, label_fr, description, speaker_gender, target_gender, context_condition, is_active, display_order) VALUES
  ('COUSINS_MATRI', 'WAYUHINKAYE_IZAY', 'WAYUHINKAYE IZAY', 'ouay-ou-hin-kay i-zay', 'Cousins (meres soeurs)',        'Cousins paralleles matrilateraux — enfants de deux femmes + ARMA/WEYMA', 'ANY', 'ANY', NULL,     true, 1),
  ('COUSINS_MATRI', 'NIAN_BERO',        'NIAN BERO',        'gnian be-ro',            'Grande mere / mere ainee',      'Soeur ainee de la mere — branche ainee',                                 'ANY', 'ANY', 'ELDER',   true, 2),
  ('COUSINS_MATRI', 'NIAN_KEYNA',       'NIAN KEYNA',       'gnian key-na',           'Petite mere / mere cadette',    'Soeur cadette de la mere — branche cadette',                            'ANY', 'ANY', 'YOUNGER', true, 3)
ON CONFLICT (term_code) DO UPDATE SET
  term_songhoy = EXCLUDED.term_songhoy,
  label_fr = EXCLUDED.label_fr;

-- Cousins croises (COUSINS_CROSS)
INSERT INTO relation_terms (category_code, term_code, term_songhoy, prononciation, label_fr, description, speaker_gender, target_gender, context_condition, is_active, display_order) VALUES
  ('COUSINS_CROSS', 'BAASSEY',      'BAASSEY',      'baas-sey',       'Cousins croises (generique)',   'Pere de l''un = frere de la mere de l''autre',  'ANY', 'ANY', NULL, true, 1),
  ('COUSINS_CROSS', 'BAASSARO',     'BAASSARO',     'baas-sa-ro',     'Cousin croise (homme)',         'Homme en relation BAASSEY',                     'ANY', 'M',   NULL, true, 2),
  ('COUSINS_CROSS', 'BAASSA_WOYO',  'BAASSA WOYO',  'baas-sa ouoyo',  'Cousine croisee (femme)',       'Femme en relation BAASSEY',                     'ANY', 'F',   NULL, true, 3)
ON CONFLICT (term_code) DO UPDATE SET
  term_songhoy = EXCLUDED.term_songhoy,
  label_fr = EXCLUDED.label_fr;

-- Oncle / Tante (UNCLE_AUNT)
INSERT INTO relation_terms (category_code, term_code, term_songhoy, prononciation, label_fr, description, speaker_gender, target_gender, context_condition, is_active, display_order) VALUES
  ('UNCLE_AUNT', 'BABA_BERO_UNCLE',   'BABA BERO',   'ba-ba be-ro',    'Oncle paternel aine',           'Frere aine du pere',              'ANY', 'M', 'ELDER',          true, 1),
  ('UNCLE_AUNT', 'BABA_KATCHA_UNCLE', 'BABA KATCHA',  'ba-ba kat-cha',  'Oncle paternel cadet',          'Frere cadet du pere',             'ANY', 'M', 'YOUNGER',        true, 2),
  ('UNCLE_AUNT', 'NIAN_BERO_AUNT',    'NIAN BERO',    'gnian be-ro',    'Tante maternelle ainee',        'Soeur ainee de la mere',          'ANY', 'F', 'ELDER',          true, 3),
  ('UNCLE_AUNT', 'NIAN_KEYNA_AUNT',   'NIAN KEYNA',   'gnian key-na',   'Tante maternelle cadette',      'Soeur cadette de la mere',        'ANY', 'F', 'YOUNGER',        true, 4),
  ('UNCLE_AUNT', 'HASSA',             'HASSA',        'has-sa',         'Oncle maternel',                'Frere de la mere',                'ANY', 'M', 'MATERNAL_UNCLE', true, 5),
  ('UNCLE_AUNT', 'HAWA',              'HAWA',         'ha-oua',         'Tante paternelle',              'Soeur du pere',                   'ANY', 'F', 'PATERNAL_AUNT',  true, 6)
ON CONFLICT (term_code) DO UPDATE SET
  term_songhoy = EXCLUDED.term_songhoy,
  label_fr = EXCLUDED.label_fr;

-- Neveu / Niece (NEPHEW_NIECE)
INSERT INTO relation_terms (category_code, term_code, term_songhoy, prononciation, label_fr, description, speaker_gender, target_gender, context_condition, is_active, display_order) VALUES
  ('NEPHEW_NIECE', 'IZE',    'IZE',    'i-ze',    'Enfant / Neveu / Niece',                  'Terme generique — fils/fille du frere/soeur',        'ANY', 'ANY', NULL,        true, 1),
  ('NEPHEW_NIECE', 'TOUBA',  'TOUBA',  'tou-ba',  'Neveu/Niece (de l''oncle maternel)',       'Enfant de la soeur (pour un homme = HASSA)',          'M',   'ANY', 'FROM_HASSA', true, 2)
ON CONFLICT (term_code) DO UPDATE SET
  term_songhoy = EXCLUDED.term_songhoy,
  label_fr = EXCLUDED.label_fr;

-- Grand-parent (GRANDPARENT) — niveaux KAAGA
INSERT INTO relation_terms (category_code, term_code, term_songhoy, prononciation, label_fr, description, speaker_gender, target_gender, context_condition, is_active, display_order) VALUES
  ('GRANDPARENT', 'KAAGA',                      'KAAGA',                      'kaa-ga',                        'Grand-pere (niveau 1)',           'Grand-pere paternel ou maternel',    'ANY', 'M', 'LEVEL_1', true, 1),
  ('GRANDPARENT', 'KAAGA_WOY',                  'KAAGA WOY',                  'kaa-ga ouoy',                   'Grand-mere (niveau 1)',           'Grand-mere paternelle ou maternelle','ANY', 'F', 'LEVEL_1', true, 2),
  ('GRANDPARENT', 'KAAGA_BERI_DJINA',           'KAAGA BERI DJINA',           'kaa-ga be-ri dji-na',           'Ancetre homme niveau 2',          'Arriere-grand-pere',                 'ANY', 'M', 'LEVEL_2', true, 3),
  ('GRANDPARENT', 'KAAGA_WOY_BERI_DJINA',       'KAAGA WOY BERI DJINA',       'kaa-ga ouoy be-ri dji-na',      'Ancetre femme niveau 2',          'Arriere-grand-mere',                 'ANY', 'F', 'LEVEL_2', true, 4),
  ('GRANDPARENT', 'KAAGA_BERI_HINKATO',         'KAAGA BERI HINKATO',         'kaa-ga be-ri hin-ka-to',        'Ancetre homme niveau 3',          '3eme niveau d''ancetre',             'ANY', 'M', 'LEVEL_3', true, 5),
  ('GRANDPARENT', 'KAAGA_WOY_BERI_HINKATO',     'KAAGA WOY BERI HINKATO',     'kaa-ga ouoy be-ri hin-ka-to',   'Ancetre femme niveau 3',          '3eme niveau d''ancetre',             'ANY', 'F', 'LEVEL_3', true, 6),
  ('GRANDPARENT', 'KAAGA_BERI_HINZANTO',        'KAAGA BERI HINZANTO',        'kaa-ga be-ri hin-zan-to',       'Ancetre homme niveau 4',          '4eme niveau d''ancetre',             'ANY', 'M', 'LEVEL_4', true, 7),
  ('GRANDPARENT', 'KAAGA_WOY_BERI_HINZANTO',    'KAAGA WOY BERI HINZANTO',    'kaa-ga ouoy be-ri hin-zan-to',  'Ancetre femme niveau 4',          '4eme niveau d''ancetre',             'ANY', 'F', 'LEVEL_4', true, 8),
  ('GRANDPARENT', 'KAAGA_BERI_TAATCHANTO',      'KAAGA BERI TAATCHANTO',      'kaa-ga be-ri taat-chan-to',      'Ancetre homme niveau 5',          '5eme niveau d''ancetre',             'ANY', 'M', 'LEVEL_5', true, 9),
  ('GRANDPARENT', 'KAAGA_WOY_BERI_TAATCHANTO',  'KAAGA WOY BERI TAATCHANTO',  'kaa-ga ouoy be-ri taat-chan-to', 'Ancetre femme niveau 5',          '5eme niveau d''ancetre',             'ANY', 'F', 'LEVEL_5', true, 10),
  ('GRANDPARENT', 'KAAGA_BERI_GOUWANTO',        'KAAGA BERI GOUWANTO',        'kaa-ga be-ri gou-wan-to',       'Ancetre homme niveau 6',          '6eme niveau d''ancetre',             'ANY', 'M', 'LEVEL_6', true, 11),
  ('GRANDPARENT', 'KAAGA_WOY_BERI_GOUWANTO',    'KAAGA WOY BERI GOUWANTO',    'kaa-ga ouoy be-ri gou-wan-to',  'Ancetre femme niveau 6',          '6eme niveau d''ancetre',             'ANY', 'F', 'LEVEL_6', true, 12)
ON CONFLICT (term_code) DO UPDATE SET
  term_songhoy = EXCLUDED.term_songhoy,
  label_fr = EXCLUDED.label_fr;

-- Petit-enfant (GRANDCHILD)
INSERT INTO relation_terms (category_code, term_code, term_songhoy, prononciation, label_fr, description, speaker_gender, target_gender, context_condition, is_active, display_order) VALUES
  ('GRANDCHILD', 'HAAMA', 'HAAMA', 'haa-ma', 'Petit-enfant / Descendant', 'Terme reciproque de KAAGA — quel que soit le niveau', 'ANY', 'ANY', NULL, true, 1)
ON CONFLICT (term_code) DO UPDATE SET
  term_songhoy = EXCLUDED.term_songhoy,
  label_fr = EXCLUDED.label_fr;

-- ============================================================
-- Migration 007 : Catégorie SPOUSE + termes de parenté maritale
-- ============================================================

-- Catégorie SPOUSE
INSERT INTO relation_categories (code, label_songhoy, label_fr, description, sort_order)
VALUES ('SPOUSE', 'WANDO', 'Époux / Épouse', 'Relation maritale', 0);

-- Termes
INSERT INTO relation_terms (id, category_code, term_code, term_songhoy, prononciation, label_fr, description, speaker_gender, target_gender, context_condition, is_active, display_order)
VALUES
  (gen_random_uuid(), 'SPOUSE', 'KOURNIO', 'KOURNIO', 'kour-nio', 'Époux / Mari', 'Le mari', 'F', 'M', NULL, true, 1),
  (gen_random_uuid(), 'SPOUSE', 'ALAA_YANO', 'ALAA-YANO', 'a-laa ya-no', 'Épouse / Femme', 'L''épouse', 'M', 'F', NULL, true, 2),
  (gen_random_uuid(), 'SPOUSE', 'WANDO', 'WANDO', 'wan-do', 'Épouse / Femme (alternatif)', 'Terme alternatif pour épouse', 'M', 'F', NULL, true, 3);

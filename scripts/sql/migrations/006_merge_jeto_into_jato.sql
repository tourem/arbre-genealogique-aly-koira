-- Migration 006: Fusion jeto_moussa_ali → jato
-- Les deux IDs designent la meme personne. On garde jato.
-- Toutes les references a jeto_moussa_ali sont redirigees vers jato,
-- puis le doublon est supprime.

BEGIN;

-- 1. Fusionner les enfants de jeto_moussa_ali dans jato
--    (ajoute les enfants qui ne sont pas deja dans le tableau de jato)
UPDATE members
SET children = (
  SELECT array(
    SELECT DISTINCT unnest(
      COALESCE((SELECT children FROM members WHERE id = 'jato'), '{}')
      ||
      COALESCE((SELECT children FROM members WHERE id = 'jeto_moussa_ali'), '{}')
    )
  )
)
WHERE id = 'jato';

-- 2. Fusionner les conjoints de jeto_moussa_ali dans jato
UPDATE members
SET spouses = (
  SELECT array(
    SELECT DISTINCT unnest(
      COALESCE((SELECT spouses FROM members WHERE id = 'jato'), '{}')
      ||
      COALESCE((SELECT spouses FROM members WHERE id = 'jeto_moussa_ali'), '{}')
    )
  )
)
WHERE id = 'jato';

-- 3. Mettre a jour les enfants qui ont jeto_moussa_ali comme mere
UPDATE members
SET mother_ref = 'jato'
WHERE mother_ref = 'jeto_moussa_ali';

-- 4. Mettre a jour les enfants qui ont jeto_moussa_ali comme pere
--    (peu probable mais par securite)
UPDATE members
SET father_id = 'jato'
WHERE father_id = 'jeto_moussa_ali';

-- 5. Remplacer jeto_moussa_ali par jato dans les tableaux spouses
UPDATE members
SET spouses = array_replace(spouses, 'jeto_moussa_ali', 'jato')
WHERE 'jeto_moussa_ali' = ANY(spouses);

-- 6. Remplacer jeto_moussa_ali par jato dans les tableaux children
UPDATE members
SET children = array_replace(children, 'jeto_moussa_ali', 'jato')
WHERE 'jeto_moussa_ali' = ANY(children);

-- 7. Supprimer le doublon
DELETE FROM members WHERE id = 'jeto_moussa_ali';

COMMIT;

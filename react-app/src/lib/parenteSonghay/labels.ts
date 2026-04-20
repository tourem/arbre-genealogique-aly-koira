// react-app/src/lib/parenteSonghay/labels.ts

/**
 * Libellés par défaut (source de vérité commitée).
 * Clés hiérarchiques : term.* | gloss.* | explain.*
 * Placeholders dans explain.* : {nameA} {nameB} {termA} {termB} {lca} {dA} {dB}
 */
export const defaultLabels: Record<string, string> = {
  // ─── Termes Songhay atomiques ───
  'term.baba': 'baba',
  'term.gna': 'gna',
  'term.ize': 'izé',
  'term.arma': 'arma',
  'term.woyma': 'woyma',
  'term.baassa_arou': 'baassa arou',
  'term.baassa_woy': 'baassa woy',
  'term.hassa': 'hassa',
  'term.touba': 'touba',
  'term.hawa': 'hawa',
  'term.kaga_arou': 'kaga arou',
  'term.kaga_woy': 'kaga woy',
  'term.haama': 'haama',
  'term.cote_baba': 'coté baba',
  'term.cote_gna': 'coté gna',

  // ─── Gloses françaises (affichées sous les termes dans le sous-arbre) ───
  'gloss.baba': 'père',
  'gloss.gna': 'mère',
  'gloss.ize': 'enfant',
  'gloss.arma': 'frère',
  'gloss.woyma': 'sœur',
  'gloss.baassa_arou': 'cousin croisé',
  'gloss.baassa_woy': 'cousine croisée',
  'gloss.hassa': 'oncle maternel',
  'gloss.touba': 'neveu via oncle maternel',
  'gloss.hawa': 'tante paternelle',
  'gloss.kaga_arou': 'grand-père / ancêtre',
  'gloss.kaga_woy': 'grand-mère / ancêtre',
  'gloss.haama': 'petit-enfant / descendant',

  // ─── Explications pédagogiques (templates avec placeholders) ───
  'explain.direct-descendant.parent':
    '{nameA} est {termA} direct de {nameB} : lien parent → enfant de premier niveau.',
  'explain.direct-descendant.ancestor':
    '{nameA} est {termA} de {nameB} ({dA} générations d\'écart). En pays songhay, on répète le mot « kaga » pour chaque génération supplémentaire et on précise le côté (paternel ou maternel) selon la branche par laquelle on remonte.',
  'explain.direct-ascendant.child':
    '{nameA} est {termA} direct de {nameB} : enfant de premier niveau.',
  'explain.direct-ascendant.descendant':
    '{nameA} est {termA} de {nameB} (descendant sur {dA} générations). Le terme « haama » se répète pour chaque génération supplémentaire.',
  'explain.parallel':
    '{nameA} et {nameB} descendent de {lcaCouple} par des parents de même sexe (fratrie parallèle). Dans le système soudanais songhay, les enfants de deux frères — ou de deux sœurs — sont fusionnés avec la fratrie : ils portent les mêmes termes « arma » / « woyma » que de vrais frères et sœurs.',
  'explain.cross':
    '{nameA} et {nameB} descendent de {lcaCouple} par des parents de sexes opposés (lien croisé). Le système songhay distingue rigoureusement ces cousins croisés de la fratrie parallèle : ils portent le terme dédié « baassa arou » / « baassa woy ».',
  'explain.avuncular.parallel':
    '{nameA} est {termA} de {nameB} : oncle ou tante parallèle, c\'est-à-dire frère-équivalent du parent de même sexe. Par la règle de fusion bifurquée, il/elle est nommé(e) comme le parent direct.',
  'explain.avuncular.hassa':
    'En pays songhay, l\'oncle maternel porte un nom dédié — « hassa » — qui marque son rôle social spécial (avunculat soudanais). Le neveu / la nièce par cette relation est « touba ». Cette asymétrie lexicale ne s\'applique qu\'à l\'oncle maternel, pas à la tante paternelle.',
  'explain.avuncular.hawa':
    '« hawa » désigne la tante paternelle (sœur-équivalente du père). L\'asymétrie du système : il existe un terme dédié pour la tante paternelle (« hawa ») mais pas de terme réciproque spécial pour son neveu/nièce, qui reste simplement « izé ».',
  'explain.distant-vertical':
    '{nameA} est {termA} de {nameB} : grand-oncle / grand-tante ou relation éloignée de {dA} générations d\'écart. Le mot « kaga » se répète pour chaque génération supplémentaire, suffixé par « coté baba » ou « coté gna » selon la branche par laquelle on remonte.',
};

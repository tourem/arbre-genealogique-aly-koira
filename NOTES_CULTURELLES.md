# Notes culturelles — modèles de parenté songhay

Ce fichier rassemble les questions de **modélisation culturelle** qui
dépassent la technique pure et qui demandent une conversation avec la
famille et/ou les érudits du clan Aly Koïra avant toute implémentation
côté base de données.

L'objectif est de ne pas hardcoder un modèle anglo-occidental là où le
vocabulaire et la pratique songhay sont plus fins.

---

## 1. Fosterage et adoption — ouverte

**Question** : comment distinguer et représenter les différentes formes
de filiation non biologique en contexte songhay ?

Le vocabulaire et la pratique distinguent au moins :

- **Enfant de sang (biologique)** — filiation par défaut, la plus simple.
- **Fosterage (garde éducative temporaire)** — l'enfant est confié à un
  oncle, une tante ou la grand-mère pour son éducation, souvent sans
  rompre les liens biologiques. Le « parent de référence quotidien »
  peut différer du parent biologique pendant des années.
- **Adoption plénière** — pratique plus rare, avec transfert de nom et
  d'héritage.
- **Enfant recueilli** — orphelin élevé par la famille élargie, avec
  des statuts variables selon les arrangements entre lignages.

**Pourquoi ça bloque une implémentation simple** : un simple boolean
`is_adoptive` sur la relation parent-enfant aplatit ces nuances et
risque de faire écrire un statut qu'on devra ensuite débreakdown.

**Qui consulter** :

- Famille Aly Koïra (érudits, aînés)
- Éventuellement : spécialistes de l'anthropologie songhay (Jean Rouch
  corpus, Olivier de Sardan, etc.)

**Décision actuelle** : l'option « Marquer adoptif » a été retirée
du menu contextuel. L'arbre ne distingue pas pour l'instant les
différentes formes de filiation — c'est un **écart connu**, pas un
oubli. La conversation culturelle doit précéder toute migration DB.

**Ce qu'il faut rédiger avant d'implémenter** :

1. Un document de vocabulaire (terme songhay → sens → usages) pour
   chaque forme de filiation reconnue par la famille.
2. Un schéma DB qui reflète ces distinctions (enum, table pivot
   `kinship_link` avec type, ou autre).
3. Les règles d'affichage (lignage, calcul de parenté, fiches) pour
   chaque type.

---

## 2. Co-épouses et hiérarchie matrimoniale — prévu

Statut : la notion de **rang d'épouse** (1ʳᵉ, 2ᵉ, 3ᵉ) existe dans la base
(`spouses[].rank` côté mari). Son affichage est géré. Le changement
interactif du rang (réordonner via flèches ↑/↓) est en follow-up —
cf. `FOLLOW_UPS.md`.

À préciser ultérieurement :

- Quand une co-épouse est répudiée / divorcée / décédée, est-ce que
  le rang des autres se décale, ou bien il est figé à vie (rang
  d'entrée dans le foyer) ?
- Usage des termes songhay pour la coépouse : **baassa arou** /
  **baassa woy**, **windi-yze** pour les demi-frères/sœurs du même
  père, etc.

---

## 3. Terminologie contextuelle (mari ↔ femme, côté lignage)

Le calculateur de parenté songhay tient compte du **côté baba / côté
gna** (paternel / maternel) et distingue parallel/cross cousins
(`arma` vs `arma` avec groupTerm `arrou/woy hinka izey`). Le
vocabulaire complet est documenté dans
`parente/algorithme-parente-songhay.md`.

---

*Dernière mise à jour : 2026-04-22.*

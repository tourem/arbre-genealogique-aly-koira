# Définitions des termes songhay — contenu des tooltips

Source unique pour le composant `SonghayTerm` d'Alykoira. Chaque entrée fournit le terme, sa traduction courte (pour affichage inline), et sa définition longue (2-3 phrases, affichée dans le tooltip au survol).

Les définitions sont rédigées à partir du document `algorithme-parente-songhay.md`, de la bibliographie (Olivier de Sardan 1982, Heath 1998-1999, Bisilliat & Laya 1992, Radcliffe-Brown 1924), et calibrées pour le **dialecte koroboro senni** parlé à Gao. Elles sont pédagogiques mais concises, et évitent le jargon anthropologique quand un mot simple suffit.

**À relire et corriger par l'utilisateur avant intégration** — notamment sur les nuances d'usage propres à la famille Aly Koïra de Gao qui peuvent différer du Niger.

---

## Format attendu côté code

```ts
interface SonghayTermDefinition {
  term: string;          // forme affichée (ex: "baba", "kaga arou")
  short: string;         // traduction courte en 1-3 mots
  long: string;          // définition pédagogique (2-3 phrases)
  category: 'ligne-directe' | 'fratrie' | 'avunculat' | 'ancetres' | 'foyer' | 'social';
}
```

---

## 1. Termes de la ligne directe

### `baba`

- **Court** : Père
- **Long** : Père biologique, ou frère-équivalent de même sexe que le père. Le terme s'applique aussi à l'oncle paternel parallèle (frère du père) et à ses équivalents plus éloignés dans la lignée, selon le principe de fusion caractéristique du système songhay.
- **Catégorie** : `ligne-directe`

### `gna`

- **Court** : Mère
- **Long** : Mère biologique, ou sœur-équivalente de la mère. Le terme désigne aussi la tante maternelle parallèle (sœur de la mère) et ses équivalentes, qui sont considérées socialement comme des mères au même titre que la mère biologique.
- **Catégorie** : `ligne-directe`

### `izé`

- **Court** : Enfant
- **Long** : Enfant biologique, ou enfant d'un frère-équivalent (pour un homme) ou d'une sœur-équivalente (pour une femme). Les variantes `izô`, `izé woy` et `iza arou` précisent le genre ou la forme selon le dialecte. Dans le système songhay, l'enfant d'un frère parallèle est linguistiquement traité comme son propre enfant.
- **Catégorie** : `ligne-directe`

---

## 2. Fratrie et cousins

### `arma`

- **Court** : Frère
- **Long** : Frère, demi-frère, ou cousin parallèle masculin — c'est-à-dire fils d'un frère du père ou d'une sœur de la mère. Cette fusion entre frères biologiques et cousins parallèles est la marque centrale du système songhay : elle efface la distinction entre famille nucléaire et famille étendue pour les relations de même génération.
- **Catégorie** : `fratrie`

### `woyma`

- **Court** : Sœur
- **Long** : Sœur, demi-sœur, ou cousine parallèle féminine — fille d'un frère du père ou d'une sœur de la mère. Comme pour `arma`, le terme englobe toutes les femmes de même génération issues de parents de même sexe que les parents d'ego, qui sont considérées comme des sœurs à part entière.
- **Catégorie** : `fratrie`

### `baassa arou`

- **Court** : Cousin croisé
- **Long** : Cousin masculin issu de parents de sexes opposés — fils d'une sœur du père ou d'un frère de la mère. Contrairement aux cousins parallèles assimilés à des frères, les cousins croisés portent un terme dédié qui marque leur altérité sociale et permet les relations de plaisanterie caractéristiques du *baasetaray*.
- **Catégorie** : `fratrie`

### `baassa woy`

- **Court** : Cousine croisée
- **Long** : Cousine féminine par parents de sexes opposés — fille d'une sœur du père ou d'un frère de la mère. Ce terme est symétrique de `baassa arou` et marque la même distance sociale, fondement historique des alliances matrimoniales préférentielles dans les sociétés soudaniennes.
- **Catégorie** : `fratrie`

---

## 3. Oncles, tantes, neveux (avunculat)

### `hassa`

- **Court** : Oncle maternel
- **Long** : Frère de la mère, ou frère-équivalent masculin de la mère. L'oncle maternel occupe un rôle social particulièrement valorisé en pays songhay : il est à la fois protecteur et confident, souvent consulté pour les décisions importantes concernant ses neveux et nièces, et peut participer au transfert de la dot. Cette importance structurelle justifie qu'il porte un terme dédié, distinct du simple `baba`.
- **Catégorie** : `avunculat`

### `touba`

- **Court** : Neveu/nièce d'un oncle maternel
- **Long** : Enfant de la sœur, tel qu'appelé par le frère de celle-ci. Le terme est réciproque de `hassa` : là où l'oncle maternel porte un nom spécifique, son neveu ou sa nièce en porte un également, ce qui souligne la force du lien avunculaire dans la société songhay.
- **Catégorie** : `avunculat`

### `hawa`

- **Court** : Tante paternelle
- **Long** : Sœur du père, ou sœur-équivalente féminine du père. Contrairement à la symétrie parfaite attendue, la tante paternelle porte un terme dédié (`hawa`) mais son neveu ou sa nièce reste simplement `izé` — asymétrie typique du système songhay qui distingue l'avunculat matrilatéral (marqué des deux côtés) de la relation amitale patrilatérale (marquée d'un seul côté).
- **Catégorie** : `avunculat`

---

## 4. Ancêtres et descendants éloignés

### `kaga arou`

- **Court** : Grand-père (ou ancêtre masculin)
- **Long** : Grand-père biologique, ou tout ancêtre masculin indirect au-delà de deux générations. La répétition du mot `kaga` permet de préciser la profondeur : `kaga kaga arou` pour l'arrière-grand-père, `kaga kaga kaga arou` pour l'arrière-arrière-grand-père, et ainsi de suite.
- **Catégorie** : `ancetres`

### `kaga woy`

- **Court** : Grand-mère (ou ancêtre féminine)
- **Long** : Grand-mère biologique, ou toute ancêtre féminine indirecte au-delà de deux générations. Le suffixe `coté baba` ou `coté gna` se joint au terme pour préciser la branche par laquelle on remonte : paternelle (`coté baba`) ou maternelle (`coté gna`).
- **Catégorie** : `ancetres`

### `haama`

- **Court** : Petit-enfant (ou descendant)
- **Long** : Petit-fils, petite-fille, ou tout descendant indirect au-delà de deux générations. Comme `kaga`, la répétition précise la profondeur : `haama haama` pour l'arrière-petit-enfant, et ainsi de suite. Le terme est de genre neutre et s'applique aux descendants masculins comme féminins.
- **Catégorie** : `ancetres`

---

## 5. Suffixes et précisions

### `coté baba`

- **Court** : Côté paternel
- **Long** : Suffixe qui s'ajoute aux termes `kaga arou` et `kaga woy` pour indiquer que l'ancêtre est rattaché à ego par la branche paternelle. Par exemple, `kaga woy coté baba` désigne une grand-mère atteinte en passant d'abord par le père.
- **Catégorie** : `ancetres`

### `coté gna`

- **Court** : Côté maternel
- **Long** : Suffixe symétrique de `coté baba`, qui indique que l'ancêtre est rattaché par la branche maternelle. Par exemple, `kaga arou coté gna` désigne un grand-père atteint en passant d'abord par la mère.
- **Catégorie** : `ancetres`

---

## 6. Termes de la vie sociale et familiale

### `windi`

- **Court** : Foyer, concession
- **Long** : Unité domestique de base de la société songhay-zarma, traditionnellement patrilinéaire et patrilocale. Le `windi` regroupe sous l'autorité du patriarche plusieurs générations, les frères cadets, leurs épouses et leurs enfants, dans un espace délimité — la concession. Dans Alykoira, chaque foyer (épouse + sa descendance) correspond à une unité `windi` au sein de la vie d'un homme.
- **Catégorie** : `foyer`

### `koda`

- **Court** : Benjamin, dernier-né
- **Long** : Dernier-né d'une fratrie, souvent objet d'attentions particulières dans la famille songhay. Le statut de `koda` est d'abord biologique mais peut aussi se transmettre socialement — lorsque le dernier-né biologique est décédé jeune, le titre peut passer à un autre enfant. Le `koda` est traditionnellement entouré, parfois gâté, et garde tout au long de sa vie un lien affectif particulier avec ses aînés.
- **Catégorie** : `social`

### `arrou hinka izey`

- **Court** : Enfants de deux hommes
- **Long** : Désigne les enfants nés de deux frères, qui sont donc cousins parallèles et que la société songhay considère comme des frères et sœurs à part entière. L'expression littérale — « les enfants des deux hommes » — rappelle la logique du système de parenté où les cousins parallèles issus de pères frères sont fusionnés avec la fratrie.
- **Catégorie** : `fratrie`

### `hassey-zee n'da hawey-zee`

- **Court** : Enfants d'oncle maternel et de tante paternelle
- **Long** : Formule qui associe les cousins croisés des deux côtés : ceux issus d'un `hassa` (oncle maternel) et ceux issus d'une `hawa` (tante paternelle). Ce sont les cousins `baassa` au sens large, partenaires traditionnels des relations à plaisanterie (*baasetaray*) et historiquement des alliances matrimoniales préférentielles.
- **Catégorie** : `fratrie`

---

## Notes de rédaction

**Choix lexicaux** : j'ai utilisé « pays songhay » et « société songhay » de façon interchangeable. Si Alykoira vise spécifiquement les Songhay maliens (et non les Zarma du Niger), remplacer par « chez les Songhay » ou « en pays songhay malien » là où c'est pertinent.

**Variantes dialectales** : les formes données (`arou` plutôt que `rô`) correspondent au **koroboro senni** de Gao, validées par la correction que tu as faite précédemment. Si certains termes ont des variantes d'usage dans la famille Aly Koïra (notamment pour `hassey-zee n'da hawey-zee` qui est une expression composée dont la forme peut varier), indique-les et je mettrai à jour.

**Registre** : j'ai gardé un ton pédagogique neutre, ni trop savant ni trop familier. Les tooltips doivent fonctionner pour un membre de la famille qui redécouvre son héritage comme pour un visiteur qui apprend. Si tu préfères un registre plus chaleureux ou plus directement adressé (« c'est le terme que tu utilises pour… »), je peux réécrire.

**Termes absents** : je n'ai pas inclus `dumi` (famille/ethnie), `nya-ize` et `baabize` (parentèle par femmes/hommes), qui apparaissaient dans Olivier de Sardan mais pas dans ton algorithme. Si tu veux les ajouter plus tard pour enrichir l'app, dis-le moi.

**Points à faire confirmer par toi** :
1. `koda` — la nuance « peut passer à un autre enfant si le dernier-né biologique est décédé » est tirée de la littérature générale sur l'avunculat africain. À confirmer pour la tradition spécifique Aly Koïra.
2. `hassa` — j'ai mentionné « transfert de la dot » mais c'est peut-être une généralisation. Est-ce exact dans votre tradition ?
3. `arrou hinka izey` — j'ai supposé l'étymologie littérale « les enfants des deux hommes ». Est-ce correct ou l'expression a-t-elle un sens plus idiomatique ?

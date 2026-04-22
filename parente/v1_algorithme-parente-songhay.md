# Algorithme de calcul des liens de parenté songhay

> Spécification complète pour l'implémentation du moteur de calcul de relations
> de parenté selon le système songhay (Mali, Niger, Burkina Faso).
> Destiné à l'intégration dans l'application Alykoira.

---

## 1. Contexte et particularités du système songhay

Le système de parenté songhay diffère significativement des systèmes occidentaux sur plusieurs points :

1. **Le sexe des personnes intermédiaires compte** — pas seulement le sexe de ego et alter, mais le sexe de chaque parent traversé sur le chemin entre les deux.
2. **Les cousins parallèles sont fusionnés avec la fratrie** — les enfants de deux frères (ou de deux sœurs) sont nommés `arma`/`woyma` (frère/sœur), pas "cousins".
3. **Le système distingue les cousins parallèles des cousins croisés** — les enfants d'un frère et d'une sœur portent un nom dédié (`baassa`).
4. **L'avunculat est encodé dans le lexique** — l'oncle maternel a un statut social spécial (`hassa`/`touba`) absent dans la relation tante-paternelle/neveu (`hawa`/`izé`).
5. **Le vocabulaire reste fini** grâce à une règle de "reset" à chaque génération : seul compte le couple sibling-équivalent immédiat, l'historique au-dessus est oublié.
6. **Les relations multiples coexistent** — deux personnes peuvent avoir plusieurs liens simultanés via différents chemins ancestraux, et tous doivent être présentés.

---

## 2. Glossaire des termes songhay

### Termes de référence (8 termes principaux + variantes)

| Terme | Sexe du référent | Signification |
|---|---|---|
| `baba` | ♂ | Père, ou frère-équivalent de même sexe que le père (oncle paternel parallèle, et au-delà) |
| `gna` | ♀ | Mère, ou sœur-équivalente de même sexe que la mère (tante maternelle parallèle, et au-delà) |
| `izé` (variantes : `izô`, `izé woy`, `iza rou`) | ♂ ou ♀ | Enfant, ou enfant d'un frère-équivalent de même sexe (pour un homme) ou d'une sœur-équivalente de même sexe (pour une femme) |
| `arma` | ♂ | Frère, demi-frère, ou cousin parallèle (par parents de même sexe) |
| `woyma` | ♀ | Sœur, demi-sœur, ou cousine parallèle (par parents de même sexe) |
| `baassa rô` | ♂ | Cousin croisé homme (par parents de sexes opposés) |
| `baassa woy` | ♀ | Cousine croisée femme (par parents de sexes opposés) |
| `hassa` | ♂ | Oncle maternel ou frère-équivalent mâle de la mère |
| `touba` | ♂ ou ♀ | Neveu/nièce d'une femme via son frère, OU enfant d'un baassa de sexe opposé |
| `hawa` | ♀ | Tante paternelle ou sœur-équivalente femelle du père |
| `kaga rô` | ♂ | Grand-père, ou tout ancêtre mâle indirect au-delà de 2 générations |
| `kaga woy` | ♀ | Grand-mère, ou tout ancêtre femelle indirect au-delà de 2 générations |
| `haama` | ♂ ou ♀ | Petit-enfant ou tout descendant indirect au-delà de 2 générations |

### Notation détaillée des kaga/haama

Pour préciser la profondeur, on peut répéter le mot `kaga` (ou `haama`) :
- `kaga rô` = grand-père
- `kaga kaga rô` = arrière-grand-père
- `kaga kaga kaga rô` = arrière-arrière-grand-père
- ... et ainsi de suite

Pour préciser la branche :
- `kaga rô coté baba` = grand-père paternel
- `kaga rô coté gna` = grand-père maternel
- `kaga woy coté baba` = grand-mère paternelle
- `kaga woy coté gna` = grand-mère maternelle

### Variantes de `izé`

- `izé` ou `izô` : forme générique
- `izé woy` ou `iza rou` : forme spécifique (au choix de la convention applicative)

---

## 3. La règle générative (cœur du système)

### Principe fondamental

Pour classifier deux personnes A et B, on identifie :
1. Leur **ancêtre commun le plus proche** (LCA = *Lowest Common Ancestor*) sur chaque chemin distinct
2. La **distance** dA de A au LCA et dB de B au LCA
3. Le **couple sibling-équivalent** pertinent (paire de personnes qui sont siblings ou siblings-équivalents)
4. Le **sexe** des personnes dans ce couple

### Concept clé : "sibling-équivalent"

Deux personnes PA et PB sont **sibling-équivalentes** si :
- Elles ont au moins un parent commun (vrais frères/sœurs ou demi-frères/sœurs), OU
- Leurs parents respectifs sont eux-mêmes sibling-équivalents (récursion)

En songhay, **toutes les distinctions parallèle/croisé du niveau supérieur sont "oubliées"** au moment de classifier le niveau actuel. Seuls comptent les sexes des sibling-équivalents immédiats.

### La table de décision

| Configuration | Terme du supérieur | Terme de l'inférieur |
|---|---|---|
| **dA = 0, dB = 1** : A parent direct de B | A♂ → `baba`, A♀ → `gna` | B reçoit `izé` |
| **dA = 0, dB ≥ 2** : A ancêtre éloigné de B | A♂ → `kaga rô`, A♀ → `kaga woy` (répété `dB-1` fois), suffixé par `coté baba` ou `coté gna` selon le 1er saut du chemin de B | B reçoit `haama` (répété `dB-1` fois) |
| **dA = dB ≥ 1**, parents directs PA et PB de **même sexe** | — | A et B sont `arma` (♂) ou `woyma` (♀) mutuellement |
| **dA = dB ≥ 1**, parents directs PA et PB de **sexes opposés** | — | A et B sont `baassa rô` (♂) ou `baassa woy` (♀) mutuellement |
| **dA + 1 = dB** : A oncle/tante de B. Couple (A, parent_équivalent) **même sexe** | A♂ → `baba`, A♀ → `gna` | B reçoit `izé` |
| **dA + 1 = dB**, couple **cross, A♂** (oncle maternel) | A est `hassa` | B est `touba` |
| **dA + 1 = dB**, couple **cross, A♀** (tante paternelle) | A est `hawa` | B est `izé` |
| **dA + k = dB** avec **k ≥ 2** : A grand-oncle, etc. | A♂ → `kaga rô` (×(k-1)), A♀ → `kaga woy` (×(k-1)), suffixé `coté baba` ou `coté gna` | B reçoit `haama` (×(k-1)) |

### Détermination du "côté baba/gna"

Pour les termes `kaga rô` et `kaga woy` qui nécessitent une précision sur la branche :
- Si le **premier saut** du chemin remontant de l'inférieur est vers le père (P) → `coté baba`
- Si le **premier saut** est vers la mère (M) → `coté gna`

Cette règle s'applique uniquement au tout premier saut, peu importe le reste du chemin.

---

## 4. Modèle de données

### Sémantique critique des termes retournés

**Convention non négociable** : un terme songhay encode le sexe et la position de **la personne désignée**, pas du locuteur. Donc dans la sortie de l'algorithme :

- `termForA` = "le terme qui désigne A" = comment A est qualifié par B (et plus généralement par n'importe qui parlant de A) → dépend du **sexe de A** et de la position structurelle de A.
- `termForB` = "le terme qui désigne B" = comment B est qualifié par A → dépend du **sexe de B** et de la position structurelle de B.

Exemple : pour Modibo (♂) ↔ Hadja (♀) qui sont frère et sœur :
- termForA (Modibo) = `arma` (Modibo est désigné comme "frère")
- termForB (Hadja) = `woyma` (Hadja est désignée comme "sœur")

L'affichage cohérent en français est : *"A est `termForA` pour B"* et *"B est `termForB` pour A"*.

### Structures TypeScript

```typescript
type Sex = 'M' | 'F';

interface Person {
  id: string;
  name: string;
  sex: Sex;
  fatherId: string | null;  // OBLIGATOIRE de typer père vs mère
  motherId: string | null;  // pour pouvoir annoter "côté baba/gna"
}

type Path = {
  ancestor: string;          // id de l'ancêtre atteint
  hops: ('P' | 'M')[];       // séquence des sauts depuis ego
};

type Relation = {
  termForA: string;           // ex: "hassa", "kaga rô coté baba"
  termForB: string;           // ex: "touba", "haama"
  via: string;                // id du LCA
  pathA: ('P' | 'M')[];       // chemin de A vers LCA
  pathB: ('P' | 'M')[];       // chemin de B vers LCA
  distanceA: number;
  distanceB: number;
  proximityScore: number;     // dA + dB
  balanceScore: number;       // max(dA, dB)
  details: string;            // explication textuelle
};

type RelationResult =
  | { kind: 'same-person' }
  | { kind: 'no-link' }
  | { kind: 'incomplete', missingParents: string[] }  // parents inconnus bloquent
  | { kind: 'relations', relations: Relation[] };     // triées par proximité
```

**Règle stricte** : si un parent nécessaire pour classer (sur un chemin remontant utilisé) est `null`, l'algorithme **doit refuser** de classer ce chemin et signaler les parents manquants. On ne devine jamais.

---

## 5. Algorithme détaillé

### Étape 1 — Cas spéciaux

```
function calculer_relations(idA, idB):
    si idA == idB:
        retourner { kind: 'same-person' }
    
    A = personne(idA)
    B = personne(idB)
    si A est null ou B est null:
        lever erreur "personne introuvable"
    
    // suite : étape 2
```

### Étape 2 — Énumérer tous les chemins ancestraux

Pour chaque personne, on calcule tous les chemins distincts vers chaque ancêtre, avec annotation P/M à chaque saut.

```
function enumerer_chemins(personId, max_depth = 20):
    chemins = []  // liste de { ancestor, hops }
    
    function dfs(currentId, hops):
        chemins.append({ ancestor: currentId, hops: hops.copy() })
        
        si len(hops) >= max_depth:
            retourner  // protection contre cycles éventuels
        
        person = personne(currentId)
        si person.fatherId est non null:
            dfs(person.fatherId, hops + ['P'])
        si person.motherId est non null:
            dfs(person.motherId, hops + ['M'])
    
    dfs(personId, [])
    retourner chemins
```

**Note importante** : un ancêtre peut apparaître plusieurs fois avec des chemins différents (cas des unions consanguines comme Cheick → Sira par deux chemins).

### Étape 3 — Trouver les instances LCA

```
function trouver_instances_lca(cheminsA, cheminsB):
    // Indexer les chemins par ancêtre
    parA = group_by(cheminsA, key = ancestor)
    parB = group_by(cheminsB, key = ancestor)
    
    // Pour chaque ancêtre commun, créer une instance pour chaque combinaison
    instances = []
    pour chaque ancestor dans clés(parA) ∩ clés(parB):
        pour chaque chemin_a dans parA[ancestor]:
            pour chaque chemin_b dans parB[ancestor]:
                instances.append({
                    ancestor: ancestor,
                    pathA: chemin_a.hops,
                    pathB: chemin_b.hops
                })
    
    // Filtrer les instances non-minimales
    // Une instance (X, pathA, pathB) est non-minimale si :
    //   il existe une autre instance (Y, pathA', pathB') telle que
    //   pathA est un préfixe étendu de pathA' (i.e. pathA' commence par pathA)
    //   ET pathB est un préfixe étendu de pathB'
    instances_minimales = filtrer_minimales(instances)
    
    retourner instances_minimales
```

**Critère de minimalité** : si on peut atteindre un autre ancêtre commun en s'arrêtant plus tôt sur les deux chemins, l'instance courante n'est pas minimale et doit être éliminée.

Exemple : pour Bakary↔Djéneba, on trouve à la fois Sékou (LCA direct, dA=dB=1) et Sira (dA=dB=3). L'instance via Sira n'est pas minimale car le chemin de Bakary vers Sira passe par Sékou et le chemin de Djéneba vers Sira passe aussi par Sékou. On garde uniquement l'instance via Sékou.

### Étape 4 — Classer chaque instance

```
function classer_instance(A, B, instance):
    dA = len(instance.pathA)
    dB = len(instance.pathB)
    
    // Cas ligne directe
    si dA == 0:
        retourner classer_descendance(A, B, dB, instance.pathB)
    si dB == 0:
        // Symétrique : inverser et appeler
        result = classer_descendance(B, A, dA, instance.pathA)
        retourner inverser(result)
    
    // Cas même génération
    si dA == dB:
        retourner classer_meme_generation(A, B, instance)
    
    // Cas décalage de génération
    retourner classer_decalage(A, B, instance)


function classer_descendance(ancetre, descendant, distance, pathDescendant):
    sexe_ancetre = ancetre.sex
    cote = (pathDescendant[0] == 'P') ? "baba" : "gna"
    
    si distance == 1:
        terme_ancetre = (sexe_ancetre == 'M') ? "baba" : "gna"
        terme_descendant = "izé"
    sinon:  // distance >= 2
        nb_kaga = distance - 1
        kaga_word = "kaga " * nb_kaga + ((sexe_ancetre == 'M') ? "rô" : "woy")
        terme_ancetre = kaga_word + " coté " + cote
        terme_descendant = "haama " * nb_kaga
    
    retourner {
        termForA: terme_ancetre,    // pour le descendant qui appelle l'ancêtre
        termForB: terme_descendant, // pour l'ancêtre qui appelle le descendant
        ...
    }


function classer_meme_generation(A, B, instance):
    // Récupérer les parents directs de A et B sur ce chemin
    parent_id_A = (instance.pathA[0] == 'P') ? A.fatherId : A.motherId
    parent_id_B = (instance.pathB[0] == 'P') ? B.fatherId : B.motherId
    
    // VÉRIFICATION : si l'un des parents est null, on ne peut pas classer
    si parent_id_A est null ou parent_id_B est null:
        retourner { incomplete: true, missing: [...] }
    
    PA = personne(parent_id_A)
    PB = personne(parent_id_B)
    
    // RÈGLE CLÉ : le terme songhay dépend du sexe du DÉSIGNÉ, pas du locuteur.
    // Donc termForA est basé sur le sexe de A, termForB sur le sexe de B.
    
    si PA.sex == PB.sex:
        // Cousins parallèles (ou frères/sœurs si dA = dB = 1)
        terme_pour_A = (A.sex == 'M') ? "arma" : "woyma"
        terme_pour_B = (B.sex == 'M') ? "arma" : "woyma"
    sinon:
        // Cousins croisés
        terme_pour_A = (A.sex == 'M') ? "baassa rô" : "baassa woy"
        terme_pour_B = (B.sex == 'M') ? "baassa rô" : "baassa woy"
    
    retourner { termForA: terme_pour_A, termForB: terme_pour_B }


function classer_decalage(A, B, instance):
    dA = len(instance.pathA)
    dB = len(instance.pathB)
    
    // Identifier qui est supérieur (proche du LCA) et inférieur
    si dA < dB:
        sup, inf = A, B
        d_sup, d_inf = dA, dB
        path_sup, path_inf = instance.pathA, instance.pathB
    sinon:
        sup, inf = B, A
        d_sup, d_inf = dB, dA
        path_sup, path_inf = instance.pathB, instance.pathA
    
    delta = d_inf - d_sup  // toujours >= 1
    
    si delta == 1:
        // Oncle/tante direct ou équivalent
        // Le couple sibling-équivalent est : (sup, parent_de_inf_au_meme_niveau_que_sup)
        // parent_de_inf_au_meme_niveau_que_sup est l'ancêtre de inf situé au cran 1 sous le LCA
        // = la personne sur path_inf à l'index 0
        parent_id_inf_top = (path_inf[0] == 'P') ? inf.fatherId : inf.motherId
        si parent_id_inf_top est null:
            retourner incomplete
        
        parent_inf_top = personne(parent_id_inf_top)
        
        // Le couple est (sup, parent_inf_top) qui sont siblings-équivalents
        si sup.sex == parent_inf_top.sex:
            // Parallèle : oncle/tante de même sexe que le parent → baba/gna
            terme_sup = (sup.sex == 'M') ? "baba" : "gna"
            terme_inf = "izé"
        sinon si sup.sex == 'M':
            // Cross, supérieur mâle → hassa/touba
            terme_sup = "hassa"
            terme_inf = "touba"
        sinon:
            // Cross, supérieur femelle → hawa/izé
            terme_sup = "hawa"
            terme_inf = "izé"
    
    sinon:  // delta >= 2 : grand-oncle, arrière-grand-oncle, etc.
        // nb_kaga = (différence générationnelle) - 1, par cohérence avec ligne directe :
        //   delta=2 (grand-oncle équivalent à grand-père) → 1 répétition de "kaga"
        //   delta=3 (arrière-grand-oncle) → 2 répétitions
        nb_kaga = delta - 1
        kaga_word = "kaga " * nb_kaga + ((sup.sex == 'M') ? "rô" : "woy")
        // Côté déterminé par le premier saut depuis l'inférieur
        cote = (path_inf[0] == 'P') ? "baba" : "gna"
        terme_sup = kaga_word + " coté " + cote
        terme_inf = "haama " * nb_kaga
    
    // Affecter selon qui est A et qui est B
    // RÈGLE : termForX est le terme qui DÉSIGNE X (selon son sexe et sa position)
    si supIsA:
        retourner { termForA: terme_sup, termForB: terme_inf }
    sinon:
        retourner { termForA: terme_inf, termForB: terme_sup }
```

### Étape 5 — Dédupliquer et trier

```
function finaliser(relations):
    // Dédupliquer par couple (termForA, termForB, via)
    relations_uniques = unique_par_clé(relations, key = (r) => (r.termForA + "|" + r.termForB + "|" + r.via))
    
    // Trier par proximité croissante
    relations_uniques.sort((r1, r2) => {
        si r1.proximityScore != r2.proximityScore:
            retourner r1.proximityScore - r2.proximityScore
        retourner r1.balanceScore - r2.balanceScore
    })
    
    retourner { kind: 'relations', relations: relations_uniques }
```

---

## 6. Cas de test

Soit l'arbre suivant (à utiliser pour validation) :

```
                             Sira (♀, G0)
                            /            \
                       Modibo (♂, G1)    Hadja (♀, G1)
                      /    |    \         /    |    \
                Drissa Sékou Awa    Bourama Tiéman Niamoye
                (♂)    (♂) (♀)      (♂)    (♂)   (♀)
                       /  |  \                |
                  Bakary Adama Djéneba       Koniba
                  (♂)   (♂)   (♀, G3) <─┐  (♂, G3)
                   |          (mariée   │     |    \
              Lassana          avec     │   Yaya  Lalla
              (♂, G4)         Bourama)  │   (♂)   (♀)
              /    \                    │    |
       Soumaïla   Assa               Cheick Maïmouna
       (♂)        (♀)                (♂, G4) (♀, G5)
        |                              |
      Boubou,Safi                   Aïssata
      (♂)(♀, G6)                    (♀, G5)
                                      |
                                    Issouf
                                    (♂, G5)
                                      |
                                    Néné
                                    (♀, G6)
```

### Cas test 1 — Frères directs

| Paire | Résultat attendu |
|---|---|
| Modibo ↔ Hadja | (Modibo) `arma` ↔ (Hadja) `woyma` |
| Bakary ↔ Adama | `arma` ↔ `arma` |
| Drissa ↔ Awa | (Drissa) `arma` ↔ (Awa) `woyma` |

### Cas test 2 — Parent / enfant

| Paire | Résultat attendu |
|---|---|
| Sira ↔ Modibo | (Sira) `gna` ↔ (Modibo) `izé` |
| Modibo ↔ Sékou | (Modibo) `baba` ↔ (Sékou) `izé` |

### Cas test 3 — Grands-parents et au-delà (kaga / haama)

| Paire | Distance | Résultat attendu |
|---|---|---|
| Sira ↔ Sékou | dist=2 | (Sira) `kaga woy coté baba` ↔ (Sékou) `haama` (grand-mère paternelle) |
| Sira ↔ Bakary | dist=3 | (Sira) `kaga kaga woy coté baba` ↔ (Bakary) `haama haama` (arrière-grand-mère) |
| Sira ↔ Boubou | dist=6 | (Sira) `kaga kaga kaga kaga kaga woy coté baba` ↔ (Boubou) `haama haama haama haama haama` (5 répétitions) |
| Modibo ↔ Lassana | dist=3 | (Modibo) `kaga kaga rô coté baba` ↔ (Lassana) `haama haama` (arrière-grand-père) |

### Cas test 4 — Oncles et tantes directs

| Paire | Résultat attendu |
|---|---|
| Sékou ↔ Bourama | (Sékou) `arma` ↔ (Bourama) `arma` (frères-équivalents par leurs parents Modibo et Hadja qui sont vrais frère-sœur) |
| Modibo ↔ Bakary | Modibo est `baba` (oncle paternel) pour Bakary, Bakary est `izé` |
| Hadja ↔ Bakary | Hadja est `hawa` (tante paternelle, sœur du grand-père Modibo... non en fait : Hadja est tante du père Sékou) — **attention au calcul** ; mais en pratique, c'est une tante paternelle indirecte |
| Bakary ↔ Bourama | Pour Bakary, Bourama est `hassa` (oncle maternel = frère-équivalent de la mère ? non, frère-équivalent du père Sékou). En réalité Bourama et Sékou sont sibling-équivalents par parents cross → arma. Donc Bourama est arma de Sékou. Pour Bakary, Bourama est donc `baba` (parallèle au père Sékou). Bakary est `izé` pour Bourama. |
| Bakary ↔ Niamoye | Niamoye et Sékou (père de Bakary) sont sibling-équivalents par parents cross (Modibo-Hadja). Sexes opposés ♂/♀. Donc Niamoye est cross-tante du père de Bakary → Niamoye est `hawa` pour Bakary, Bakary est `izé` pour Niamoye. |
| Djéneba ↔ Lassana | Djéneba et Bakary (père de Lassana) sont vrais frère-sœur, sexes opposés. Djéneba est `hawa` pour Lassana, Lassana est `izé` pour Djéneba. |
| Bakary ↔ Cheick (via Djéneba) | Couple (Bakary♂, Djéneba♀) cross supérieur ♂. Bakary est `hassa` pour Cheick, Cheick est `touba` pour Bakary. |

### Cas test 5 — Cousins germains

| Paire | Résultat attendu |
|---|---|
| Bakary ↔ Koniba | Parents Sékou et Tiéman, deux ♂ → même sexe → `arma` ↔ `arma` |
| Lassana ↔ Yaya | Parents Bakary et Koniba, deux ♂ → `arma` ↔ `arma` |
| Djéneba ↔ Lalla | Parents Sékou ♂ et Tiéman ♂... attendez Lalla est fille de Koniba, et Djéneba fille de Sékou. Parents Sékou ♂ et Koniba ♂... non, on prend les parents directs. Djéneba et Lalla : leurs parents directs sont Sékou et Koniba qui sont sibling-équivalents. Sexes ♂/♂ même → `woyma` mutuellement. |
| Bakary ↔ Niamoye | (déjà vu, hawa/izé car décalage de génération) |

### Cas test 6 — Cousins parallèles vs croisés au niveau cousin germain

| Paire | Résultat attendu |
|---|---|
| Bakary ↔ enfants de Hadja's branch | pour les enfants de Bourama (s'ils existaient sans Djéneba) : parents Sékou ♂ et Bourama ♂ → arma. Mais Bourama père de Cheick. Bakary ↔ Cheick via Bourama uniquement : parents Sékou ♂ et Bourama ♂ → arma. **Attention : Cheick a deux parents donc deux instances LCA possibles.** |

### Cas test 7 — Le cas Cheick (relations multiples) — TEST CLÉ

**Cheick ↔ Bakary** doit retourner DEUX relations :

1. **Via Sékou (proche)** : LCA = Sékou, dA(Cheick)=2 (par M), dB(Bakary)=1. Décalage 1, couple (Bakary♂, Djéneba♀) cross ♂. → Bakary est `hassa` pour Cheick, Cheick est `touba` pour Bakary.

2. **Via Sira (éloigné)** : LCA = Sira (par la branche paternelle de Cheick passant par Bourama→Hadja→Sira, et par la branche de Bakary passant par Sékou→Modibo→Sira). dA=3, dB=3. Parents directs Bourama♂ et Sékou♂, même sexe → `arma`/`arma`.

Tri par proximité : la relation hassa/touba (somme=3) sort avant la relation arma (somme=6).

### Cas test 8 — Soumaïla ↔ Aïssata (effet du "reset")

Lassana et Cheick sont eux-mêmes baassa via Bakary♂-Djéneba♀.
Mais Soumaïla et Aïssata : leurs parents directs sont Lassana♂ et Cheick♂, deux ♂.
Résultat : Soumaïla est `arma` pour Aïssata, Aïssata est `woyma` pour Soumaïla.

L'historique baassa au-dessus est totalement oublié — c'est la propriété de "reset" du système songhay.

### Cas test 9 — Boubou ↔ Néné (cousins très éloignés)

LCA = Sira (G0), dA(Boubou)=5, dB(Néné)=5. Parents directs Soumaïla♂ et Issouf♂, deux ♂.
Résultat : Boubou est `arma` pour Néné, Néné est `woyma` pour Boubou.

Même à 7 générations d'écart, le reset à chaque cran fait que la classification reste celle de "frère/sœur" — et c'est la réalité sociale en pays songhay.

### Cas test 10 — Refus pour parent inconnu

Si l'algorithme tente de classifier une paire dont un chemin remontant nécessite un parent dont l'identifiant est `null`, il doit retourner :
```
{ kind: 'incomplete', missingParents: [<liste des id parents requis mais absents>] }
```
Sans deviner ni proposer une classification approximative.

### Cas test 11 — Aucun lien de sang

Si A et B n'ont strictement aucun ancêtre commun (deux familles séparées), l'algorithme retourne `{ kind: 'no-link' }`.

---

## 7. Edge cases et pièges à éviter

1. **Cycles dans le graphe.** Bien qu'impossibles biologiquement (on ne peut pas être son propre ancêtre), prévoir une garde-fou avec `max_depth` dans le DFS pour les cas d'erreur de saisie.

2. **Filtrage des LCAs minimaux.** C'est l'étape la plus subtile. Pour deux chemins (pathA, pathB) atteignant un ancêtre X, ces chemins ne représentent une instance LCA minimale que s'il n'existe pas d'autre ancêtre commun Y atteint en s'arrêtant plus tôt sur **les deux** chemins simultanément. Penser à tester avec les unions consanguines.

3. **Identification du parent direct sur le chemin.** Pour `dA = dB`, on récupère le parent via le PREMIER élément du chemin (pathA[0]). C'est ce parent qui détermine la classification, pas un ancêtre plus haut.

4. **Identification du couple sibling-équivalent en cas de décalage.** Pour `delta = 1`, le couple est (supérieur, parent_de_inférieur_au_même_niveau). Le parent de l'inférieur au même niveau que le supérieur est l'ancêtre de l'inférieur situé sur le chemin à l'indice 0 (le tout premier saut).

5. **Côté baba vs côté gna.** Toujours déterminé par le PREMIER saut du chemin de la personne inférieure. Peu importe ce qui suit.

6. **Demi-frères/sœurs.** Le système songhay ne distingue PAS les demi-frères/sœurs. Si A et B ont un seul parent commun, l'algorithme les classe comme `arma`/`woyma` exactement comme s'ils étaient frères/sœurs complets.

7. **Plusieurs LCAs à la même génération.** Pour deux vrais frères (parents communs Modibo+Sira), il y a deux LCAs (Modibo et Sira) atteignables avec dA=dB=1 chacun. Mais les classifications sont identiques (les deux donnent `arma`). La déduplication finale élimine le doublon.

8. **Performance.** Pour des arbres très profonds (10+ générations), le nombre de chemins peut exploser en cas d'unions consanguines multiples. Limiter `max_depth` à 20 et envisager une mémoïsation des sous-chemins pour Alykoira si l'arbre dépasse 1000 personnes.

---

## 8. Format de sortie attendu

Pour une paire (A, B), l'algorithme retourne soit un statut simple, soit une liste ordonnée de relations :

```typescript
// Exemple de sortie pour Cheick ↔ Bakary
{
  kind: 'relations',
  relations: [
    {
      termForA: 'touba',
      termForB: 'hassa',
      via: 'sekou',
      pathA: ['M', 'P'],
      pathB: ['P'],
      distanceA: 2,
      distanceB: 1,
      proximityScore: 3,
      balanceScore: 2,
      details: "Cheick est touba pour Bakary (oncle maternel) car la mère de Cheick (Djéneba) est sœur de Bakary."
    },
    {
      termForA: 'arma',
      termForB: 'arma',
      via: 'sira',
      pathA: ['P', 'M', 'M'],
      pathB: ['P', 'P', 'M'],
      distanceA: 3,
      distanceB: 3,
      proximityScore: 6,
      balanceScore: 3,
      details: "Cheick et Bakary sont arma via Sira, par leurs pères respectifs (Bourama et Sékou) eux-mêmes enfants de la fratrie Hadja-Modibo."
    }
  ]
}
```

---

## 9. Références culturelles

- Le système d'avunculat (statut spécial de l'oncle maternel) est typique de nombreuses sociétés sahéliennes.
- La fusion cousins parallèles / fratrie est caractéristique des systèmes "iroquois" et "soudanais" en anthropologie de la parenté (Lewis Henry Morgan, 1871).
- Le règne de plaisanterie (*sanankuya* en bambara, *masaaba* chez les songhay) entre certaines paires de parenté justifie le marquage lexical de relations spécifiques.
- L'alliance par mariage avec une nièce indirecte est attestée dans plusieurs traditions ouest-africaines, ce qui justifie la coexistence de relations de sang multiples entre deux personnes.

---

*Document destiné à l'IA d'implémentation. Toute ambiguïté résiduelle doit faire l'objet d'une question avant codage.*

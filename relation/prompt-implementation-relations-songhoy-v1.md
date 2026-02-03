# 📋 PROMPT D'IMPLÉMENTATION — Algorithme de Relations Familiales Songhoy

## Application Généalogique Famille Aly Koïra

---

## CONTEXTE

L'application de généalogie de la famille Aly Koïra (Gao, Mali) contient un arbre de 343 membres sur 8 générations. Chaque personne a : un identifiant, un nom, un prénom, un sexe (M/F), une date de naissance (ou année estimée), un père (référence), une mère (référence), et un statut vivant/décédé.

L'objectif est d'implémenter un **algorithme qui détermine automatiquement la relation familiale entre deux personnes A et B**, en utilisant la **terminologie Songhoy** propre à la culture de Gao. Les termes Songhoy sont stockés dans des **tables de référence modifiables par les administrateurs** uniquement, afin de pouvoir corriger l'orthographe ou ajouter de nouveaux termes sans toucher au code.

---

## 1. MODÈLE DE DONNÉES — TABLES DE RÉFÉRENCE

### 1.1 Table `relation_categories` — Catégories de relations

Chaque catégorie regroupe un type de relation familiale.

```
relation_categories
├── id              (PK, auto-increment)
├── code            (VARCHAR unique, clé technique, NE CHANGE JAMAIS)
├── label_songhoy   (VARCHAR, nom en Songhoy — modifiable par admin)
├── label_fr        (VARCHAR, nom en français — modifiable par admin)
├── description     (TEXT, explication du contexte culturel)
├── display_order   (INT, ordre d'affichage)
├── created_at      (TIMESTAMP)
└── updated_at      (TIMESTAMP)
```

**Données initiales :**

| code | label_songhoy | label_fr | description |
|------|--------------|----------|-------------|
| `SIBLINGS` | — | Frères et Sœurs | Enfants du même parent direct |
| `HALF_SIBLINGS` | BABA FO IZAYES | Demi-frères/sœurs | Même père, mères différentes |
| `COUSINS_PATRI` | ARROUHINKAYE IZAY | Cousins patrilatéraux | Pères sont frères |
| `COUSINS_MATRI` | WAYUHINKAYE IZAY | Cousins matrilatéraux | Mères sont sœurs, s'appellent aussi ARMA/WEYMA |
| `COUSINS_CROSS` | BAASSEY | Cousins croisés | Un père et une mère sont frère/sœur |
| `UNCLE_AUNT` | — | Oncle / Tante | Génération supérieure, diff=1 |
| `NEPHEW_NIECE` | — | Neveu / Nièce | Génération inférieure, diff=1 |
| `GRANDPARENT` | KAAGA | Grand-parent / Ancêtre | Génération supérieure, diff≥2, avec niveau |
| `GRANDCHILD` | HAAMA | Petit-enfant / Descendant | Génération inférieure, diff≥2 |

### 1.2 Table `relation_terms` — Termes de relation

Chaque terme est un mot Songhoy utilisé pour nommer une relation. Un terme est lié à une catégorie et à des conditions (sexe de A, sexe de B, sexe du nœud branche, aîné/cadet).

```
relation_terms
├── id                  (PK, auto-increment)
├── category_id         (FK → relation_categories.id)
├── code                (VARCHAR unique, clé technique, NE CHANGE JAMAIS)
├── term_songhoy        (VARCHAR, le terme Songhoy — MODIFIABLE par admin)
├── pronunciation       (VARCHAR, guide de prononciation — modifiable)
├── label_fr            (VARCHAR, traduction française — modifiable)
├── description         (TEXT, explication détaillée — modifiable)
├── sex_of_speaker      (ENUM: 'M', 'F', 'ANY') — sexe de celui QUI parle
├── sex_of_target       (ENUM: 'M', 'F', 'ANY') — sexe de celui À QUI on s'adresse
├── context_condition   (VARCHAR, condition supplémentaire, ex: "ELDER", "YOUNGER")
├── is_active           (BOOLEAN, default true — pour désactiver sans supprimer)
├── display_order       (INT, ordre dans la catégorie)
├── created_at          (TIMESTAMP)
└── updated_at          (TIMESTAMP)
```

**Données initiales — Termes de Fratrie (SIBLINGS) :**

| code | term_songhoy | label_fr | sex_of_speaker | sex_of_target | context_condition |
|------|-------------|----------|----------------|---------------|-------------------|
| `ARMA` | ARMA | Frère | ANY | M | — |
| `WAYMA` | WAYMA | Sœur (dit par un homme) | M | F | — |
| `WEYMA` | WEYMA | Sœur (entre femmes) | F | F | — |

**Données initiales — Demi-fratrie (HALF_SIBLINGS) :**

| code | term_songhoy | label_fr | sex_of_speaker | sex_of_target | context_condition |
|------|-------------|----------|----------------|---------------|-------------------|
| `BABA_FO_IZAYES` | BABA FO IZAYES | Demi-frère/sœur de même père | ANY | ANY | SAME_FATHER |

> Note : Les demi-frères/sœurs utilisent aussi les termes ARMA/WAYMA/WEYMA en complément.

**Données initiales — Cousins patrilatéraux (COUSINS_PATRI) :**

| code | term_songhoy | label_fr | sex_of_speaker | sex_of_target | context_condition |
|------|-------------|----------|----------------|---------------|-------------------|
| `ARROUHINKAYE_IZAY` | ARROUHINKAYE IZAY | Cousins (pères frères) | ANY | ANY | — |
| `BABA_BERO` | BABA BERO | Grand-père / père aîné | ANY | ANY | ELDER |
| `BABA_KATCHA` | BABA KATCHA | Petit père / père cadet | ANY | ANY | YOUNGER |

**Données initiales — Cousins matrilatéraux (COUSINS_MATRI) :**

| code | term_songhoy | label_fr | sex_of_speaker | sex_of_target | context_condition |
|------|-------------|----------|----------------|---------------|-------------------|
| `WAYUHINKAYE_IZAY` | WAYUHINKAYE IZAY | Cousins (mères sœurs) | ANY | ANY | — |
| `NIAN_BERO` | NIAN BERO | Grande mère / mère aînée | ANY | ANY | ELDER |
| `NIAN_KEYNA` | NIAN KEYNA | Petite mère / mère cadette | ANY | ANY | YOUNGER |

> Note : Les cousins matrilatéraux utilisent aussi ARMA/WEYMA entre eux.

**Données initiales — Cousins croisés (COUSINS_CROSS) :**

| code | term_songhoy | label_fr | sex_of_speaker | sex_of_target | context_condition |
|------|-------------|----------|----------------|---------------|-------------------|
| `BAASSEY` | BAASSEY | Cousins croisés (générique) | ANY | ANY | — |
| `BAASSARO` | BAASSARO | Cousin croisé (homme) | ANY | M | — |
| `BAASSA_WOYO` | BAASSA WOYO | Cousine croisée (femme) | ANY | F | — |

**Données initiales — Oncle/Tante (UNCLE_AUNT) :**

| code | term_songhoy | label_fr | sex_of_speaker | sex_of_target | context_condition |
|------|-------------|----------|----------------|---------------|-------------------|
| `BABA_BERO_UNCLE` | BABA BERO | Oncle paternel aîné | ANY | M | ELDER |
| `BABA_KATCHA_UNCLE` | BABA KATCHA | Oncle paternel cadet | ANY | M | YOUNGER |
| `NIAN_BERO_AUNT` | NIAN BERO | Tante maternelle aînée | ANY | F | ELDER |
| `NIAN_KEYNA_AUNT` | NIAN KEYNA | Tante maternelle cadette | ANY | F | YOUNGER |
| `HASSA` | HASSA | Oncle maternel | ANY | M | MATERNAL_UNCLE |
| `HAWA` | HAWA | Tante paternelle | ANY | F | PATERNAL_AUNT |

**Données initiales — Neveu/Nièce (NEPHEW_NIECE) :**

| code | term_songhoy | label_fr | sex_of_speaker | sex_of_target | context_condition |
|------|-------------|----------|----------------|---------------|-------------------|
| `IZE` | IZE | Enfant / Neveu / Nièce | ANY | ANY | — |
| `TOUBA` | TOUBA | Neveu/Nièce (de l'oncle maternel) | M | ANY | FROM_HASSA |

**Données initiales — Grand-parent (GRANDPARENT) :**

| code | term_songhoy | label_fr | sex_of_speaker | sex_of_target | context_condition |
|------|-------------|----------|----------------|---------------|-------------------|
| `KAAGAAROU` | KAAGAAROU | Grand-père / Ancêtre homme | ANY | M | — |
| `KAAGAWOY` | KAAGAWOY | Grand-mère / Ancêtre femme | ANY | F | — |

**Données initiales — Petit-enfant (GRANDCHILD) :**

| code | term_songhoy | label_fr | sex_of_speaker | sex_of_target | context_condition |
|------|-------------|----------|----------------|---------------|-------------------|
| `HAAMA` | HAAMA | Petit-enfant / Descendant | ANY | ANY | — |

---

## 2. ALGORITHME — SPÉCIFICATION COMPLÈTE

### 2.1 Entrées

- **personA** : objet Personne (id, sex, birthDate, fatherId, motherId)
- **personB** : objet Personne (id, sex, birthDate, fatherId, motherId)
- **terms** : dictionnaire de termes chargé depuis `relation_terms` (clé = code)

### 2.2 Sortie

Un tableau de résultats, chaque élément contenant :
```json
{
  "commonAncestor": { "id": 42, "name": "Aly Koïra" },
  "category": "COUSINS_PATRI",
  "categoryLabel": "ARROUHINKAYE IZAY",
  "termAtoB": { "code": "BABA_BERO", "songhoy": "BABA BERO", "french": "Grand-père / père aîné" },
  "termBtoA": { "code": "BABA_KATCHA", "songhoy": "BABA KATCHA", "french": "Petit père" },
  "levelA": 2,
  "levelB": 2,
  "details": "Moussa (père de A) est BABA BERO pour B — Ibrahim (père de B) est BABA KATCHA pour A"
}
```

### 2.3 Pseudocode

```
FONCTION déterminerRelations(personA, personB, terms):

    résultats ← []

    // ═══════════════════════════════════════════════
    // ÉTAPE 1 : Trouver les ancêtres communs
    // ═══════════════════════════════════════════════
    
    ancêtresA ← collecterAncêtres(personA)  
    // Retourne Map<ancestorId, { ancestor, path[], level }>
    // path = chemin de l'ancêtre vers la personne
    
    ancêtresB ← collecterAncêtres(personB)
    
    communsIds ← intersection(ancêtresA.keys, ancêtresB.keys)
    
    SI communsIds EST VIDE:
        Retourner []

    // ═══════════════════════════════════════════════
    // ÉTAPE 2 : Pour chaque ancêtre commun
    // ═══════════════════════════════════════════════
    
    POUR CHAQUE ancestorId DANS communsIds:
    
        infoA ← ancêtresA[ancestorId]
        infoB ← ancêtresB[ancestorId]
        
        niveauA ← infoA.level     // distance ancêtre → A
        niveauB ← infoB.level     // distance ancêtre → B
        
        // Nœuds branches (enfants directs de l'ancêtre commun)
        brancheA ← infoA.path[0]  // 1er enfant de C sur chemin vers A
        brancheB ← infoB.path[0]  // 1er enfant de C sur chemin vers B
        
        // Si même branche, pas de relation croisée → skip
        SI brancheA.id = brancheB.id:
            CONTINUER
        
        // Normaliser : A est toujours le plus proche (ou égal)
        SI niveauA > niveauB:
            ÉCHANGER(personA, personB, niveauA, niveauB, brancheA, brancheB, infoA, infoB)
        
        diff ← niveauB - niveauA
        
        // ─────────────────────────────────────────
        // CAS 1 : FRÈRES / SŒURS (niveauA = niveauB = 1)
        // ─────────────────────────────────────────
        SI niveauA = 1 ET niveauB = 1:
        
            relation ← nouveau Résultat()
            relation.commonAncestor ← ancêtre
            relation.levelA ← 1
            relation.levelB ← 1
            
            // Détecter demi-fratrie
            estDemi ← (personA.fatherId = personB.fatherId ET personA.motherId ≠ personB.motherId)
            
            SI estDemi:
                relation.category ← "HALF_SIBLINGS"
                relation.categoryLabel ← terms["BABA_FO_IZAYES"].term_songhoy
            SINON:
                relation.category ← "SIBLINGS"
            
            // Termes d'appel entre eux
            SI personA.sex = M ET personB.sex = M:
                relation.termAtoB ← terms["ARMA"]
                relation.termBtoA ← terms["ARMA"]
                
            SINON SI personA.sex = M ET personB.sex = F:
                relation.termAtoB ← terms["ARMA"]
                relation.termBtoA ← terms["WAYMA"]
                
            SINON SI personA.sex = F ET personB.sex = M:
                relation.termAtoB ← terms["WAYMA"]
                relation.termBtoA ← terms["ARMA"]
                
            SINON: // F et F
                relation.termAtoB ← terms["WEYMA"]
                relation.termBtoA ← terms["WEYMA"]
            
            Ajouter(résultats, relation)

        // ─────────────────────────────────────────
        // CAS 2 : COUSINS (niveauA = niveauB > 1)
        // ─────────────────────────────────────────
        SINON SI niveauA = niveauB:
        
            relation ← nouveau Résultat()
            relation.commonAncestor ← ancêtre
            relation.levelA ← niveauA
            relation.levelB ← niveauB
            
            sexBrancheA ← brancheA.sex
            sexBrancheB ← brancheB.sex
            
            // ── 2a. Pères sont frères → ARROUHINKAYE IZAY ──
            SI sexBrancheA = M ET sexBrancheB = M:
                relation.category ← "COUSINS_PATRI"
                relation.categoryLabel ← terms["ARROUHINKAYE_IZAY"].term_songhoy
                
                SI estPlusAgé(brancheA, brancheB):
                    // PA est l'aîné
                    relation.termAtoB ← terms["BABA_BERO"]   // père de A = BABA BERO pour B
                    relation.termBtoA ← terms["BABA_KATCHA"] // père de B = BABA KATCHA pour A
                SINON:
                    relation.termAtoB ← terms["BABA_KATCHA"]
                    relation.termBtoA ← terms["BABA_BERO"]
            
            // ── 2b. Mères sont sœurs → WAYUHINKAYE IZAY ──
            SINON SI sexBrancheA = F ET sexBrancheB = F:
                relation.category ← "COUSINS_MATRI"
                relation.categoryLabel ← terms["WAYUHINKAYE_IZAY"].term_songhoy
                
                SI estPlusAgé(brancheA, brancheB):
                    relation.termAtoB ← terms["NIAN_BERO"]
                    relation.termBtoA ← terms["NIAN_KEYNA"]
                SINON:
                    relation.termAtoB ← terms["NIAN_KEYNA"]
                    relation.termBtoA ← terms["NIAN_BERO"]
                
                // EN PLUS : A et B s'appellent ARMA ou WEYMA
                relation.additionalTermAtoB ← (personA.sex = F) ? terms["WEYMA"] : terms["ARMA"]
                relation.additionalTermBtoA ← (personB.sex = F) ? terms["WEYMA"] : terms["ARMA"]
            
            // ── 2c. Mixte → BAASSEY (cousins croisés) ──
            SINON:
                relation.category ← "COUSINS_CROSS"
                relation.categoryLabel ← terms["BAASSEY"].term_songhoy
                
                relation.termAtoB ← (personA.sex = F) ? terms["BAASSA_WOYO"] : terms["BAASSARO"]
                relation.termBtoA ← (personB.sex = F) ? terms["BAASSA_WOYO"] : terms["BAASSARO"]
            
            Ajouter(résultats, relation)

        // ─────────────────────────────────────────
        // CAS 3 : GÉNÉRATIONS DIFFÉRENTES (niveauA < niveauB)
        // A est la personne la plus haute (plus proche de l'ancêtre)
        // ─────────────────────────────────────────
        SINON:
        
            relation ← nouveau Résultat()
            relation.commonAncestor ← ancêtre
            relation.levelA ← niveauA
            relation.levelB ← niveauB
            
            // NB = nœud sur la branche de B au même niveau que A
            NB ← infoB.path[niveauA - 1]  // le noeud au même niveau que A dans le chemin de B
            
            // ── 3a. diff = 1 → Oncle/Tante ↔ Neveu/Nièce ──
            SI diff = 1:
            
                // --- A ♀ et NB ♀ (sœurs) → A = NIA pour B ---
                SI personA.sex = F ET NB.sex = F:
                    relation.category ← "UNCLE_AUNT"
                    SI estPlusAgé(NB, personA):
                        // NB plus âgée → A est la cadette → NIA KEYNA
                        relation.termAtoB ← terms["NIAN_KEYNA_AUNT"]
                    SINON:
                        relation.termAtoB ← terms["NIAN_BERO_AUNT"]
                    relation.termBtoA ← terms["IZE"]
                
                // --- A ♂ et NB ♀ (frère de la mère) → A = HASSA ---
                SINON SI personA.sex = M ET NB.sex = F:
                    relation.category ← "UNCLE_AUNT"
                    relation.termAtoB ← terms["HASSA"]
                    relation.termBtoA ← terms["TOUBA"]
                
                // --- A ♂ et NB ♂ (frères) → A = BABA pour B ---
                SINON SI personA.sex = M ET NB.sex = M:
                    relation.category ← "UNCLE_AUNT"
                    SI estPlusAgé(NB, personA):
                        relation.termAtoB ← terms["BABA_KATCHA_UNCLE"]
                    SINON:
                        relation.termAtoB ← terms["BABA_BERO_UNCLE"]
                    relation.termBtoA ← terms["IZE"]
                
                // --- A ♀ et NB ♂ (sœur du père) → A = HAWA ---
                SINON:  // personA.sex = F ET NB.sex = M
                    relation.category ← "UNCLE_AUNT"
                    relation.termAtoB ← terms["HAWA"]
                    relation.termBtoA ← terms["IZE"]
            
            // ── 3b. diff ≥ 2 → Grand-parent ↔ Petit-enfant ──
            SINON:
                niveauKaaga ← diff
                
                SI personA.sex = M:
                    relation.category ← "GRANDPARENT"
                    relation.termAtoB ← terms["KAAGAAROU"]
                    relation.termAtoB.levelSuffix ← "de " + niveauKaaga + "ème niveau"
                SINON:
                    relation.category ← "GRANDPARENT"
                    relation.termAtoB ← terms["KAAGAWOY"]
                    relation.termAtoB.levelSuffix ← "de " + niveauKaaga + "ème niveau"
                
                relation.termBtoA ← terms["HAAMA"]
            
            Ajouter(résultats, relation)
    
    Retourner résultats
```

### 2.4 Fonctions Utilitaires

```
FONCTION collecterAncêtres(person):
    // BFS/DFS vers le haut de l'arbre
    résultat ← Map vide  // ancestorId → { ancestor, path[], level }
    file ← [ { person: person, path: [], level: 0 } ]
    
    TANT QUE file N'EST PAS VIDE:
        current ← file.défiler()
        
        POUR CHAQUE parent DANS [current.person.father, current.person.mother]:
            SI parent EXISTE:
                newPath ← [current.person] + current.path
                newLevel ← current.level + 1
                résultat[parent.id] ← { 
                    ancestor: parent, 
                    path: newPath,      // chemin de parent → person (sans parent lui-même)
                    level: newLevel 
                }
                file.enfiler({ person: parent, path: newPath, level: newLevel })
    
    Retourner résultat


FONCTION estPlusAgé(personX, personY):
    // Compare les dates de naissance (ou années estimées)
    SI personX.birthDate ET personY.birthDate:
        Retourner personX.birthDate < personY.birthDate
    // Si une date manque, utiliser l'ordre dans la fratrie ou retourner false
    Retourner false
```

---

## 3. VUE ADMIN — GESTION DES TERMES DE RÉFÉRENCE

### 3.1 Accès et Sécurité

- **Route** : `/admin/reference-terms` (ou équivalent dans l'application mobile)
- **Accès** : **Administrateurs uniquement** (rôle `ADMIN`)
- **Contrôle** : Vérifier le rôle de l'utilisateur connecté avant tout accès
- **Audit** : Logger chaque modification (qui, quand, ancien terme, nouveau terme)

### 3.2 Structure de la Vue

La page admin affiche **deux niveaux** :

**Niveau 1 — Liste des catégories :**

```
┌──────────────────────────────────────────────────────────┐
│  📚 Gestion des Termes de Parenté Songhoy               │
│  ⚠️ Réservé aux administrateurs                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🔵 Frères et Sœurs (SIBLINGS)                    [▶]   │
│  🔵 Demi-frères/sœurs — BABA FO IZAYES            [▶]   │
│  🟢 Cousins patrilatéraux — ARROUHINKAYE IZAY      [▶]   │
│  🟢 Cousins matrilatéraux — WAYUHINKAYE IZAY       [▶]   │
│  🟡 Cousins croisés — BAASSEY                      [▶]   │
│  🟠 Oncle / Tante                                  [▶]   │
│  🟠 Neveu / Nièce                                  [▶]   │
│  🟤 Grand-parent — KAAGA                           [▶]   │
│  🟤 Petit-enfant — HAAMA                           [▶]   │
│                                                          │
│  [+ Ajouter une catégorie]                               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Niveau 2 — Détail d'une catégorie (ex: Cousins croisés — BAASSEY) :**

```
┌──────────────────────────────────────────────────────────┐
│  ← Retour                                                │
│  🟡 Cousins croisés — BAASSEY                            │
│  Description : Un père et une mère sont frère/sœur       │
│  [✏️ Modifier catégorie]                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 1. BAASSEY                                         │  │
│  │    Français : Cousins croisés (générique)          │  │
│  │    Prononciation : baa-ssey                        │  │
│  │    Locuteur : Tout sexe → Tout sexe               │  │
│  │    ✅ Actif                           [✏️] [🗑️]  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 2. BAASSARO                                        │  │
│  │    Français : Cousin croisé (homme)                │  │
│  │    Prononciation : baas-sa-ro                      │  │
│  │    Locuteur : Tout sexe → ♂ Homme                 │  │
│  │    ✅ Actif                           [✏️] [🗑️]  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 3. BAASSA WOYO                                     │  │
│  │    Français : Cousine croisée (femme)              │  │
│  │    Prononciation : baas-sa woyo                    │  │
│  │    Locuteur : Tout sexe → ♀ Femme                 │  │
│  │    ✅ Actif                           [✏️] [🗑️]  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [+ Ajouter un terme]                                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Formulaire de modification d'un terme :**

```
┌──────────────────────────────────────────────────────────┐
│  ✏️ Modifier le terme                                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Code technique : BAASSARO         (lecture seule)       │
│                                                          │
│  Terme Songhoy :  [BAASSARO_____________]                │
│  Prononciation :  [baas-sa-ro____________]               │
│  Traduction FR :  [Cousin croisé (homme)_]               │
│  Description   :  [Homme en relation.....                │
│                    BAASSEY avec une autre                 │
│                    personne_______________]               │
│                                                          │
│  Sexe du locuteur :  ○ Homme  ○ Femme  ● Tous           │
│  Sexe de la cible :  ● Homme  ○ Femme  ○ Tous           │
│  Condition :         [________________________]          │
│                                                          │
│  Actif : [✅]                                            │
│                                                          │
│  [Annuler]                         [💾 Enregistrer]      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.3 Règles de Gestion Admin

| Règle | Détail |
|-------|--------|
| **Code technique** | Jamais modifiable après création (clé stable pour l'algorithme) |
| **Terme Songhoy** | Modifiable à tout moment (correction d'orthographe) |
| **Prononciation** | Optionnel, modifiable |
| **Traduction FR** | Modifiable |
| **Suppression** | Soft-delete uniquement (`is_active = false`), jamais de suppression physique |
| **Ajout** | L'admin peut ajouter de nouveaux termes dans une catégorie existante |
| **Catégorie** | L'admin peut modifier le label Songhoy et la description |
| **Historique** | Chaque modification est loggée dans une table `term_audit_log` |
| **Validation** | Le terme Songhoy ne peut pas être vide si le terme est actif |

### 3.4 Table d'audit

```
term_audit_log
├── id              (PK)
├── term_id         (FK → relation_terms.id, nullable si catégorie)
├── category_id     (FK → relation_categories.id, nullable si terme)
├── action          (ENUM: 'CREATE', 'UPDATE', 'DEACTIVATE', 'REACTIVATE')
├── field_changed   (VARCHAR, ex: "term_songhoy")
├── old_value       (TEXT)
├── new_value       (TEXT)
├── changed_by      (FK → users.id)
├── changed_at      (TIMESTAMP)
```

---

## 4. VUE UTILISATEUR — AFFICHAGE DES RELATIONS

### 4.1 Sélection de Deux Personnes

L'utilisateur peut déclencher le calcul de relation de deux manières :
- **Depuis l'arbre** : cliquer sur une personne A, puis "Comparer avec..." et sélectionner B
- **Depuis un menu** : page dédiée "Trouver la relation" avec deux champs de recherche/sélection

### 4.2 Affichage du Résultat

Pour chaque relation trouvée (il peut y en avoir plusieurs via différents ancêtres communs) :

```
┌──────────────────────────────────────────────────────────┐
│  🔗 Relation entre Amadou et Fatimata                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│       Amadou                    Fatimata                 │
│         │                          │                     │
│         └──── Aly Koïra ───────────┘                     │
│              (ancêtre commun)                            │
│                                                          │
│  📌 ARROUHINKAYE IZAY                                    │
│     Cousins patrilatéraux (pères sont frères)            │
│                                                          │
│  👤 Amadou → Fatimata :                                  │
│     Moussa (père d'Amadou) est BABA BERO pour Fatimata   │
│                                                          │
│  👤 Fatimata → Amadou :                                  │
│     Ibrahim (père de Fatimata) est BABA KATCHA pour      │
│     Amadou                                               │
│                                                          │
│  📏 Distance : 2 niveaux chacun                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Pour le cas KAAGAAROU/KAAGAWOY, afficher le niveau :

```
│  📌 KAAGA (Grand-parent / Ancêtre)                       │
│                                                          │
│  👤 Omar → Seydou :                                      │
│     Omar est KAAGAAROU de 3ème niveau pour Seydou        │
│                                                          │
│  👤 Seydou → Omar :                                      │
│     Seydou est HAAMA pour Omar                           │
```

### 4.3 Si Relations Multiples

Quand A et B sont liés par plusieurs ancêtres communs, afficher une liste avec un onglet ou section par relation.

---

## 5. CONTRAINTES TECHNIQUES

### 5.1 Performance

- L'arbre a 343 membres sur 8 générations : la recherche d'ancêtres est légère
- **Cacher** la map d'ancêtres si le même utilisateur consulte plusieurs relations de suite
- Le chargement des termes de référence se fait **une seule fois** au démarrage (ou en cache avec invalidation lors de modifications admin)

### 5.2 Chargement des Termes

```
AU DÉMARRAGE (ou au premier appel):
    termsMap ← Map vide
    POUR CHAQUE term DANS relation_terms OÙ is_active = true:
        termsMap[term.code] ← term
    Mettre en cache termsMap

QUAND ADMIN MODIFIE UN TERME:
    Invalider le cache termsMap
```

### 5.3 Cas Limites à Gérer

| Cas | Comportement attendu |
|-----|---------------------|
| A = B | Retourner "Même personne" |
| A et B sans ancêtre commun | Retourner "Aucune relation trouvée dans l'arbre" |
| Date de naissance manquante | Impossible de déterminer BERO/KATCHA → afficher les deux possibilités ou le terme générique |
| Père ou mère inconnu(e) | L'algorithme fonctionne avec les liens disponibles, mais peut manquer des relations |
| Même branche (brancheA = brancheB) | Ignorer cet ancêtre commun (pas de relation croisée) |
| Relations multiples | Afficher toutes les relations trouvées, triées par pertinence (ancêtre le plus proche en premier) |
| Terme désactivé par admin | L'algorithme utilise uniquement `is_active = true`, afficher "Terme non disponible" sinon |

---

## 6. PLAN D'IMPLÉMENTATION

### Phase 1 — Base de données et API termes
1. Créer les tables `relation_categories`, `relation_terms`, `term_audit_log`
2. Insérer les données initiales (voir section 1)
3. Créer les endpoints CRUD pour admin :
   - `GET /api/admin/relation-categories` — lister les catégories
   - `GET /api/admin/relation-categories/{id}/terms` — lister les termes d'une catégorie
   - `PUT /api/admin/relation-terms/{id}` — modifier un terme
   - `POST /api/admin/relation-terms` — ajouter un terme
   - `DELETE /api/admin/relation-terms/{id}` — soft-delete (désactiver)
4. Sécuriser les endpoints admin (vérification du rôle)

### Phase 2 — Algorithme
1. Implémenter `collecterAncêtres(person)` — parcours BFS vers le haut
2. Implémenter `déterminerRelations(personA, personB, terms)` — algorithme principal
3. Implémenter les fonctions utilitaires (`estPlusAgé`, etc.)
4. Créer l'endpoint public :
   - `GET /api/relations?personA={id}&personB={id}` — calcul de relation
5. Tests unitaires avec les exemples fournis (voir section 7)

### Phase 3 — Interface utilisateur
1. Vue admin : page de gestion des termes (catégories + termes)
2. Vue utilisateur : sélection de deux personnes
3. Vue utilisateur : affichage des résultats avec termes Songhoy
4. Intégration dans l'arbre (clic sur personne → "Voir relation avec...")

---

## 7. CAS DE TEST

### Test 1 — Frères (ARMA)
```
A = { sex: M, father: C, mother: D }
B = { sex: M, father: C, mother: D }
→ Attendu : SIBLINGS, A=ARMA pour B, B=ARMA pour A
```

### Test 2 — Frère et Sœur (ARMA / WAYMA)
```
A = { sex: M, father: C, mother: D }
B = { sex: F, father: C, mother: D }
→ Attendu : SIBLINGS, A=ARMA pour B, B=WAYMA pour A
```

### Test 3 — Sœurs (WEYMA)
```
A = { sex: F, father: C, mother: D }
B = { sex: F, father: C, mother: D }
→ Attendu : SIBLINGS, A=WEYMA pour B, B=WEYMA pour A
```

### Test 4 — Demi-frères (BABA FO IZAYES + ARMA)
```
A = { sex: M, father: C, mother: D1 }
B = { sex: M, father: C, mother: D2 }   // D1 ≠ D2
→ Attendu : HALF_SIBLINGS + BABA FO IZAYES, A=ARMA pour B, B=ARMA pour A
```

### Test 5 — Cousins patrilatéraux (ARROUHINKAYE IZAY)
```
Ancêtre commun = G (grand-père)
G → PA (fils aîné, M, 60 ans) → A
G → PB (fils cadet, M, 55 ans) → B
→ Attendu : COUSINS_PATRI, ARROUHINKAYE IZAY
   PA = BABA BERO pour B, PB = BABA KATCHA pour A
```

### Test 6 — Cousins matrilatéraux (WAYUHINKAYE IZAY)
```
Ancêtre commun = G
G → MA (fille aînée, F, 50 ans) → A (sex: F)
G → MB (fille cadette, F, 45 ans) → B (sex: M)
→ Attendu : COUSINS_MATRI, WAYUHINKAYE IZAY
   MA = NIAN BERO pour B, MB = NIAN KEYNA pour A
   + A=WEYMA... non, A est F et B est M → A=WAYMA pour B, B=ARMA pour A
```

### Test 7 — Cousins croisés (BAASSEY)
```
Ancêtre commun = G
G → PA (fils, M) → A (sex: F)
G → MB (fille, F) → B (sex: M)
→ Attendu : COUSINS_CROSS, BAASSEY
   A = BAASSA WOYO, B = BAASSARO
```

### Test 8 — Oncle maternel (HASSA / TOUBA)
```
Ancêtre commun = G
G → A (fils, M)           ← niveau 1
G → NB (fille, F) → B    ← niveau 2
→ Attendu : UNCLE_AUNT, A=HASSA pour B, B=TOUBA pour A
```

### Test 9 — Tante paternelle (HAWA)
```
Ancêtre commun = G
G → A (fille, F)          ← niveau 1
G → NB (fils, M) → B     ← niveau 2
→ Attendu : UNCLE_AUNT, A=HAWA pour B, B=IZE pour A
```

### Test 10 — Oncle paternel aîné (BABA BERO)
```
Ancêtre commun = G
G → A (fils, M, 60 ans)           ← niveau 1
G → NB (fils, M, 65 ans) → B     ← niveau 2
→ Attendu : UNCLE_AUNT, A=BABA KATCHA pour B (car NB plus âgé), B=IZE pour A
```

### Test 11 — Tante maternelle cadette (NIAN KEYNA)
```
Ancêtre commun = G
G → A (fille, F, 40 ans)          ← niveau 1
G → NB (fille, F, 50 ans) → B    ← niveau 2
→ Attendu : UNCLE_AUNT, A=NIAN KEYNA pour B (car NB plus âgée), B=IZE pour A
```

### Test 12 — Grand-parent niveau 2 (KAAGAAROU)
```
Ancêtre commun = G
G → A (fils, M)                   ← niveau 1
G → X (autre enfant) → Y → B     ← niveau 3
diff = 2
→ Attendu : GRANDPARENT, A=KAAGAAROU de 2ème niveau pour B, B=HAAMA pour A
```

### Test 13 — Grand-parent niveau 3, femme (KAAGAWOY)
```
Ancêtre commun = G
G → A (fille, F)                       ← niveau 1
G → X → Y → Z → B                     ← niveau 4
diff = 3
→ Attendu : GRANDPARENT, A=KAAGAWOY de 3ème niveau pour B, B=HAAMA pour A
```

### Test 14 — Aucune relation
```
A et B n'ont aucun ancêtre commun dans l'arbre
→ Attendu : [] (tableau vide), message "Aucune relation trouvée"
```

### Test 15 — Même personne
```
A = B
→ Attendu : message "Même personne sélectionnée"
```

---

## 8. GLOSSAIRE RAPIDE DES TERMES

| Terme Songhoy | Prononciation | Signification |
|:--------------|:-------------|:-------------|
| ARMA | ar-ma | Frère |
| WAYMA | ouai-ma | Sœur (dit par un homme) |
| WEYMA | ouey-ma | Sœur (entre femmes) |
| BABA FO IZAYES | ba-ba fo i-zay | Demi-frères/sœurs (même père) |
| ARROUHINKAYE IZAY | ar-rou-hin-kay i-zay | Cousins (pères frères) |
| WAYUHINKAYE IZAY | ouay-ou-hin-kay i-zay | Cousins (mères sœurs) |
| BAASSEY | baas-sey | Cousins croisés |
| BAASSARO | baas-sa-ro | Cousin croisé homme |
| BAASSA WOYO | baas-sa ouoyo | Cousine croisée femme |
| BABA BERO | ba-ba bé-ro | Grand-père / père aîné |
| BABA KATCHA | ba-ba kat-cha | Petit père / père cadet |
| NIAN BERO | gnian bé-ro | Grande mère / mère aînée |
| NIAN KEYNA | gnian key-na | Petite mère / mère cadette |
| HASSA | has-sa | Oncle maternel |
| HAWA | ha-oua | Tante paternelle |
| IZE | i-zé | Enfant / neveu / nièce |
| TOUBA | tou-ba | Neveu (de l'oncle maternel) |
| KAAGAAROU | kaa-gaa-rou | Grand-père / ancêtre homme |
| KAAGAWOY | kaa-ga-ouoy | Grand-mère / ancêtre femme |
| HAAMA | haa-ma | Petit-enfant / descendant |

---

*Prompt d'implémentation — Application Généalogie Famille Aly Koïra*
*Gao, Mali — Février 2025*

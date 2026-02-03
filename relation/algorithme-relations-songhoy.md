# 🌳 Algorithme de Reconnaissance des Relations Familiales Songhoy

## Application Généalogique — Famille Aly Koïra, Gao (Mali)

---

## 1. Vue d'Ensemble de l'Algorithme

```mermaid
flowchart TD
    START([🔍 Entrée: Personne A et Personne B]) --> S1
    S1[Étape 1: Trouver tous les ancêtres communs] --> S2
    S2{Ancêtres communs trouvés ?}
    S2 -->|Non| NONE([❌ Aucune relation trouvée])
    S2 -->|Oui| LOOP[Pour chaque ancêtre commun C]
    LOOP --> S3[Étape 2: Calculer niveau_A et niveau_B\nDistance de C à A et de C à B]
    S3 --> CHECK{Comparer les niveaux}

    CHECK -->|niveau_A = niveau_B = 1| CAS1[🟦 CAS 1\nFrères et Sœurs]
    CHECK -->|niveau_A = niveau_B > 1| CAS2[🟩 CAS 2\nCousins - Même niveau]
    CHECK -->|niveau_A ≠ niveau_B| CAS3[🟧 CAS 3\nGénérations différentes]

    CAS1 --> RESULT([📋 Relation identifiée])
    CAS2 --> RESULT
    CAS3 --> RESULT

    RESULT --> MORE{Autres ancêtres\ncommuns ?}
    MORE -->|Oui| LOOP
    MORE -->|Non| END([✅ Liste complète\ndes relations])

    style CAS1 fill:#4A90D9,color:#fff
    style CAS2 fill:#27AE60,color:#fff
    style CAS3 fill:#E67E22,color:#fff
```

---

## 2. Concepts de Base

### 2.1 Structure de l'Arbre Généalogique

```mermaid
graph TD
    ROOT["👴 Ancêtre le plus ancien\n(racine de l'arbre)"]
    ROOT --> G2A["Génération 2"]
    ROOT --> G2B["Génération 2"]
    G2A --> G3A["Génération 3"]
    G2A --> G3B["Génération 3"]
    G2B --> G3C["Génération 3"]
    G3A --> G4A["Génération 4"]
    G3C --> G4B["Génération 4"]

    style ROOT fill:#8B4513,color:#fff
```

### 2.2 Définitions

| Terme | Définition |
|-------|-----------|
| **Ancêtre commun (C)** | Un noeud de l'arbre dont descendent à la fois A et B |
| **Niveau (distance)** | Nombre de liens parent→enfant entre C et une personne |
| **Noeud branche** | Premier descendant de C sur le chemin vers A ou B |
| **PA / PB** | Noeud branche de C vers A / vers B (enfant direct de C sur chaque branche) |

---

## 3. Étape 1 — Trouver les Ancêtres Communs

### Algorithme

```
Fonction TrouverAncêtresCommuns(A, B):
    ancêtres_A = TousLesAncêtres(A)    // remonter tous les parents
    ancêtres_B = TousLesAncêtres(B)    // remonter tous les parents
    communs = ancêtres_A ∩ ancêtres_B   // intersection
    Retourner communs
```

### Schéma : Ancêtres communs de A et B

```mermaid
graph TD
    C1["✅ C1 - Ancêtre commun"]:::common
    C1 --> X1["X1"]
    C1 --> X2["X2"]
    X1 --> X3["X3"]
    X1 --> X4["X4"]
    X2 --> X5["X5"]
    X3 --> A["🟦 A"]:::personA
    X5 --> B["🟥 B"]:::personB

    classDef common fill:#FFD700,color:#000,stroke:#B8860B
    classDef personA fill:#4A90D9,color:#fff
    classDef personB fill:#E74C3C,color:#fff
```

> **C1** est un ancêtre commun car A et B en descendent tous les deux.

---

## 4. Étape 2 — Calculer les Niveaux

Pour chaque ancêtre commun **C**, on calcule :

- **niveau_A** = distance de C à A (nombre de générations)
- **niveau_B** = distance de C à B (nombre de générations)
- **PA** = enfant direct de C sur le chemin vers A
- **PB** = enfant direct de C sur le chemin vers B

---

## 5. 🟦 CAS 1 — Frères et Sœurs (niveau_A = niveau_B = 1)

> L'ancêtre commun C est le **parent direct** de A et B.

### Schéma structurel

```mermaid
graph TD
    C["👤 C\nParent commun\n(niveau 0)"]
    C -->|"niveau 1"| A["🟦 A"]
    C -->|"niveau 1"| B["🟥 B"]

    style C fill:#8B4513,color:#fff
    style A fill:#4A90D9,color:#fff
    style B fill:#E74C3C,color:#fff
```

### Arbre de décision

```mermaid
flowchart TD
    START{{"CAS 1: Frères/Sœurs\nniveau_A = niveau_B = 1"}}
    START --> Q1{"Sexe de A ?"}

    Q1 -->|"♂ Homme"| Q2H{"Sexe de B ?"}
    Q1 -->|"♀ Femme"| Q2F{"Sexe de B ?"}

    Q2H -->|"♂ Homme"| R1["A est **ARMA** pour B\nB est **ARMA** pour A\n👬 Frères"]
    Q2H -->|"♀ Femme"| R2["A est **ARMA** pour B\nB est **WAYMA** pour A\n👫 Frère et Sœur"]

    Q2F -->|"♀ Femme"| R3["A est **WEYMA** pour B\nB est **WEYMA** pour A\n👭 Sœurs"]
    Q2F -->|"♂ Homme"| R4["A est **WAYMA** pour B\nB est **ARMA** pour A\n👫 Sœur et Frère"]

    style R1 fill:#3498DB,color:#fff
    style R2 fill:#2ECC71,color:#fff
    style R3 fill:#E91E63,color:#fff
    style R4 fill:#9B59B6,color:#fff
```

### Tableau récapitulatif — Frères et Sœurs

| Sexe A | Sexe B | A est ... pour B | B est ... pour A | Relation |
|--------|--------|------------------|------------------|----------|
| ♂ | ♂ | **ARMA** | **ARMA** | Frères |
| ♂ | ♀ | **ARMA** | **WAYMA** | Frère / Sœur |
| ♀ | ♂ | **WAYMA** | **ARMA** | Sœur / Frère |
| ♀ | ♀ | **WEYMA** | **WEYMA** | Sœurs |

> **ARMA** = frère (terme masculin)
> **WAYMA** = sœur (du point de vue d'un homme)
> **WEYMA** = sœur (entre femmes)

### 5.2 Sous-cas : Demi-frères / Demi-sœurs — BABA FO IZAYES

> Quand A et B ont le **même père mais des mères différentes**,
> on dit qu'ils sont **BABA FO IZAYES** (enfants d'un même père).

```mermaid
graph TD
    PERE["♂ Père commun"]
    M1["♀ Mère 1"]
    M2["♀ Mère 2"]
    PERE --- M1
    PERE --- M2
    M1 --> A["🟦 A"]
    M2 --> B["🟥 B"]

    A -.-|"BABA FO IZAYES\n+ ARMA / WEYMA"| B

    style PERE fill:#2980B9,color:#fff
    style M1 fill:#E91E63,color:#fff
    style M2 fill:#E91E63,color:#fff
    style A fill:#4A90D9,color:#fff
    style B fill:#E74C3C,color:#fff
```

#### Tableau — Demi-frères/sœurs (BABA FO IZAYES)

| Sexe A | Sexe B | Terme de lien | + Terme d'appel |
|--------|--------|---------------|-----------------|
| ♂ | ♂ | **BABA FO IZAYES** | + **ARMA** ↔ **ARMA** |
| ♂ | ♀ | **BABA FO IZAYES** | + **ARMA** ↔ **WAYMA** |
| ♀ | ♂ | **BABA FO IZAYES** | + **WAYMA** ↔ **ARMA** |
| ♀ | ♀ | **BABA FO IZAYES** | + **WEYMA** ↔ **WEYMA** |

> 💡 **Double terme** : On utilise **BABA FO IZAYES** pour décrire le lien
> (même père, mères différentes), **ET** les termes **ARMA / WEYMA** comme
> appellation entre eux — les deux termes coexistent.

---

## 6. 🟩 CAS 2 — Cousins de Même Niveau (niveau_A = niveau_B > 1)

> A et B sont à la **même distance** de l'ancêtre commun C,
> mais passent par des **branches différentes**.

### Schéma structurel

```mermaid
graph TD
    C["👤 C\nAncêtre commun\n(niveau 0)"]
    C -->|"branche A"| PA["PA\nEnfant de C\n(niveau 1)"]
    C -->|"branche B"| PB["PB\nEnfant de C\n(niveau 1)"]
    PA -->|"..."| A["🟦 A\n(niveau N)"]
    PB -->|"..."| B["🟥 B\n(niveau N)"]

    style C fill:#8B4513,color:#fff
    style PA fill:#F39C12,color:#fff
    style PB fill:#F39C12,color:#fff
    style A fill:#4A90D9,color:#fff
    style B fill:#E74C3C,color:#fff
```

> **PA** et **PB** sont les enfants directs de C sur chaque branche.
> Leur **sexe** détermine le type de cousinage.

### Arbre de décision

```mermaid
flowchart TD
    START{{"CAS 2: Cousins\nniveau_A = niveau_B > 1"}}
    START --> Q1{"Sexe de PA\net de PB ?"}

    Q1 -->|"PA ♂ et PB ♂\nDeux Hommes"| ARROU["🔵 ARROUHINKAYE IZAY\nCousins patrilatéraux parallèles\n(pères sont frères)"]
    Q1 -->|"PA ♀ et PB ♀\nDeux Femmes"| WAYOU["🟣 WAYUHINKAYE IZAY\nCousins matrilatéraux parallèles\n(mères sont sœurs)\n+ A et B s'appellent ARMA/WEYMA"]
    Q1 -->|"PA ♂ et PB ♀\nou PA ♀ et PB ♂\nMixte"| BAAS["🟡 BAASSEY\nCousins croisés\n(père de l'un, mère de l'autre)"]

    ARROU --> AGE_A{"PA plus âgé\nque PB ?"}
    AGE_A -->|"Oui"| R_BA1["PA = **BABA BERO** pour B\nPB = **BABA KATCHA** pour A"]
    AGE_A -->|"Non"| R_BA2["PA = **BABA KATCHA** pour B\nPB = **BABA BERO** pour A"]

    WAYOU --> AGE_W{"MA plus âgée\nque MB ?"}
    AGE_W -->|"Oui"| R_NI1["MA = **NIAN BERO** pour B\nMB = **NIAN KEYNA** pour A"]
    AGE_W -->|"Non"| R_NI2["MA = **NIAN KEYNA** pour B\nMB = **NIAN BERO** pour A"]

    BAAS --> SEX_AB{"Sexe de A et B ?"}
    SEX_AB -->|"A ♀ ou B ♀"| R_BW["La femme est **BAASSA WOYO**"]
    SEX_AB -->|"A ♂ et B ♂"| R_BR["Les deux sont **BAASSARO**"]

    style ARROU fill:#3498DB,color:#fff
    style WAYOU fill:#9B59B6,color:#fff
    style BAAS fill:#F1C40F,color:#000
```

### Tableau récapitulatif — Cousins

| Sexe PA | Sexe PB | Type de Cousinage | Terme | Signification |
|---------|---------|-------------------|-------|---------------|
| ♂ | ♂ | **ARROUHINKAYE IZAY** | Cousins parallèles patrilatéraux | "Enfants de deux hommes" |
| ♀ | ♀ | **WAYUHINKAYE IZAY** | Cousins parallèles matrilatéraux | "Enfants de deux femmes" + **ARMA/WEYMA** selon sexe |
| ♂ | ♀ | **BAASSEY** | Cousins croisés | Père de l'un = frère de la mère de l'autre |
| ♀ | ♂ | **BAASSEY** | Cousins croisés | Mère de l'un = sœur du père de l'autre |

### Sous-termes des cousins

| Condition | Terme pour A↔B | Explication |
|-----------|---------------|-------------|
| ARROUHINKAYE + PA plus âgé | PA = **BABA BERO** pour B | "Grand-père" (frère aîné du père) |
| ARROUHINKAYE + PA plus jeune | PA = **BABA KATCHA** pour B | "Petit père" (frère cadet du père) |
| WAYUHINKAYE + MA plus âgée | MA = **NIAN BERO** pour B | "Grande mère" (sœur aînée de la mère) |
| WAYUHINKAYE + MA plus jeune | MA = **NIAN KEYNA** pour B | "Petite mère" (sœur cadette de la mère) |
| WAYUHINKAYE + A est femme | A = **WEYMA** pour B | En plus du lien WAYUHINKAYE |
| WAYUHINKAYE + A est homme | A = **ARMA** pour B | En plus du lien WAYUHINKAYE |
| BAASSEY + personne femme | **BAASSA WOYO** | Cousine croisée (femme) |
| BAASSEY + personne homme | **BAASSARO** | Cousin croisé (homme) |

### Schéma détaillé : ARROUHINKAYE IZAY

```mermaid
graph TD
    C["👴 C\nGrand-père commun"]
    C --> PA["♂ PA\nFrère aîné\n= BABA BERO pour B"]
    C --> PB["♂ PB\nFrère cadet\n= BABA KATCHA pour A"]
    PA --> A["🟦 A"]
    PB --> B["🟥 B"]

    A -.-|"ARROUHINKAYE IZAY"| B

    style C fill:#8B4513,color:#fff
    style PA fill:#2980B9,color:#fff
    style PB fill:#2980B9,color:#fff
    style A fill:#4A90D9,color:#fff
    style B fill:#E74C3C,color:#fff
```

### Schéma détaillé : BAASSEY

```mermaid
graph TD
    C["👴 C\nGrand-père commun"]
    C --> PA["♂ PA\nFrère"]
    C --> MB["♀ MB\nSœur"]
    PA --> A["🟦 A"]
    MB --> B["🟥 B"]

    A -.-|"BAASSEY"| B

    style C fill:#8B4513,color:#fff
    style PA fill:#2980B9,color:#fff
    style MB fill:#E91E63,color:#fff
    style A fill:#4A90D9,color:#fff
    style B fill:#E74C3C,color:#fff
```

---

## 7. 🟧 CAS 3 — Générations Différentes (niveau_A ≠ niveau_B)

> A est **plus proche** de l'ancêtre commun que B.
> A est donc d'une **génération supérieure** à B.

On normalise : si niveau_A > niveau_B, on échange A et B
pour que **niveau_A ≤ niveau_B** toujours.

On note :
- **diff** = niveau_B − niveau_A (différence de générations)
- **NB** = le noeud sur la branche de B qui est **au même niveau** que A

### 7.1 Sous-cas : diff = 1 (Oncle / Tante ↔ Neveu / Nièce)

> A est au **même niveau** que le parent de B sur la branche commune.

#### Schéma structurel

```mermaid
graph TD
    C["👤 C\nAncêtre commun\n(niveau 0)"]
    C -->|"niveau 1"| A["🟦 A\n(même niveau que NB)"]
    C -->|"niveau 1"| NB["NB\nParent de B\n(frère/sœur de A)"]
    NB -->|"niveau 2"| B["🟥 B"]

    A -.-|"A et NB sont\nfrères/sœurs"| NB

    style C fill:#8B4513,color:#fff
    style A fill:#4A90D9,color:#fff
    style NB fill:#F39C12,color:#fff
    style B fill:#E74C3C,color:#fff
```

#### Arbre de décision (diff = 1)

```mermaid
flowchart TD
    START{{"CAS 3a: diff = 1\nOncle/Tante ↔ Neveu"}}
    START --> Q1{"Sexe de NB ?\n(parent de B,\nfrère/sœur de A)"}

    Q1 -->|"NB ♀ (Femme)"| Q2F{"Sexe de A ?"}
    Q1 -->|"NB ♂ (Homme)"| Q2H{"Sexe de A ?"}

    %% NB est Femme
    Q2F -->|"A ♀ (Femme)\nA et NB sont sœurs"| R1["A est **NIA** pour B\nB est **IZE** pour A"]
    Q2F -->|"A ♂ (Homme)\nA est frère de NB"| R2["A est **HASSA** pour B\nB est **TOUBA** pour A"]

    %% NB est Homme
    Q2H -->|"A ♂ (Homme)\nA et NB sont frères"| R3["A est **BABA** pour B\nB est **IZE** pour A"]
    Q2H -->|"A ♀ (Femme)\nA est sœur de NB"| R4["A est **HAWA** pour B\nB est **IZE** pour A\n✅ Confirmé"]

    %% Sous-détail NIA
    R1 --> AGE1{"NB plus âgée que A ?"}
    AGE1 -->|"Oui"| R1a["A = **NIA KEYNA**\n(petite mère)"]
    AGE1 -->|"Non"| R1b["A = **NIA BERO**\n(grande mère)"]

    %% Sous-détail BABA
    R3 --> AGE3{"NB plus âgé que A ?"}
    AGE3 -->|"Oui"| R3a["A = **BABA KATCHA**\n(petit père)"]
    AGE3 -->|"Non"| R3b["A = **BABA BERO**\n(grand père)"]

    style R1 fill:#E91E63,color:#fff
    style R2 fill:#00BCD4,color:#fff
    style R3 fill:#2196F3,color:#fff
    style R4 fill:#FF9800,color:#fff
```

#### Tableau récapitulatif — Oncle/Tante (diff = 1)

| Sexe A | Sexe NB | A est ... pour B | B est ... pour A | Contexte |
|--------|---------|------------------|------------------|----------|
| ♀ | ♀ | **NIA BERO** ou **NIA KEYNA** | **IZE** | Sœurs → A = mère pour B |
| ♂ | ♀ | **HASSA** | **TOUBA** | Frère de la mère de B |
| ♂ | ♂ | **BABA BERO** ou **BABA KATCHA** | **IZE** | Frères → A = père pour B |
| ♀ | ♂ | **HAWA** ✅ | **IZE** | Sœur du père de B |

> ⚠️ Le terme pour la **tante paternelle** (sœur du père) reste à **confirmer avec les anciens**.

#### Détail des termes BERO / KEYNA / KATCHA

La précision **BERO** (aîné) ou **KEYNA/KATCHA** (cadet) dépend de l'**âge de A par rapport à NB** :

| Condition | Suffixe | Signification |
|-----------|---------|---------------|
| A **plus âgé(e)** que NB | **BERO** | "Grand/Grande" (aîné) |
| A **plus jeune** que NB | **KEYNA** / **KATCHA** | "Petit/Petite" (cadet) |

### 7.2 Sous-cas : diff ≥ 2 (Grand-parent ↔ Petit-enfant)

> A est à au moins **2 générations au-dessus** de B.
> Le terme Songhoy utilise **KAAGA** (♂) ou **KAAGA WOY** (♀) avec un suffixe selon le niveau.

#### Terminologie KAAGA par niveau

| Niveau | diff | Homme (♂) | Femme (♀) | Équivalent français |
|:------:|:----:|:----------|:----------|:--------------------|
| 1 | 2 | **KAAGA** | **KAAGA WOY** | Grand-père / Grand-mère |
| 2 | 3 | **KAAGA BERI DJINA** | **KAAGA WOY BERI DJINA** | Arrière-grand-père/mère |
| 3 | 4 | **KAAGA BERI HINKATO** | **KAAGA WOY BERI HINKATO** | 3ème niveau d'ancêtre |
| 4 | 5 | **KAAGA BERI HINZANTO** | **KAAGA WOY BERI HINZANTO** | 4ème niveau d'ancêtre |
| 5 | 6 | **KAAGA BERI TAATCHANTO** | **KAAGA WOY BERI TAATCHANTO** | 5ème niveau d'ancêtre |
| 6 | 7 | **KAAGA BERI GOUWANTO** | **KAAGA WOY BERI GOUWANTO** | 6ème niveau d'ancêtre |
| ≥7 | ≥8 | **KAAGA BERI** + N | **KAAGA WOY BERI** + N | Au-delà (N = numéro) |

> Le terme réciproque est toujours **HAAMA** (petit-enfant / descendant).

#### Schéma structurel — Niveaux de KAAGA

```mermaid
graph TD
    C["👤 C\nAncêtre commun\n(niveau 0)"]
    C -->|"niveau 1"| A["🟦 A"]
    C -->|"niveau 1"| X["X\n(frère/sœur de A)"]
    X -->|"diff=1"| N1["Oncle/Tante"]
    N1 -->|"diff=2"| N2["KAAGA\nKAAGA WOY"]
    N2 -->|"diff=3"| N3["KAAGA BERI DJINA\nKAAGA WOY BERI DJINA"]
    N3 -->|"diff=4"| N4["KAAGA BERI HINKATO\nKAAGA WOY BERI HINKATO"]
    N4 -->|"diff=5"| N5["KAAGA BERI HINZANTO\nKAAGA WOY BERI HINZANTO"]
    N5 -->|"diff=6"| N6["KAAGA BERI TAATCHANTO\nKAAGA WOY BERI TAATCHANTO"]
    N6 -->|"diff=7"| N7["KAAGA BERI GOUWANTO\nKAAGA WOY BERI GOUWANTO"]

    style C fill:#8B4513,color:#fff
    style A fill:#4A90D9,color:#fff
    style X fill:#95A5A6,color:#fff
    style N1 fill:#F39C12,color:#fff
    style N2 fill:#E74C3C,color:#fff
    style N3 fill:#C0392B,color:#fff
    style N4 fill:#A93226,color:#fff
    style N5 fill:#922B21,color:#fff
    style N6 fill:#7B241C,color:#fff
    style N7 fill:#641E16,color:#fff
```

#### Arbre de décision (diff ≥ 2)

```mermaid
flowchart TD
    START{{"CAS 3b: diff ≥ 2\nGrand-parent ↔ Petit-enfant"}}
    START --> CALC["niveauKaaga = diff − 1"]
    CALC --> Q1{"Sexe de A ?"}

    Q1 -->|"♂ Homme"| LOOKUP_M["Chercher terme KAAGA\npour niveauKaaga"]
    Q1 -->|"♀ Femme"| LOOKUP_F["Chercher terme KAAGA WOY\npour niveauKaaga"]

    LOOKUP_M --> EX_M["1 → KAAGA\n2 → KAAGA BERI DJINA\n3 → KAAGA BERI HINKATO\n4 → KAAGA BERI HINZANTO\n5 → KAAGA BERI TAATCHANTO\n6 → KAAGA BERI GOUWANTO\n≥7 → KAAGA BERI + N"]

    LOOKUP_F --> EX_F["1 → KAAGA WOY\n2 → KAAGA WOY BERI DJINA\n3 → KAAGA WOY BERI HINKATO\n4 → KAAGA WOY BERI HINZANTO\n5 → KAAGA WOY BERI TAATCHANTO\n6 → KAAGA WOY BERI GOUWANTO\n≥7 → KAAGA WOY BERI + N"]

    EX_M --> RESULT["B est **HAAMA** pour A"]
    EX_F --> RESULT

    style EX_M fill:#2196F3,color:#fff
    style EX_F fill:#E91E63,color:#fff
    style RESULT fill:#4CAF50,color:#fff
```

#### Tableau récapitulatif — Grand-parent (diff ≥ 2)

| Sexe A | diff | Niveau | A est ... pour B | B est ... pour A |
|--------|------|--------|------------------|------------------|
| ♂ | 2 | 1 | **KAAGA** | **HAAMA** |
| ♂ | 3 | 2 | **KAAGA BERI DJINA** | **HAAMA** |
| ♂ | 4 | 3 | **KAAGA BERI HINKATO** | **HAAMA** |
| ♂ | 5 | 4 | **KAAGA BERI HINZANTO** | **HAAMA** |
| ♂ | 6 | 5 | **KAAGA BERI TAATCHANTO** | **HAAMA** |
| ♂ | 7 | 6 | **KAAGA BERI GOUWANTO** | **HAAMA** |
| ♂ | ≥8 | ≥7 | **KAAGA BERI** + N | **HAAMA** |
| ♀ | 2 | 1 | **KAAGA WOY** | **HAAMA** |
| ♀ | 3 | 2 | **KAAGA WOY BERI DJINA** | **HAAMA** |
| ♀ | 4 | 3 | **KAAGA WOY BERI HINKATO** | **HAAMA** |
| ♀ | 5 | 4 | **KAAGA WOY BERI HINZANTO** | **HAAMA** |
| ♀ | 6 | 5 | **KAAGA WOY BERI TAATCHANTO** | **HAAMA** |
| ♀ | 7 | 6 | **KAAGA WOY BERI GOUWANTO** | **HAAMA** |
| ♀ | ≥8 | ≥7 | **KAAGA WOY BERI** + N | **HAAMA** |

> **KAAGA** = grand-père / ancêtre
> **KAAGA WOY** = grand-mère / ancêtre femme
> **BERI** = grand / supérieur
> **DJINA** = premier (niveau 2)
> **HINKATO** = deuxième (niveau 3)
> **HINZANTO** = troisième (niveau 4)
> **TAATCHANTO** = quatrième (niveau 5)
> **GOUWANTO** = cinquième (niveau 6)
> **HAAMA** = petit-enfant / descendant

---

## 8. Schéma de Décision Global

```mermaid
flowchart TD
    INPUT(["Entrée:\nPersonne A, Personne B"])
    INPUT --> FIND["Trouver ancêtres communs"]
    FIND --> FOREACH["Pour chaque ancêtre C"]
    FOREACH --> CALC["Calculer niveau_A, niveau_B"]
    CALC --> NORM{"niveau_A > niveau_B ?"}
    NORM -->|"Oui"| SWAP["Échanger A ↔ B\npour que niveau_A ≤ niveau_B"]
    NORM -->|"Non"| CHECK
    SWAP --> CHECK

    CHECK{"niveau_A = niveau_B ?"}

    %% MÊME NIVEAU
    CHECK -->|"Oui"| SAME{"niveau = 1 ?"}
    SAME -->|"Oui"| SIBLINGS["🟦 CAS 1: FRÈRES/SŒURS"]
    SAME -->|"Non"| COUSINS["🟩 CAS 2: COUSINS"]

    SIBLINGS --> SIB_SEX{"Sexe A + B ?"}
    SIB_SEX -->|"♂♂"| S1["ARMA ↔ ARMA"]
    SIB_SEX -->|"♂♀"| S2["ARMA ↔ WAYMA"]
    SIB_SEX -->|"♀♂"| S3["WAYMA ↔ ARMA"]
    SIB_SEX -->|"♀♀"| S4["WEYMA ↔ WEYMA"]

    COUSINS --> BRANCH{"Sexe PA + PB ?"}
    BRANCH -->|"♂♂"| C1["ARROUHINKAYE IZAY"]
    BRANCH -->|"♀♀"| C2["WAYUHINKAYE IZAY"]
    BRANCH -->|"♂♀ ou ♀♂"| C3["BAASSEY"]

    %% NIVEAU DIFFÉRENT
    CHECK -->|"Non"| DIFF["diff = niveau_B − niveau_A"]
    DIFF --> DIFF_CHECK{"diff = 1 ?"}

    DIFF_CHECK -->|"Oui"| UNCLE["🟧 CAS 3a: ONCLE/TANTE"]
    DIFF_CHECK -->|"Non (≥2)"| GRAND["🟧 CAS 3b: GRAND-PARENT"]

    UNCLE --> U_SEX{"Sexe A + NB ?"}
    U_SEX -->|"♀♀"| U1["NIA ↔ IZE"]
    U_SEX -->|"♂♀"| U2["HASSA ↔ TOUBA"]
    U_SEX -->|"♂♂"| U3["BABA ↔ IZE"]
    U_SEX -->|"♀♂"| U4["HAWA ↔ IZE"]

    GRAND --> G_SEX{"Sexe de A ?"}
    G_SEX -->|"♂"| G1["KAAGA / KAAGA BERI ... ↔ HAAMA"]
    G_SEX -->|"♀"| G2["KAAGA WOY / KAAGA WOY BERI ... ↔ HAAMA"]

    style SIBLINGS fill:#4A90D9,color:#fff
    style COUSINS fill:#27AE60,color:#fff
    style UNCLE fill:#E67E22,color:#fff
    style GRAND fill:#E67E22,color:#fff
```

---

## 9. Pseudocode Complet

```
╔══════════════════════════════════════════════════════════════════╗
║  ALGORITHME: DéterminerRelationSonghoy(A, B)                    ║
╚══════════════════════════════════════════════════════════════════╝

FONCTION DéterminerRelationSonghoy(A, B):

    // ─── ÉTAPE 1: Trouver les ancêtres communs ───
    ancêtres_A ← TousLesAncêtres(A)
    ancêtres_B ← TousLesAncêtres(B)
    ancêtres_communs ← ancêtres_A ∩ ancêtres_B

    SI ancêtres_communs EST VIDE:
        Retourner "Aucune relation trouvée"

    relations ← []

    // ─── ÉTAPE 2: Pour chaque ancêtre commun ───
    POUR CHAQUE C DANS ancêtres_communs:

        niveau_A ← DistanceDans Arbre(C, A)
        niveau_B ← DistanceDansArbre(C, B)
        PA ← EnfantDirectDe(C, versA)   // enfant de C sur branche A
        PB ← EnfantDirectDe(C, versB)   // enfant de C sur branche B

        // Normaliser: A est toujours le plus proche de C
        SI niveau_A > niveau_B:
            Échanger(A, B)
            Échanger(niveau_A, niveau_B)
            Échanger(PA, PB)

        diff ← niveau_B − niveau_A

        // ═══════════════════════════════════════════════
        // CAS 1: FRÈRES ET SŒURS (même parent)
        // ═══════════════════════════════════════════════
        SI niveau_A = 1 ET niveau_B = 1:

            // Vérifier si demi-frères/sœurs (même père, mères différentes)
            SI père(A) = père(B) ET mère(A) ≠ mère(B):
                demi ← "BABA FO IZAYES"
            SINON:
                demi ← ""

            SI sexe(A) = ♂ ET sexe(B) = ♂:
                Ajouter(relations, demi + " A=ARMA pour B, B=ARMA pour A")
            SINON SI sexe(A) = ♂ ET sexe(B) = ♀:
                Ajouter(relations, demi + " A=ARMA pour B, B=WAYMA pour A")
            SINON SI sexe(A) = ♀ ET sexe(B) = ♂:
                Ajouter(relations, demi + " A=WAYMA pour B, B=ARMA pour A")
            SINON:  // ♀ et ♀
                Ajouter(relations, demi + " A=WEYMA pour B, B=WEYMA pour A")

        // ═══════════════════════════════════════════════
        // CAS 2: COUSINS (même niveau > 1)
        // ═══════════════════════════════════════════════
        SINON SI niveau_A = niveau_B:
            SI sexe(PA) = ♂ ET sexe(PB) = ♂:
                // ── ARROUHINKAYE IZAY ──
                type ← "ARROUHINKAYE IZAY"
                SI âge(PA) > âge(PB):
                    Ajouter(relations,
                        type + ": PA=BABA BERO pour B, PB=BABA KATCHA pour A")
                SINON:
                    Ajouter(relations,
                        type + ": PA=BABA KATCHA pour B, PB=BABA BERO pour A")

            SINON SI sexe(PA) = ♀ ET sexe(PB) = ♀:
                // ── WAYUHINKAYE IZAY ──
                type ← "WAYUHINKAYE IZAY"
                SI âge(PA) > âge(PB):
                    Ajouter(relations,
                        type + ": MA=NIAN BERO pour B, MB=NIAN KEYNA pour A")
                SINON:
                    Ajouter(relations,
                        type + ": MA=NIAN KEYNA pour B, MB=NIAN BERO pour A")
                // En plus, A et B s'appellent ARMA ou WEYMA selon le sexe
                SI sexe(A) = ♀:
                    Ajouter(relations, "A=WEYMA pour B")
                SINON:
                    Ajouter(relations, "A=ARMA pour B")
                SI sexe(B) = ♀:
                    Ajouter(relations, "B=WEYMA pour A")
                SINON:
                    Ajouter(relations, "B=ARMA pour A")

            SINON:
                // ── BAASSEY (cousins croisés) ──
                SI sexe(A) = ♀:
                    Ajouter(relations, "A=BAASSA WOYO")
                SINON:
                    Ajouter(relations, "A=BAASSARO")
                SI sexe(B) = ♀:
                    Ajouter(relations, "B=BAASSA WOYO")
                SINON:
                    Ajouter(relations, "B=BAASSARO")

        // ═══════════════════════════════════════════════
        // CAS 3: GÉNÉRATIONS DIFFÉRENTES
        // ═══════════════════════════════════════════════
        SINON:
            NB ← NoeudSurBranche(C, B, auNiveau=niveau_A)

            // ── CAS 3a: diff = 1 (Oncle/Tante) ──
            SI diff = 1:

                SI sexe(A) = ♀ ET sexe(NB) = ♀:
                    // A et NB sont sœurs → A = mère pour B
                    SI âge(NB) > âge(A):
                        Ajouter(relations, "A=NIA KEYNA pour B, B=IZE pour A")
                    SINON:
                        Ajouter(relations, "A=NIA BERO pour B, B=IZE pour A")

                SINON SI sexe(A) = ♂ ET sexe(NB) = ♀:
                    // A = frère de la mère de B
                    Ajouter(relations, "A=HASSA pour B, B=TOUBA pour A")

                SINON SI sexe(A) = ♂ ET sexe(NB) = ♂:
                    // A et NB sont frères → A = père pour B
                    SI âge(NB) > âge(A):
                        Ajouter(relations, "A=BABA KATCHA pour B, B=IZE pour A")
                    SINON:
                        Ajouter(relations, "A=BABA BERO pour B, B=IZE pour A")

                SINON:  // A ♀, NB ♂
                    // A = sœur du père de B (tante paternelle)
                    Ajouter(relations, "A=HAWA pour B, B=IZE pour A")

            // ── CAS 3b: diff ≥ 2 (Grand-parent avec niveaux KAAGA) ──
            SINON:
                niveauKaaga ← diff − 1
                termeKaaga ← ChercherTermeKaaga(sexe(A), niveauKaaga)
                // Lookup dans table de référence :
                //   Niveau 1 → KAAGA / KAAGA WOY
                //   Niveau 2 → KAAGA BERI DJINA / KAAGA WOY BERI DJINA
                //   Niveau 3 → KAAGA BERI HINKATO / KAAGA WOY BERI HINKATO
                //   Niveau 4 → KAAGA BERI HINZANTO / KAAGA WOY BERI HINZANTO
                //   Niveau 5 → KAAGA BERI TAATCHANTO / KAAGA WOY BERI TAATCHANTO
                //   Niveau 6 → KAAGA BERI GOUWANTO / KAAGA WOY BERI GOUWANTO
                //   Niveau ≥7 → KAAGA BERI + N / KAAGA WOY BERI + N
                Ajouter(relations,
                    "A=" + termeKaaga + " pour B, B=HAAMA pour A")

    Retourner relations
```

---

## 10. Dictionnaire Complet des Termes

### Termes de fratrie

| Terme Songhoy | Signification | Qui l'utilise ? |
|:--------------|:-------------|:----------------|
| **ARMA** | Frère | Utilisé par homme ou femme |
| **WAYMA** | Sœur | Utilisé par un homme envers sa sœur |
| **WEYMA** | Sœur | Utilisé entre femmes (sœurs) |
| **BABA FO IZAYES** | Demi-frères/sœurs (même père) | Même père, mères différentes |

> 💡 **BABA FO IZAYES** : Ce terme décrit le **lien** (même père, mères différentes).
> Les personnes s'appellent aussi **ARMA / WEYMA** entre elles — les deux termes coexistent.

### Termes de cousinage

| Terme Songhoy | Signification | Condition |
|:--------------|:-------------|:----------|
| **ARROUHINKAYE IZAY** | Cousins parallèles patrilatéraux | Pères sont frères |
| **WAYUHINKAYE IZAY** | Cousins parallèles matrilatéraux | Mères sont sœurs + s'appellent **ARMA/WEYMA** |
| **BAASSEY** | Cousins croisés | Un père et une mère sont frère/sœur |
| **BAASSARO** | Cousin croisé (homme) | Homme en relation BAASSEY |
| **BAASSA WOYO** | Cousine croisée (femme) | Femme en relation BAASSEY |

### Termes d'oncle / tante

| Terme Songhoy | Signification | Condition |
|:--------------|:-------------|:----------|
| **BABA BERO** | Grand-père / Oncle paternel aîné | Frère aîné du père |
| **BABA KATCHA** | Petit père / Oncle paternel cadet | Frère cadet du père |
| **NIAN BERO** | Grande mère / Tante maternelle aînée | Sœur aînée de la mère |
| **NIAN KEYNA** | Petite mère / Tante maternelle cadette | Sœur cadette de la mère |
| **HASSA** | Oncle maternel | Frère de la mère |
| **HAWA** | Tante paternelle ✅ | Sœur du père |

### Termes de neveu / nièce

| Terme Songhoy | Signification | Condition |
|:--------------|:-------------|:----------|
| **IZE** | Enfant / Neveu / Nièce | Terme générique (fils/fille du frère/sœur) |
| **TOUBA** | Neveu / Nièce (du HASSA) | Enfant de la sœur (pour un homme) |

### Termes de grand-parent / petit-enfant

| Terme Songhoy | Signification | Condition |
|:--------------|:-------------|:----------|
| **KAAGA** | Grand-père (niveau 1) | Homme, diff = 2 |
| **KAAGA WOY** | Grand-mère (niveau 1) | Femme, diff = 2 |
| **KAAGA BERI DJINA** | Ancêtre homme niveau 2 | Homme, diff = 3 |
| **KAAGA WOY BERI DJINA** | Ancêtre femme niveau 2 | Femme, diff = 3 |
| **KAAGA BERI HINKATO** | Ancêtre homme niveau 3 | Homme, diff = 4 |
| **KAAGA WOY BERI HINKATO** | Ancêtre femme niveau 3 | Femme, diff = 4 |
| **KAAGA BERI HINZANTO** | Ancêtre homme niveau 4 | Homme, diff = 5 |
| **KAAGA WOY BERI HINZANTO** | Ancêtre femme niveau 4 | Femme, diff = 5 |
| **KAAGA BERI TAATCHANTO** | Ancêtre homme niveau 5 | Homme, diff = 6 |
| **KAAGA WOY BERI TAATCHANTO** | Ancêtre femme niveau 5 | Femme, diff = 6 |
| **KAAGA BERI GOUWANTO** | Ancêtre homme niveau 6 | Homme, diff = 7 |
| **KAAGA WOY BERI GOUWANTO** | Ancêtre femme niveau 6 | Femme, diff = 7 |
| **KAAGA BERI** + N | Ancêtre homme niveau ≥7 | Homme, diff ≥ 8 |
| **KAAGA WOY BERI** + N | Ancêtre femme niveau ≥7 | Femme, diff ≥ 8 |
| **HAAMA** | Petit-enfant / Descendant | Quel que soit le niveau |

> 💡 **BERI** = grand/supérieur. Les suffixes comptent les niveaux au-delà du premier KAAGA :
> DJINA (1er), HINKATO (2ème), HINZANTO (3ème), TAATCHANTO (4ème), GOUWANTO (5ème).

---

## 11. Exemples Concrets

### Exemple 1 : Cousins ARROUHINKAYE

```mermaid
graph TD
    ALY["👴 Aly Koïra\nAncêtre commun"]
    ALY --> MOUSSA["♂ Moussa\n(fils aîné - 60 ans)"]
    ALY --> IBRAHIM["♂ Ibrahim\n(fils cadet - 55 ans)"]
    MOUSSA --> AMADOU["🟦 Amadou (A)"]
    IBRAHIM --> FATIMATA["🟥 Fatimata (B)"]

    style ALY fill:#8B4513,color:#fff
    style MOUSSA fill:#2980B9,color:#fff
    style IBRAHIM fill:#2980B9,color:#fff
    style AMADOU fill:#4A90D9,color:#fff
    style FATIMATA fill:#E74C3C,color:#fff
```

**Analyse :**
- Ancêtre commun : **Aly Koïra**
- niveau_A = 2, niveau_B = 2 → **Même niveau** → CAS 2
- PA = Moussa (♂), PB = Ibrahim (♂) → **Deux hommes**
- → **ARROUHINKAYE IZAY**
- Moussa (60 ans) > Ibrahim (55 ans)
- → Moussa = **BABA BERO** pour Fatimata
- → Ibrahim = **BABA KATCHA** pour Amadou

### Exemple 2 : Relation HASSA / TOUBA

```mermaid
graph TD
    ALY["👴 Aly Koïra\nAncêtre commun"]
    ALY --> OMAR["♂ Omar\nniveau 1"]
    ALY --> AISSATA["♀ Aissata\nniveau 1"]
    AISSATA --> SEYDOU["🟥 Seydou (B)\nniveau 2"]

    OMAR -.-|"frère/sœur"| AISSATA

    style ALY fill:#8B4513,color:#fff
    style OMAR fill:#2980B9,color:#fff
    style AISSATA fill:#E91E63,color:#fff
    style SEYDOU fill:#E74C3C,color:#fff
```

**Analyse :**
- A = **Omar**, B = **Seydou**
- Ancêtre commun : **Aly Koïra**
- niveau_A = 1, niveau_B = 2 → **CAS 3** (diff = 1)
- NB = Aissata (♀), A = Omar (♂)
- → sexe(A) = ♂, sexe(NB) = ♀
- → Omar est **HASSA** pour Seydou
- → Seydou est **TOUBA** pour Omar

### Exemple 3 : Sœurs (WEYMA)

```mermaid
graph TD
    PARENT["👤 Parent commun"]
    PARENT --> MARIAMA["🟦 Mariama (A)\n♀"]
    PARENT --> KADIATOU["🟥 Kadiatou (B)\n♀"]

    MARIAMA -.-|"WEYMA"| KADIATOU

    style PARENT fill:#8B4513,color:#fff
    style MARIAMA fill:#E91E63,color:#fff
    style KADIATOU fill:#E91E63,color:#fff
```

**Analyse :**
- niveau_A = 1, niveau_B = 1 → **CAS 1** (frères/sœurs)
- sexe(A) = ♀, sexe(B) = ♀
- → Mariama est **WEYMA** pour Kadiatou
- → Kadiatou est **WEYMA** pour Mariama

---

## 12. Points à Confirmer avec les Anciens 🔍

| # | Question | Terme | Statut |
|---|----------|-------|--------|
| 1 | Sœur du père (tante paternelle) → quel terme exact ? | **HAWA** | ✅ Confirmé |
| 2 | Si A ♀ et NB ♂ (diff=1), B appelle A comment ? | **IZE** | ✅ Confirmé |
| 3 | Cousin dont les mères sont sœurs, terme local à Gao ? | **WAYUHINKAYE IZAY** + ARMA/WEYMA | ✅ Confirmé |
| 4 | Pour diff ≥ 3 (arrière-grand-parent), même terme KAAGA ? | **KAAGA BERI** + suffixes par niveau | ✅ Confirmé |
| 5 | Frère/sœur de même père mais mère différente ? | **BABA FO IZAYES** + ARMA/WEYMA | ✅ Confirmé |
| 6 | Termes pour les relations par alliance (beau-frère, etc.) | — | ⚠️ À ajouter |

---

## 13. Résumé Visuel — Carte des Relations

```
                        ┌─────────────────────────────────┐
                        │     ANCÊTRE COMMUN (C)          │
                        └──────────┬──────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
              │   PA (♂)  │ │   PA (♀)  │ │ PA♂/PB♀   │
              │   PB (♂)  │ │   PB (♀)  │ │ ou inverse │
              └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
                    │              │              │
                    ▼              ▼              ▼
             ARROUHINKAYE    WAYUHINKAYE      BAASSEY
                IZAY            IZAY          ┌────┴────┐
             (Pères sont     (Mères sont      │         │
              frères)        sœurs)        BAASSARO  BAASSA
                           + ARMA/WEYMA     (♂)     WOYO (♀)

   ═══════════════════════════════════════════════════════

     RELATIONS VERTICALES (générations différentes)
     ──────────────────────────────────────────────

     diff=1     ♂+♂ → BABA (BERO/KATCHA) ↔ IZE
                ♀+♀ → NIA (BERO/KEYNA)   ↔ IZE
                ♂+♀ → HASSA              ↔ TOUBA
                ♀+♂ → HAWA               ↔ IZE

     diff=2     ♂ → KAAGA              ♀ → KAAGA WOY              ↔ HAAMA
     diff=3     ♂ → KAAGA BERI DJINA   ♀ → KAAGA WOY BERI DJINA   ↔ HAAMA
     diff=4     ♂ → KAAGA BERI HINKATO ♀ → KAAGA WOY BERI HINKATO ↔ HAAMA
     diff=5     ♂ → KAAGA BERI HINZANTO   ...WOY BERI HINZANTO    ↔ HAAMA
     diff=6     ♂ → KAAGA BERI TAATCHANTO ...WOY BERI TAATCHANTO   ↔ HAAMA
     diff=7     ♂ → KAAGA BERI GOUWANTO   ...WOY BERI GOUWANTO    ↔ HAAMA
     diff≥8     ♂ → KAAGA BERI + N        ...WOY BERI + N         ↔ HAAMA

   ═══════════════════════════════════════════════════════

     FRATRIE (même parent direct)
     ────────────────────────────

                ♂↔♂  → ARMA    ↔ ARMA
                ♂↔♀  → ARMA    ↔ WAYMA
                ♀↔♀  → WEYMA   ↔ WEYMA

     DEMI-FRATRIE (même père, mères différentes)
     ────────────────────────────────────────────

                BABA FO IZAYES + ARMA / WEYMA
```

---

*Document créé pour l'application généalogique de la famille Aly Koïra*
*Gao, Mali — Février 2025*

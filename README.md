# 🌳 Généalogie Famille Aly Koïra

Application web de gestion d'arbre généalogique pour la famille Aly Koïra.

## 📁 Structure du projet

```
genealogie-app/
├── index.html          # Page principale
├── css/
│   └── styles.css      # Styles de l'application
├── js/
│   └── app.js          # Logique JavaScript
├── data/
│   └── members.js      # Données des membres de la famille
└── README.md           # Ce fichier
```

## 🚀 Utilisation

1. Ouvrir `index.html` dans un navigateur
2. Entrer le mot de passe familial
3. Naviguer dans l'arbre

## 📊 Structure des données

Les données sont stockées dans `data/members.js`. Chaque membre a la structure suivante:

```javascript
"id_unique": {
  id: "id_unique",           // Identifiant unique (sans espaces, en minuscules)
  n: "Nom Complet",          // Nom complet de la personne
  a: "Surnom",               // Alias/Surnom (null si aucun)
  g: "M",                    // Genre: "M" (Homme) ou "F" (Femme)
  gen: 3,                    // Numéro de génération (0-7)
  f: "id_pere",              // ID du père (null si inconnu)
  m: "id_ou_nom_mere",       // ID ou nom de la mère
  sp: ["Épouse 1", "Épouse 2"], // Liste des époux/épouses
  c: ["id_enfant1", "id_enfant2"] // Liste des IDs des enfants
}
```

## ➕ Ajouter une nouvelle personne

### 1. Ouvrir `data/members.js`

### 2. Trouver la bonne section (par branche familiale)

### 3. Ajouter l'entrée avec la syntaxe:

```javascript
"nouvel_id":{id:"nouvel_id",n:"Prénom Nom",a:null,g:"M",gen:5,f:"id_pere",m:"nom_mere",c:[]},
```

### 4. Mettre à jour le parent

Ajouter l'ID du nouvel enfant dans le tableau `c` du parent:

```javascript
// Avant
"pere":{...,c:["enfant1","enfant2"]},

// Après
"pere":{...,c:["enfant1","enfant2","nouvel_id"]},
```

## 📝 Conventions de nommage des IDs

| Type | Format | Exemple |
|------|--------|---------|
| Simple | `prenom` | `moussa` |
| Avec branche | `prenom_branche` | `moussa_hz` (Moussa fils de Houzaye) |
| Homonymes | `prenom_suffixe` | `ibrahim_m`, `ibrahim_ha` |

## 🎨 Générations et couleurs

| Génération | Couleur | Description |
|------------|---------|-------------|
| G0 | Violet | Ancêtres (Hamatou Lassane) |
| G1 | Orange | 1ère génération (Alkamahamane) |
| G2 | Vert | 2ème génération (Ali, etc.) |
| G3 | Indigo | 3ème génération |
| G4 | Rose | 4ème génération |
| G5 | Violet clair | 5ème génération |
| G6 | Turquoise | 6ème génération |
| G7 | Orange foncé | 7ème génération |

## 🔐 Authentification

Le mot de passe est hashé en SHA-256. Pour le modifier, changer le hash dans `js/app.js`:

```javascript
const VALID_HASH = 'nouveau_hash_sha256';
```

## 📱 Fonctionnalités

- ✅ Navigation dans l'arbre
- ✅ Recherche par nom
- ✅ Calcul de parenté
- ✅ Affichage des surnoms
- ✅ Responsive mobile
- ✅ Mode sombre
- ✅ Formulaire de contribution

## 📈 Statistiques actuelles

- **343 membres**
- **8 générations** (G0 à G7)
- **211 hommes**
- **132 femmes**

## 🛠️ Maintenance

### Ajouter une branche complète

1. Créer les entrées dans `data/members.js`
2. Respecter les liens père/mère/enfants
3. Vérifier les IDs uniques
4. Tester dans le navigateur

### Corriger une erreur

1. Trouver l'entrée par son ID
2. Modifier les champs concernés
3. Vérifier les références (père, mère, enfants)

## 📞 Contact

Pour toute question ou contribution, utiliser le formulaire "Contribuer" dans l'application.

---

*Dernière mise à jour: Janvier 2026*

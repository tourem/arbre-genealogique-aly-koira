# "Relation à moi" — Ego de l'utilisateur dans l'arbre

**Statut :** Backlog · concept validé
**Date :** 2026-04-23
**Priorité :** Haute (effet waouh fort, effort modéré en phase 1)

---

## Intention

Quand un utilisateur ouvre une fiche (par exemple *Ibrahim Alassane*) ou consulte l'arbre, il veut instantanément savoir *"et moi, je suis qui par rapport à cette personne ?"*. Aujourd'hui l'app répond à *"qui est X pour Y ?"* (page Parenté avec deux personnes explicites) ; elle ne répond pas à *"qui est X pour moi ?"* sans que l'utilisateur ne configure manuellement le A de la paire à chaque fois.

La feature ajoute un **ego** — une identité déclarée par l'utilisateur — et affiche partout la relation à cet ego en contexte.

## Valeur utilisateur

- **Personnalisation instantanée** — chaque fiche prend sens *"votre grand-oncle touba"*, *"votre cousin au 3e degré par voie maternelle"*.
- **Point de repère unique** — l'utilisateur n'a plus besoin de mémoriser sa position dans l'arbre, l'app la rend explicite à chaque vue.
- **Entrée dans l'app** — aide les nouveaux utilisateurs à se situer dans un clan qu'ils découvrent.
- **Partage** — *"Regarde, Cora est ma cousine au 3e degré côté mère"* devient une phrase naturelle dans l'app, pas un calcul.

## Approche en deux phases

### Phase 1 — Ego local (sans authentification)

Livrer **immédiatement** la feature d'affichage, sans toucher à l'authentification ni au backend. L'ego est une simple préférence utilisateur stockée dans `localStorage`.

**Principe :** l'utilisateur ouvre l'app, un sélecteur *"Vu par"* en haut permet de choisir n'importe quelle personne de l'arbre. Toutes les vues affichent alors la relation à cet ego. Pas de compte requis, pas de vérification.

**Rationale :** en phase 1 on ne protège pas contre la triche (*"je me déclare Idrissa le patriarche"*) parce que ça ne déverrouille rien d'autre que de l'affichage. C'est une préférence comme le thème dark/light.

### Phase 2 — Ego authentifié (plus tard)

Quand on voudra autoriser des droits d'édition par les utilisateurs (*"je peux éditer ma propre fiche"*, *"je peux ajouter un enfant dans mon foyer"*), on introduit un **binding** entre le compte `users` et un `member_id`.

**Mécanisme recommandé : invitations liées à un membre.** L'admin, depuis une fiche, génère un lien d'invitation signé. Le destinataire ouvre le lien, crée son compte, et le binding est automatique. Pas d'ambiguïté, pas de claim à valider.

Une fois ce binding établi, le sélecteur *"Vu par"* de la phase 1 est **pré-rempli** pour les utilisateurs authentifiés, modifiable pour les autres (admins qui regardent depuis un autre point de vue, famille étendue pas encore invitée).

## Phase 1 — Spécifications

### UI

**Sélecteur *"Vu par"*** — petit composant dans la barre d'en-tête globale (à côté du toggle theme et du menu profil).

- Affichage : avatar + prénom de l'ego actuel, ou *"Choisir qui vous êtes"* si vide.
- Clic : ouvre un dropdown avec recherche (pattern identique à `PersonPicker`).
- Sélection : stocke l'ID dans `localStorage.viewAs`.
- Bouton *"Effacer"* pour repasser en mode sans ego.

**Badge de relation sur chaque fiche** — quand un ego est défini et différent de la personne affichée, badge affiché en haut de la fiche :

```
◆ Votre grand-oncle touba (2e génération au-dessus, côté maternel)
```

Le badge est cliquable → ouvre la page Parenté pré-remplie (ego = A, personne affichée = B).

**Badge de relation dans les cards secondaires** — dans les listes (foyers, descendance, résultats de recherche), un petit tag inline *"cousine"*, *"grand-père"* ajouté sous le nom quand pertinent. Version abrégée, pas le texte complet.

**Exception : quand la fiche affichée est l'ego lui-même** → bandeau *"C'est vous"* au lieu de calculer une relation.

### Logique

**Réutilise `computeRelations(egoId, personId, members, labels)`** (existe déjà dans `parenteSonghay`). Le résultat est un groupe de relations ; on prend le groupe primaire (`groups[0]`) pour l'affichage court.

**Pour les listes (performance)** — le calcul est trivial pour une paire (~1ms), mais rendre 50 enfants dans un foyer = 50 calculs. À évaluer : memoïzation par `egoId + personId` dans un cache React, ou calcul pré-fait au chargement si profiling le justifie.

### Stockage

```
localStorage
  viewAs.memberId     : string | null   (id de l'ego)
  viewAs.claimedAt    : number (epoch)  (pour affichage "depuis le X")
```

Reset au sign-out (quand la phase 2 arrive).

### Ego et permissions

**Phase 1 : aucune** — l'ego n'ouvre aucun droit. Même un utilisateur déclaré admin dans l'arbre (ex. Idrissa patriarche) ne peut rien éditer via ce choix. Les permissions restent liées au compte Supabase comme aujourd'hui.

C'est le découplage critique qui permet de livrer la feature sans risque.

## Phase 2 — Spécifications (esquisse)

### Schéma

```sql
ALTER TABLE users ADD COLUMN ego_member_id uuid
  REFERENCES members(id) ON DELETE SET NULL;

CREATE TABLE invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  token           text NOT NULL UNIQUE,
  created_by      uuid NOT NULL REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  used_at         timestamptz,
  used_by_user_id uuid REFERENCES users(id)
);
```

### Flow invitation

1. Admin ouvre une fiche et clique *"Inviter cette personne à rejoindre l'app"*.
2. Backend crée une `invitation` et retourne un lien signé `https://app/invite/<token>`.
3. Admin partage le lien (WhatsApp, SMS).
4. Destinataire ouvre le lien → redirigé vers signup → signup valide → `users.ego_member_id` est posé à `invitation.member_id`.
5. Invitation marquée `used_at` + `used_by_user_id`.

### Migration phase 1 → phase 2

À l'ouverture de l'app, si `users.ego_member_id` existe dans la DB et `localStorage.viewAs.memberId` est différent, on propose à l'utilisateur de synchroniser (*"Vous êtes lié à X dans l'arbre, l'utiliser comme point de vue ?"*). Sinon on préserve son choix local.

## Interactions avec les features existantes

- **Page Parenté** — un bouton *"Vu depuis moi"* dans le header pré-remplit `personA` avec l'ego, ne laissant qu'à choisir B.
- **Historique des recherches** — pour les entrées où l'ego était A, afficher *"Votre cousine Cora"* au lieu de *"Moi ↔ Cora"*.
- **Breadcrumb (proposé par ailleurs dans le backlog)** — commence toujours par l'ego *"Depuis vous → Ibrahim → Babachigaw"*.
- **Empty state Parenté** — quand l'ego est défini et que l'utilisateur arrive sans recherche, suggérer *"Découvrez votre relation avec..."* + 3 suggestions de membres proches dans l'arbre.

## Questions ouvertes

1. **Où placer le sélecteur ?** Header global à côté du theme toggle (toujours visible) ou menu profil (caché derrière 1 clic) ? Recommandation initiale : header global pour maximiser la découvrabilité.
2. **Faut-il persister le choix d'ego côté URL (`?viewAs=X`) ?** Utile pour le partage *"regarde cet arbre depuis mon point de vue"*, mais peut surprendre (je reçois un lien, j'ouvre, je vois l'arbre comme si j'étais quelqu'un d'autre). Plutôt : NON par défaut, oui via un bouton *"Partager cette vue"* explicite.
3. **Comment gérer les relations lointaines ou inexistantes ?** Si l'ego et la personne affichée n'ont aucun aïeul commun dans la DB → badge *"Aucune parenté connue"* avec lien vers *"Compléter l'arbre"* (admin).
4. **Par défaut, l'ego est-il vide ou pré-rempli ?** Vide (UX propre : l'utilisateur n'est pas enfermé dans un choix arbitraire). Un onboarding optionnel au premier lancement propose *"Qui êtes-vous ?"*.
5. **Faut-il stocker l'ego dans un cookie pour rendu SSR côté serveur ?** L'app est client-side (Vite + React) ; `localStorage` suffit.

## Critères de succès (phase 1)

- Sélecteur *"Vu par"* visible dans le header, ouvre une recherche de membre en < 100ms.
- Badge de relation sur chaque fiche quand ego défini (*"Votre X"*) avec terme songhay correct.
- Badge cliquable ouvre la page Parenté pré-remplie.
- Cas *"c'est vous"* géré (bandeau plutôt que calcul).
- Choix persisté à travers les sessions via `localStorage`.
- Aucun impact si ego non défini (feature désactivable à tout moment).
- Light + dark mode OK.
- Mobile : sélecteur qui tient dans la hauteur du header (< 40px).

## Critères de succès (phase 2)

- Admin peut générer une invitation depuis une fiche en 2 clics.
- Lien d'invitation valide 30 jours par défaut.
- Signup via lien pose automatiquement `ego_member_id`.
- Ancien sélecteur *"Vu par"* (phase 1) continue de fonctionner pour les utilisateurs non invités.
- Conflit `localStorage.viewAs` ≠ `users.ego_member_id` : dialogue explicite.

## Risques

- **Performance** sur les grandes listes si la relation est calculée par item à chaque render. Mesure attendue : avec ~50 enfants dans un foyer, un calcul par item doit rester < 50ms total. Si dépassement, introduire un cache mémoizé.
- **Ambiguïté du sens "Vu par"** — libellé à tester : certains utilisateurs peuvent le lire *"l'arbre est visible par ce membre"* (mode lecture partagé). Alternatives : *"Ma position"*, *"Je suis..."*, *"Point de vue"*, *"Vous êtes"*.
- **Affichage sur les très vieilles générations** — la relation à un ancêtre de G9 peut être incalculable ou tellement longue qu'elle devient illisible. Fallback : *"Votre ancêtre à la 9e génération"* sans terme songhay précis.

## Estimations

**Phase 1 :** 2-3 jours de dev (sélecteur, badge, intégration sur fiche + listes, tests). 1 jour de CSS/responsive/accessibilité. Total ~4 jours-homme.

**Phase 2 :** 3-4 jours de dev (migration DB, backend invitation, page d'acceptation, flow signup, tests sécurité). 1 jour de review sécurité (tokens signés, expiration). Total ~5 jours-homme.

## Prochaines étapes

1. Valider ce concept avec l'utilisateur final (test papier ou prototype Figma).
2. Décider du libellé du sélecteur (tester 2-3 variantes).
3. Passer en **brainstorming → spec → plan** sur la phase 1.
4. Reporter phase 2 en backlog avec dépendance explicite : *"bloquée par la feature d'édition utilisateur"*.

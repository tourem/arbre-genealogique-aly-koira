# Follow-ups

Liste ouverte des features et dettes identifiées pendant la refonte
v2, à traiter dans des commits/PR dédiés.

---

## Feature : réordonner les épouses via flèches ↑/↓

**Contexte** : le rang d'épouse (1ʳᵉ, 2ᵉ, 3ᵉ) est stocké dans
`members.spouses[].rank` côté mari uniquement. L'ordre d'affichage
dérive de ce tableau. Il n'y a pas aujourd'hui d'interface pour le
changer après saisie initiale — c'était demandé dans la revue du
pattern FAB/⋯ (option A), délibérément écarté pour limiter le scope.

**UX** : dans le menu contextuel ⋯ d'un foyer (admin uniquement),
ajouter deux entrées :
- « ↑ Remonter d'un rang »
- « ↓ Descendre d'un rang »

Grisées quand l'action n'est pas possible (déjà au sommet / au fond).

**Contraintes techniques** :
- Pas de drag-and-drop, pas de dépendance externe (react-dnd, etc.).
- Le rang vit côté mari (`husband.spouses[].rank`), pas côté épouse.
- Mutation atomique : RPC SQL côté serveur (analogue aux RPCs
  `detach_parent` / `dissolve_marriage` de la migration 015).
- Réordonner ne doit jamais casser la symétrie du mariage (on swap
  deux entrées d'un même array, les liens réciproques dans les
  fiches épouses ne changent pas).

**Description de RPC attendue** :
```sql
swap_spouse_rank(husband_id TEXT, a_spouse_id TEXT, b_spouse_id TEXT)
```
Échange le rang des deux épouses référencées dans `husband.spouses[]`.

**Tests** :
- Unitaires : swap symétrique, idempotent sur positions extrêmes
  (bloqué), préserve les autres entrées.
- Intégration (optionnel) : aller-retour via RPC en staging.

---

## Feature : modéliser fosterage et adoption songhay

Voir `NOTES_CULTURELLES.md` § 1. Demande une conversation culturelle
avant toute implémentation DB — ne pas hardcoder un modèle simpliste.

---

## Dette : job quotidien de purge des fiches archivées

La migration 015 ajoute `members.archived_at` et la RPC
`archive_member()` pour le soft delete (30 jours). Le **job quotidien
de purge** (`DELETE FROM members WHERE archived_at < now() - '30 days'`)
n'existe pas encore. Options :

- Supabase Scheduled Function (pg_cron) — préférer
- Edge Function déclenchée par CRON — possible
- Job manuel (SQL à lancer périodiquement) — par défaut pour l'instant

La RPC `restore_member()` permet d'annuler dans l'intervalle de 30
jours.

---

## UX : pré-remplir le foyer lors de l'ajout d'un enfant

Le FAB > « Ajouter un enfant » ouvre le `AddMemberModal` sans
pré-sélectionner le foyer choisi dans le sous-menu (le picker
interne du modal reprend la main). Cf. TODO dans `FamillePage.tsx`.
Faible priorité — c'est un confort, pas un bug.

---

*Dernière mise à jour : 2026-04-22.*

# Architecture

Vue technique de la plateforme : structure, patterns transverses, base de
données et décisions de conception.

## 1. Monorepo & pile technique

```
apps/api   NestJS 10 · TypeScript · Prisma 5 · PostgreSQL 16 + PostGIS
apps/web   Next.js (App Router) · React · Tailwind CSS · shadcn/ui · Recharts · Leaflet
```

L'API est un **monolithe modulaire** : un déploiement unique, mais un module
NestJS autonome par domaine fonctionnel (parcelles, cultures, activités,
équipements…). Cela donne la simplicité d'un monolithe avec des frontières
nettes, et laisse la porte ouverte à une extraction en services plus tard si
nécessaire.

## 2. Architecture backend (NestJS)

Chaque module suit une séparation stricte en couches :

```
Contrôleur   routes HTTP, validation (DTO), autorisation (décorateurs)
   │
Service(s)   logique métier, accès aux données via Prisma
   │
PrismaService  client Prisma unique (injectable, cycle de vie géré)
```

Un module type contient : `*.controller.ts`, un ou plusieurs `*.service.ts`,
un dossier `dto/`, un `*.module.ts`, et un seed de permissions dédié. Les
services volumineux sont scindés par responsabilité (ex. pour les activités :
CRUD, calendrier, commentaires, pièces jointes).

### PrismaService
Un seul client Prisma pour toute l'application (module `@Global`), avec
connexion/déconnexion alignées sur le cycle de vie NestJS — pas de fuite de
connexions PostgreSQL.

## 3. Isolation multi-tenant

Chaque entité métier porte un `fermeId`. La ferme de l'utilisateur est extraite
du token JWT et injectée dans **chaque** requête service (`@CurrentUser()` →
`fermeId`). Règles appliquées partout :

- Aucune écriture ni lecture par `id` seul : toute opération est d'abord
  contrôlée par un `assert…(fermeId, id)`.
- Les sous-ressources (entretiens, commentaires, pièces jointes) sont vérifiées
  en remontant à leur parent puis à la ferme.
- Le client ne peut jamais fournir un `fermeId` pour cibler d'autres données.

## 4. Authentification & autorisation (RBAC dynamique)

### Trois tokens JWT
Access (courte durée, autorise les requêtes), refresh (renouvelle sans
re-login), pré-auth (étape 2FA). Trois secrets distincts → rotation
indépendante.

### Deux guards globaux, dans l'ordre
```
1. JwtAuthGuard      valide le token, peuple request.user (sauf routes @Public)
2. PermissionsGuard  vérifie EN BASE les permissions requises par la route
```

Les permissions (`module.action`, ex. `activites.creer`) sont attribuées aux
rôles et **relues à chaque requête** : aucun rôle codé en dur, tout est
configurable. Huit rôles système, chaque permission granulaire.

## 5. Le pattern BFF (Backend for Frontend)

Le navigateur ne parle **jamais** directement à l'API NestJS.

```
Navigateur ──fetch /api/*──> Route handler Next.js ──Bearer──> API NestJS
   (cookies httpOnly)          (lit le cookie, l'injecte)      (/api/v1)
```

- Les tokens vivent dans des cookies `httpOnly` : inaccessibles au JavaScript
  (protection XSS).
- Les route handlers Next.js (`app/api/**`) relaient vers l'API en ajoutant
  l'`Authorization: Bearer` côté serveur.
- Deux utilitaires : `apiServerFetch` (JSON) et `apiServerRaw` (flux binaire
  brut, pour les fichiers/exports).

Bénéfice : l'API peut rester sur un réseau privé, et aucun secret ne transite
par le navigateur.

## 6. Patterns transverses

### Stockage de fichiers abstrait
Un helper unique `EntityFileStorage` (dans `src/common/files/`) centralise
validation, écriture disque, création de la ligne `Document` polymorphe, lecture
en flux et suppression. Les modules (parcelles, cultures, équipements,
activités) délèguent tous à ce helper. En production, seul l'intérieur du helper
passera à un stockage S3 (Module 13) — sans toucher aux modules.

### Alertes calculées, non stockées
Les alertes (maintenance à venir, stock bas, activité en retard…) sont
**calculées à la lecture** à partir de l'état des données, jamais persistées ni
désynchronisées. La table `AlerteStock` reste réservée aux notifications
acquittées du futur Module 16.

### Pagination mutualisée
Un composant de pagination générique côté front, un format de réponse unique
côté API (`donnees` + `pagination`).

### Seeds de permissions par module
Chaque module possède son seed de permissions, **idempotent** (réexécutable) et
autonome — un module s'installe sans toucher aux seeds des autres.

### Migrations additives
Les évolutions de schéma sont purement additives (colonnes nullables, nouvelles
tables) et documentées, pour ne jamais casser l'existant.

### Suppressions protégées
Quand une suppression détruirait un historique critique (ex. culture avec
récoltes), le service refuse (`409`) et propose une alternative (marquer
« abandonnée »).

### Gestion d'erreurs centralisée
Un **filtre d'exception Prisma global** (`common/filters/`) traduit les erreurs
de base connues en réponses HTTP propres (unicité → `409`, introuvable → `404`,
clé étrangère → `409`) et journalise le reste côté serveur. Aucune erreur
technique ne fuit vers le client en `500` avec des détails internes. Les
services peuvent toujours lever un message métier précis en amont ; le filtre
n'est que le filet de sécurité.

### Limitation de débit
Un `ThrottlerGuard` global (placé avant l'authentification) plafonne le débit par
IP (par défaut 100 req/min), protégeant notamment la connexion du brute-force.
Au-delà : `429`.

## 7. Base de données

PostgreSQL 16 + **PostGIS**, modélisée avec Prisma (~47 tables). Grandes
familles de relations :

```
Ferme ──< Utilisateur >── Role ──< RolePermission >── Permission
  │
  ├─< Parcelle ──< Culture ──< SuiviCulture / Recolte
  │       └─ géométrie PostGIS (limites, centroïde)
  ├─< CalendrierActivite ──< ActiviteEmploye >── Employe
  │       └─< CommentaireActivite
  ├─< Equipement ──< EntretienEquipement / UtilisationEquipement
  ├─< CategorieStock ──< ArticleStock ──< MouvementStock
  ├─< Finance / Vente / Irrigation / Recolte …
  └─< Document (polymorphe) · Notification (polymorphe) · JournalAudit
```

Choix de modélisation notables :
- **PostGIS** pour la géométrie des parcelles ; superficie mesurée via SQL
  spatial (les champs géométriques sont manipulés en SQL brut paramétré, Prisma
  ne les typant pas).
- **Relations polymorphes** pour `Document`, `Notification`, `JournalAudit`
  (`entiteType` + `entiteId`), avec index dédié — un même mécanisme sert toutes
  les entités.
- **`Decimal`** pour toute valeur monétaire ou de quantité (jamais `Float`),
  précision financière garantie.
- **Cloisonnement** systématique par `fermeId`, indexé.
- Cascades et `SetNull` choisis entité par entité pour préserver l'historique.

## 8. Architecture frontend (Next.js)

- **App Router** avec un groupe de routes protégées `(protected)` derrière un
  layout authentifié (sidebar des 17 modules, thème clair/sombre sans
  clignotement).
- **Couche BFF** dans `app/api/**` (cf. §5).
- **Composants** par module dans `components/<module>/`, hooks de liste dans
  `lib/`, types partagés par module.
- **Design** inspiré des meilleurs SaaS (Stripe, Linear) : moderne, minimaliste,
  responsive ; couleur de marque centralisée dans Tailwind.
- **Recharts** pour les graphiques, **Leaflet** (OpenStreetMap, sans clé API)
  pour la cartographie, chargé sans SSR.

## 9. Extensibilité

L'architecture est pensée pour l'ajout de modules sans refonte :
- nouveau domaine = nouveau module NestJS autonome + son seed de permissions ;
- le schéma couvre déjà les 17 modules, les évolutions restent additives ;
- l'abstraction fichiers, les alertes calculées et le BFF sont des socles
  réutilisables.

Extensions futures envisagées par la SFD (élevage, drones, capteurs IoT, IA,
prévisions agronomiques) s'intègrent comme de nouveaux modules consommant les
mêmes fondations (auth, multi-tenant, API documentée). Le fonctionnement hors
ligne et la synchronisation différée de l'application mobile s'appuieront sur
cette même API REST.

## 10. Récapitulatif des décisions

| Décision | Raison |
|----------|--------|
| Monolithe modulaire | Simplicité de déploiement + frontières nettes |
| BFF + cookies httpOnly | Tokens hors de portée du JavaScript navigateur |
| RBAC relu en base | Permissions configurables, aucun rôle en dur |
| Isolation `fermeId` partout | Sécurité multi-tenant non contournable |
| Alertes calculées | Zéro désynchronisation, zéro donnée obsolète |
| `Decimal` pour l'argent | Exactitude financière |
| PostGIS | Géométrie et mesures spatiales natives |
| Stockage fichiers abstrait | Bascule S3 future sans impact modules |
| Migrations additives | Aucune régression sur l'existant |
| Filtre d'exception Prisma global | Aucune fuite d'erreur technique en `500` |
| Rate limiting global | Protection anti-abus (brute-force) dès la porte d'entrée |

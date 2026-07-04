# Installation

Mise en place d'un environnement de développement local complet.

## 1. Prérequis

| Outil | Version conseillée | Rôle |
|-------|--------------------|------|
| Node.js | ≥ 20 LTS | Exécution de l'API et de l'interface |
| npm | ≥ 10 | Gestion des paquets |
| Docker + Docker Compose | récent | Base PostgreSQL/PostGIS locale |
| Git | récent | Récupération du dépôt |

PostGIS est requis (pas seulement PostgreSQL) : le module Parcelles stocke des
géométries. L'image Docker fournie (`postgis/postgis:16-3.4`) l'inclut déjà.

## 2. Récupérer le dépôt

```bash
git clone <url-du-depot> creole-psf-manage
cd creole-psf-manage
```

## 3. Base de données

Un `docker-compose.yml` est fourni à la racine. Il démarre PostgreSQL 16 +
PostGIS avec les identifiants attendus par `.env.example`.

```bash
docker compose up -d
# Vérifier : docker compose ps  (le conteneur creole_psf_postgres doit être "Up")
```

La base écoute sur `localhost:5432`, base `creole_psf_manage`, utilisateur et mot
de passe `creole_psf`. Les données persistent dans un volume Docker
(`creole_psf_postgres_data`).

## 4. API (backend NestJS)

```bash
cd apps/api
cp .env.example .env          # variables de dev prêtes à l'emploi
npm install
```

Générer le client Prisma, créer le schéma en base, puis semer les données
initiales :

```bash
npx prisma generate           # génère le client typé
npx prisma migrate dev        # crée/applique les migrations
npx prisma db seed            # rôles, permissions, compte admin de démo
```

Semer les permissions des modules livrés (chaque module gère son propre seed,
idempotent — réexécutable sans risque) :

```bash
npx ts-node prisma/seeds/parcelles-permissions.seed.ts
npx ts-node prisma/seeds/cultures-permissions.seed.ts
npx ts-node prisma/seeds/equipements-permissions.seed.ts
npx ts-node prisma/seeds/activites-permissions.seed.ts
```

Démarrer l'API en mode développement (rechargement à chaud) :

```bash
npm run start:dev
```

- API : `http://localhost:3001/api/v1`
- Documentation Swagger : `http://localhost:3001/api/docs`

Le compte de démonstration est celui de `.env` (`SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`), par défaut `admin@creolepsf.ht` / `ChangeMoi123!`.

## 5. Interface (frontend Next.js)

Dans un second terminal :

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Interface : `http://localhost:3000`. Connectez-vous avec le compte de démo.

> `JWT_ACCESS_SECRET` doit être **identique** côté web et côté api : le
> middleware Next.js vérifie localement la signature de l'access token. Voir
> [02-configuration.md](02-configuration.md).

## 6. Vérifier l'installation

```bash
# Backend : tests unitaires (sans base)
cd apps/api && npm test

# Frontend : tests unitaires
cd apps/web && npm test
```

Détails de la suite complète dans [TESTING.md](../TESTING.md).

## Problèmes fréquents

- **`Can't reach database server`** — le conteneur Docker n'est pas démarré, ou
  `DATABASE_URL` pointe sur un mauvais port. Vérifiez `docker compose ps`.
- **`PostGIS` / extension manquante** — vous n'utilisez pas l'image PostGIS.
  Utilisez le `docker-compose.yml` fourni.
- **401 sur l'interface après connexion** — `JWT_ACCESS_SECRET` diffère entre
  `apps/api/.env` et `apps/web/.env.local`.
- **Permissions manquantes** — les seeds de permissions par module n'ont pas été
  exécutés (étape 4).

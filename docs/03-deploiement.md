# Déploiement

Mise en production de l'API et de l'interface. Le principe : deux services
Node.js (API NestJS, interface Next.js) devant une base PostgreSQL/PostGIS
managée ou conteneurisée, derrière un reverse proxy HTTPS.

## Vue d'ensemble

```
Internet ──HTTPS──> Reverse proxy (Nginx/Caddy/Traefik)
                        │
             ┌──────────┴───────────┐
             ▼                      ▼
      apps/web (Next.js)     apps/api (NestJS)
       :3000                  :3001 /api/v1
                                   │
                                   ▼
                     PostgreSQL 16 + PostGIS
```

Le navigateur ne parle qu'à l'interface Next.js ; celle-ci relaie vers l'API via
sa couche serveur (BFF). L'API peut donc rester sur un réseau privé, non exposée
directement à Internet.

## 1. Base de données

Utilisez une instance PostgreSQL **16 avec PostGIS** (managée de préférence :
sauvegardes, réplication). Créez une base dédiée et un utilisateur applicatif à
privilèges restreints, puis renseignez `DATABASE_URL`.

Appliquez le schéma **sans** générer de nouvelle migration en production :

```bash
cd apps/api
npx prisma migrate deploy      # applique les migrations existantes
npx prisma db seed             # rôles/permissions/admin — une seule fois
# puis les seeds de permissions par module (voir 01-installation.md)
```

`migrate deploy` est la commande de production : elle applique les migrations
déjà versionnées sans jamais modifier le schéma de façon interactive.

## 2. Construire et lancer l'API

```bash
cd apps/api
npm ci
npx prisma generate
npm run build                  # compile vers dist/
node dist/main.js              # ou : npm run start:prod
```

Variables d'environnement de production à définir (voir
[02-configuration.md](02-configuration.md)) : `DATABASE_URL`, `PORT`,
`CORS_ORIGIN` (domaine du front en HTTPS), les trois paires `JWT_*_SECRET` /
`JWT_*_EXPIRES_IN`, et `UPLOADS_DIR` (ou stockage S3 quand le Module 13 sera
livré).

## 3. Construire et lancer l'interface

```bash
cd apps/web
npm ci
npm run build
npm run start                  # sert la build Next.js (port 3000 par défaut)
```

Définir `API_BASE_URL` (URL interne de l'API, ex. `http://api:3001/api/v1`) et
`JWT_ACCESS_SECRET` (identique à l'API). `NODE_ENV=production` active
automatiquement le drapeau `secure` sur les cookies (HTTPS obligatoire).

## 4. Reverse proxy & HTTPS

Placez un reverse proxy (Nginx, Caddy, Traefik) devant l'interface, terminez le
TLS (Let's Encrypt), et transmettez à `apps/web:3000`. L'API n'a pas besoin
d'être exposée publiquement si le front et l'API partagent un réseau privé.

Points d'attention :
- `CORS_ORIGIN` = domaine public HTTPS du front.
- Les cookies étant `secure` en production, tout doit passer en HTTPS.
- Autoriser des corps de requête suffisants pour les téléversements de fichiers
  (photos, ~10–15 Mo).
- **Rate limiting derrière le proxy** : la limite de débit s'applique par IP.
  Derrière un reverse proxy, toutes les requêtes semblent venir de l'IP du proxy
  tant que l'application ne fait pas confiance à l'en-tête `X-Forwarded-For`.
  Activez `trust proxy` côté Express (et transmettez l'en-tête depuis le proxy)
  pour que la limite s'applique par IP cliente réelle.

## 5. Fichiers téléversés

En développement, les fichiers vont sur disque local (`UPLOADS_DIR`). En
production, deux options :
- monter un volume persistant partagé et sauvegardé sur `UPLOADS_DIR` ;
- attendre le **Module 13 (Documents)**, qui remplacera la couche de stockage
  par du S3-compatible. L'abstraction est déjà en place (`EntityFileStorage`) :
  seul son intérieur changera, sans impact sur les modules.

## 6. Conteneurisation (recommandé)

Le `docker-compose.yml` fourni ne contient que la base (usage dev). Pour la
production, ajoutez un `Dockerfile` par application (build multi-étapes :
`npm ci` → `build` → image d'exécution légère) et orchestrez api + web + proxy.
Ces Dockerfiles ne sont pas encore fournis dans le dépôt.

## 7. Sauvegardes & supervision

- **Sauvegardes** : `pg_dump` planifié (ou snapshots de la base managée) + copie
  du volume de fichiers téléversés.
- **Migrations** : toujours `migrate deploy`, jamais `migrate dev` en prod.
- **Supervision** : surveiller la disponibilité de l'API (`/api/v1`), la latence
  des requêtes et l'espace disque du stockage de fichiers.

## Checklist de mise en production

- [ ] `DATABASE_URL` pointe sur une base PostGIS dédiée et sauvegardée
- [ ] Tous les `JWT_*_SECRET` régénérés (secrets forts et uniques)
- [ ] `SEED_ADMIN_PASSWORD` changé, ou compte de démo supprimé après le premier
      administrateur réel
- [ ] `CORS_ORIGIN` limité au domaine du front
- [ ] HTTPS actif de bout en bout (`NODE_ENV=production`)
- [ ] `prisma migrate deploy` exécuté, seeds de permissions passés
- [ ] Stockage de fichiers persistant et sauvegardé

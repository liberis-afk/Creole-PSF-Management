# Configuration

Toute la configuration passe par des variables d'environnement. Aucun secret
n'est codé en dur. Côté API, les variables sont lues **en un seul endroit**
(`apps/api/src/core/config/configuration.ts`) et exposées via `ConfigService`
(clés typées comme `jwt.accessSecret`, `port`, `cors.origin`).

## Variables — API (`apps/api/.env`)

| Variable | Exemple | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://creole_psf:creole_psf@localhost:5432/creole_psf_manage?schema=public` | Connexion PostgreSQL/PostGIS |
| `PORT` | `3001` | Port d'écoute de l'API |
| `CORS_ORIGIN` | `http://localhost:3000` | Origines autorisées, séparées par des virgules |
| `JWT_ACCESS_SECRET` | *(48 octets aléatoires)* | Secret de signature de l'access token |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Durée de vie de l'access token |
| `JWT_REFRESH_SECRET` | *(48 octets aléatoires)* | Secret du refresh token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Durée de vie du refresh token |
| `JWT_PRE_AUTH_SECRET` | *(48 octets aléatoires)* | Secret du token pré-authentification (étape 2FA) |
| `JWT_PRE_AUTH_EXPIRES_IN` | `5m` | Durée de vie du token pré-auth |
| `SEED_ADMIN_EMAIL` | `admin@creolepsf.ht` | Compte admin créé par le seed |
| `SEED_ADMIN_PASSWORD` | `ChangeMoi123!` | Mot de passe du compte de démo |
| `UPLOADS_DIR` | `./uploads` | Dossier de stockage local des fichiers (dev) |

Les trois secrets JWT sont **distincts** volontairement : chaque type de token
peut être révoqué/roté indépendamment. Générez-les avec :

```bash
openssl rand -base64 48
```

En production, `JWT_*_SECRET`, `SEED_ADMIN_PASSWORD` et `DATABASE_URL` doivent
impérativement être remplacés par des valeurs propres et secrètes.

## Variables — Interface (`apps/web/.env.local`)

| Variable | Exemple | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:3001/api/v1` | URL de l'API, appelée **uniquement côté serveur** Next.js (jamais depuis le navigateur) |
| `JWT_ACCESS_SECRET` | *(identique à l'API)* | Le middleware vérifie localement la signature de l'access token |

> `API_BASE_URL` n'est **pas** préfixée `NEXT_PUBLIC_` : elle n'est jamais
> exposée au navigateur. Toute communication avec l'API passe par la couche BFF
> (route handlers Next.js). Voir [06-architecture.md](06-architecture.md).

## Cookies (définis côté web)

| Cookie | Contenu | Propriétés |
|--------|---------|-----------|
| `psf_access` | Access token | `httpOnly`, `sameSite=lax`, `secure` en production |
| `psf_refresh` | Refresh token | idem |

`httpOnly` empêche tout JavaScript du navigateur de lire les tokens (protection
contre le vol par XSS). Les noms sont centralisés dans
`apps/web/lib/auth-constants.ts`.

## Mapping durées → millisecondes

`JWT_REFRESH_EXPIRES_IN` (ex. `7d`) est converti en millisecondes pour calculer
la date d'expiration réelle stockée sur les sessions. Format accepté : un entier
suivi de `s`, `m`, `h` ou `d` (ex. `15m`, `7d`). Un format invalide fait échouer
le démarrage explicitement — pas de valeur silencieusement erronée.

## Paramètres applicatifs (Module 17, à venir)

La devise, le fuseau horaire et la langue sont prévus comme paramètres **par
ferme** en base (le schéma porte déjà `Ferme.devise`), et non comme variables
d'environnement — ils varient d'une ferme à l'autre dans un contexte
multi-tenant. Le module Paramètres exposera leur configuration.

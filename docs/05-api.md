# API

L'API est une API REST NestJS, documentée automatiquement via Swagger.

## Base et documentation

- **Base** : `http://<hôte>:3001/api/v1`
- **Swagger** (interactif) : `http://<hôte>:3001/api/docs`

Toutes les routes sont préfixées `/api/v1`. Swagger est la référence vivante :
il liste chaque endpoint, ses paramètres, ses schémas de requête/réponse et
permet de tester avec un token.

## Authentification

L'API attend un **access token JWT** en en-tête :

```
Authorization: Bearer <access_token>
```

Trois tokens coexistent :

| Token | Durée | Usage |
|-------|-------|-------|
| Access | courte (15 min) | Autorise chaque requête API |
| Refresh | longue (7 j) | Renouvelle l'access token sans re-login |
| Pré-auth | très courte (5 min) | Étape intermédiaire de la 2FA |

Un guard JWT **global** protège toutes les routes ; seules celles marquées
`@Public` (connexion, etc.) sont ouvertes. Une requête sans token valide reçoit
`401`.

### Depuis l'interface (BFF)

Le navigateur n'envoie **jamais** de Bearer lui-même. Il appelle les routes
Next.js `/api/*`, qui lisent le cookie `httpOnly` `psf_access` côté serveur et
le réinjectent en `Authorization: Bearer` vers l'API NestJS. Les tokens ne
transitent donc pas par du JavaScript navigateur. Voir
[06-architecture.md](06-architecture.md).

## Autorisation (permissions)

Après authentification, un second guard vérifie les **permissions** requises par
la route (ex. `activites.creer`), résolues en base pour l'utilisateur. Sans la
permission : `403`. Les permissions sont cloisonnées par ferme.

## Conventions

### Isolation multi-tenant
La ferme de l'utilisateur est déduite du token ; **aucun** `fermeId` n'est
accepté depuis le client pour cibler des données. Chaque requête est
automatiquement restreinte à la ferme courante.

### Pagination
Les listes acceptent `page` (défaut 1) et `limit` (défaut variable, plafonné à
100) et renvoient :

```json
{
  "donnees": [ /* ... */ ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

### Filtres & recherche
Passés en query string (ex. `?recherche=maïs&statut=EN_COURS&tri=dateProgrammee&ordre=asc`).
Chaque module documente ses filtres dans Swagger.

### Erreurs
Format NestJS standard :

```json
{ "statusCode": 400, "message": "…", "error": "Bad Request" }
```

Codes usuels : `400` (validation), `401` (non authentifié), `403` (permission
manquante), `404` (introuvable ou hors de la ferme), `409` (conflit métier, ex.
suppression protégée ou contrainte d'unicité), `429` (trop de requêtes — voir
« Limitation de débit » ci-dessous).

Un **filtre d'exception global** garantit qu'aucune erreur de base de données ne
fuit en `500` avec des détails internes : les erreurs Prisma connues sont
traduites en réponses propres (unicité → `409`, introuvable → `404`, clé
étrangère → `409`).

### Limitation de débit (rate limiting)
L'API applique une limite anti-abus (par défaut **100 requêtes / minute / IP**),
qui protège notamment la connexion du brute-force. Au-delà, l'API répond `429
Too Many Requests`.

### Validation
Les corps de requête sont validés strictement : un champ non déclaré dans le DTO
est **rejeté** (`400`), pas silencieusement ignoré. Les bornes métier sont
appliquées (ex. un coût ne peut être négatif).

## Aperçu des endpoints (modules livrés)

Référence non exhaustive — Swagger fait foi. Toutes les routes sont préfixées
`/api/v1`.

### Authentification
```
POST   /auth/login                 Connexion (peut renvoyer une étape 2FA)
POST   /auth/refresh               Renouvellement des tokens
POST   /auth/logout                Déconnexion
POST   /auth/mot-de-passe-oublie   Demande de réinitialisation
POST   /auth/reinitialiser         Réinitialisation du mot de passe
```

### Tableau de bord
```
GET    /dashboard                  Agrégats temps réel + séries de graphiques
```

### Parcelles
```
GET    /parcelles                  Liste (recherche, filtres, pagination)
GET    /parcelles/carte            Données cartographiques
POST   /parcelles                  Créer
GET    /parcelles/:id              Détail
PATCH  /parcelles/:id              Modifier
DELETE /parcelles/:id              Supprimer
GET    /parcelles/:id/photos               Lister les photos
POST   /parcelles/:id/photos               Téléverser (image, GPS optionnel)
GET    /parcelles/:id/photos/:pid/fichier  Télécharger/afficher
DELETE /parcelles/:id/photos/:pid          Supprimer
```

### Cultures
```
GET    /cultures                   Liste
GET    /cultures/statistiques      Statistiques agrégées
POST   /cultures                   Créer
GET    /cultures/:id               Détail (+ calendrier cultural calculé)
PATCH  /cultures/:id               Modifier
DELETE /cultures/:id               Supprimer (protégé si récoltes liées)
        …/suivi, …/traitements, …/photos
```

### Activités (Calendrier agricole)
```
GET    /activites                  Liste (filtres type/statut/priorité/enRetard)
GET    /activites/calendrier       Activités sur une plage de dates (vue grille)
GET    /activites/statistiques     Par statut/type, à venir, en retard
POST   /activites                  Créer
GET    /activites/:id              Détail
PATCH  /activites/:id              Modifier
DELETE /activites/:id              Supprimer
PUT    /activites/:id/employes             Définir les employés affectés
GET|POST /activites/:id/commentaires       Fil de commentaires
DELETE /activites/:id/commentaires/:cid    Supprimer un commentaire
GET|POST /activites/:id/pieces-jointes     Pièces jointes (image/PDF)
GET    /activites/:id/pieces-jointes/:pid/fichier
DELETE /activites/:id/pieces-jointes/:pid
```

### Équipements
```
GET    /equipements                Liste
GET    /equipements/statistiques   Statistiques
GET    /equipements/alertes        Alertes calculées
GET    /equipements/export         Export (format=csv|excel|pdf)
POST   /equipements                Créer
GET    /equipements/:id            Détail
PATCH  /equipements/:id            Modifier
DELETE /equipements/:id            Supprimer
        …/maintenance, …/utilisation, …/photos
```

## Objectif de couverture

À terme, **toutes** les fonctionnalités de la plateforme sont accessibles via
l'API (exigence SFD), chaque module ajoutant ses routes à la même documentation
Swagger.

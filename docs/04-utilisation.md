# Utilisation

Prise en main fonctionnelle de la plateforme. Cette section couvre les modules
**livrés** ; les modules à venir suivront le même style d'interface.

## Connexion

1. Ouvrez l'interface (`http://localhost:3000` en local).
2. Saisissez email et mot de passe (compte de démo par défaut :
   `admin@creolepsf.ht` / `ChangeMoi123!`).
3. Si la **double authentification (2FA)** est activée sur le compte, un code
   est demandé après le mot de passe : la connexion se fait alors en deux temps
   (un token de pré-authentification de courte durée, puis l'émission des tokens
   de session une fois le code validé).

Après connexion, l'access token (courte durée) et le refresh token sont stockés
dans des cookies `httpOnly` — invisibles au JavaScript. Les sessions et
l'historique des connexions sont tracés (journal de sécurité).

## Rôles et permissions

Huit rôles système existent : Super Administrateur, Administrateur,
Gestionnaire, Agronome, Comptable, Chef d'équipe, Employé, Visiteur. Chaque
**permission** (ex. `activites.creer`, `parcelles.supprimer`) est attribuée aux
rôles et **vérifiée en base à chaque requête** — il n'y a pas de rôle « en dur »
dans le code. Un utilisateur ne voit et n'exécute que ce que ses permissions
autorisent.

Toutes les données sont cloisonnées par **ferme** (multi-tenant) : un
utilisateur ne voit jamais les données d'une autre exploitation.

## Tableau de bord (Module 2)

Page d'accueil après connexion. Affiche en temps réel (agrégations calculées en
base, rafraîchies périodiquement) : production (cultures actives, superficie,
rendements estimé et réel), ressources humaines, activités en cours, finances du
mois, stocks et alertes, irrigation — accompagnés de graphiques (dépenses,
production, rentabilité, rendement, consommation d'eau). Les indicateurs se
remplissent à mesure que les modules correspondants sont alimentés.

## Parcelles (Module 3)

Gestion des parcelles avec informations agronomiques (superficie, GPS, type de
sol, pH, matière organique, texture, drainage), documents (photos, plans,
analyses de sol) et historique (cultures précédentes, rendements, maladies,
fertilisations, irrigations).

- **Créer / modifier** : formulaire complet ; la superficie peut être mesurée
  automatiquement à partir du tracé GPS.
- **Carte** : vue cartographique (Leaflet + OpenStreetMap) pour situer et tracer
  les parcelles ; photos géolocalisées.
- **Recherche & filtres** : par nom, code, statut ; liste paginée.

## Cultures (Module 4)

Chaque culture porte ses informations (nom, variété, espèce, cycle, dates de
plantation et de récolte prévue, parcelle), ses paramètres techniques
(espacement, densité, population, semences, rendement attendu) et son suivi
(stade végétatif, santé, maladies, ravageurs, traitements, photos).

- **Calendrier cultural** : frise calculée plantation → récolte, avec
  progression sur le cycle et stade courant.
- **Suivi** : enregistrement des observations et traitements.
- **Suppression protégée** : une culture ayant des récoltes ne peut être
  supprimée (pour ne pas perdre l'historique) — marquez-la « abandonnée ».

## Calendrier agricole (Module 5)

Planification et suivi des activités : plantation, semis, fertilisation,
irrigation, désherbage, pulvérisation, récolte, transport, maintenance.

Chaque activité possède : responsable, employés affectés, dates (début / fin
optionnelle), heure, priorité, statut, coût, commentaires (fil d'échanges) et
pièces jointes (photos et PDF).

- **Deux vues** : une **grille calendrier mensuelle** (activités posées sur
  leurs dates, code couleur par type) et une **vue liste** filtrable.
- **« En retard »** : calculé automatiquement (date dépassée + activité non
  terminée), sans modifier le statut saisi.
- Une activité liée à une culture apparaît automatiquement dans son calendrier
  cultural.

## Équipements & maintenance (Module 7)

Suivi des équipements (tracteur, camion, moto, pompe, générateur, outils,
système d'irrigation) avec état, localisation, responsable, valeur.

- **Maintenance** : entretiens préventifs/correctifs avec cycle de vie
  (planifié → en cours → terminé), pièces utilisées, coûts.
- **Utilisation** : suivi du temps d'usage.
- **Alertes calculées** : maintenance à venir, équipement en panne, coût
  d'entretien élevé, matériel inutilisé.
- **Statistiques** et **export** (CSV, Excel, PDF).

## Recherche, filtres, pagination

Tous les modules de liste partagent le même comportement : barre de recherche
(avec anti-rebond), filtres contextuels, tri par colonne et pagination. Le
composant de pagination est mutualisé.

## Déconnexion

La déconnexion invalide la session et efface les cookies. L'historique des
connexions reste consultable dans le journal de sécurité.

# Creole PSF Manage — Documentation de la base de données

Ce document explique le rôle de chaque table du fichier `schema.prisma`, les relations qu'elle porte, et les choix de conception associés. Il complète (ne remplace pas) le document d'architecture déjà validé.

---

## §0. Ce que Prisma ne couvre pas — migration SQL manuelle requise

Le fichier `schema.prisma` définit les tables, colonnes, FK et index. Trois éléments décidés dans l'architecture Sécurité doivent être ajoutés **après génération de la migration Prisma**, via une migration SQL manuelle (`prisma migrate dev --create-only` puis édition du fichier généré) :

1. **Row-Level Security (RLS) PostgreSQL** — activation sur chaque table portant `fermeId`, avec une politique du type :
   ```sql
   ALTER TABLE parcelles ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON parcelles
     USING (ferme_id = current_setting('app.current_farm_id')::text);
   ```
   La variable de session `app.current_farm_id` est positionnée par le `TenancyGuard` NestJS à chaque requête.

2. **Extension PostGIS** — `CREATE EXTENSION IF NOT EXISTS postgis;` (déclarée dans `datasource.extensions`, mais l'activation effective dépend des droits du rôle DB en production).

3. **Index GiST** sur les colonnes géométriques :
   ```sql
   CREATE INDEX idx_parcelles_limites ON parcelles USING GIST (limites);
   CREATE INDEX idx_parcelles_centroide ON parcelles USING GIST (centroide);
   ```
   Prisma ne sait pas déclarer un index spatial nativement — il sera ajouté à la main dans la migration.

---

## §1. Conventions transversales

- **Identifiants** : `cuid()` plutôt que des entiers auto-incrémentés. Raison : un ID séquentiel expose le volume de données (`/commandes/1042` révèle qu'il existe ~1042 commandes) et facilite l'énumération malveillante d'un tenant à l'autre.
- **Isolation multi-tenant** : les entités de premier niveau (directement rattachées à une ferme : `Parcelle`, `Culture`, `Employe`, `Presence`, `Equipement`, `ArticleStock`, `Transaction`, etc.) portent toutes un `fermeId` avec contrainte FK réelle, pour que le RLS PostgreSQL puisse filtrer directement sur la ligne. Les entités de second niveau (`SuiviCulture` sous `Culture`, `MouvementStock` sous `ArticleStock`...) n'ont **pas** de `fermeId` propre : leur isolation est héritée par jointure sur le parent. Ce choix évite une dénormalisation excessive tout en gardant le RLS efficace là où les requêtes directes sur la table sont fréquentes.
- **Suppression** : `onDelete: Cascade` est utilisé quand l'enfant n'a aucun sens sans le parent (ex. supprimer une `Culture` supprime ses `SuiviCulture`). `onDelete: SetNull` est utilisé quand la relation est une référence optionnelle qui ne doit pas entraîner de perte de données (ex. supprimer un `Utilisateur` ne doit pas supprimer les `Document` qu'il a uploadés — seul le lien `uploadePar` est vidé).
- **Champs `Decimal` plutôt que `Float`** : obligatoire pour tout ce qui touche à l'argent ou aux quantités agricoles — `Float` introduit des erreurs d'arrondi binaire inacceptables sur des totaux financiers.

---

## §2. Module 1 — Authentification, RBAC, Sécurité

| Table | Rôle |
|---|---|
| `utilisateurs` | Compte de connexion. Un utilisateur est global au système (pas par ferme) — c'est `ferme_utilisateurs` qui définit à quelles fermes il a accès et avec quel rôle. |
| `roles` | Un rôle est soit un **gabarit système** (`fermeId = null`, ex. "Gestionnaire", non supprimable, créé au seed initial), soit un **rôle personnalisé** créé par une ferme spécifique. Ce double mode répond à l'exigence "8 rôles prédéfinis" tout en gardant "chaque permission configurable". |
| `permissions` | Catalogue global des permissions possibles (`finances.depenses.creer`, `employes.salaires.voir`...). Table de référence indépendante des fermes — le namespacing par module (`finances.*`, `stocks.*`) permet de générer dynamiquement l'écran de gestion des permissions par catégorie. |
| `role_permissions` | Table pivot rôle ↔ permission. Un rôle peut avoir 0 à N permissions ; c'est cette table, éditable depuis Module 17, qui rend le RBAC réellement dynamique. |
| `ferme_utilisateurs` | **Table pivot centrale du multi-tenant.** Elle relie un utilisateur à une ferme *et* lui assigne un rôle *pour cette ferme précise*. Un même utilisateur peut être Gestionnaire sur la Ferme A et Employé sur la Ferme B — c'est cette table qui le permet. Contient aussi le statut d'invitation (`EN_ATTENTE`, `ACCEPTEE`...) pour gérer le flux d'invitation d'un nouvel utilisateur. |
| `sessions_connexion` | Une ligne par session active (couple appareil/navigateur). Stocke le hash du refresh token (jamais le token en clair) — permet la révocation à distance en supprimant/marquant la ligne, ce qu'un JWT stateless pur ne permettrait pas. |
| `journal_securite` | Journal d'événements de sécurité (connexions, échecs, changements de mot de passe, activation 2FA...). Volontairement **séparé** du journal d'audit métier : ce journal répond à des besoins de conformité/forensic, pas de traçabilité fonctionnelle. Écriture seule depuis l'application (aucun endpoint `UPDATE`/`DELETE` ne doit exister dessus). |
| `journal_audit` | Journal générique **qui**, **a fait quoi**, **sur quelle entité**, **quand**, avec l'ancienne et la nouvelle valeur en JSON. Alimenté automatiquement par un middleware Prisma sur les tables sensibles, pas par une saisie manuelle module par module (élimine le risque d'oubli). |

**Pourquoi ne pas fusionner `journal_securite` et `journal_audit`** : leurs schémas de rétention, d'accès (qui peut les consulter) et de finalité diffèrent — un mélange rendrait les deux plus difficiles à interroger et à sécuriser correctement.

---

## §3. Multi-tenant & Paramètres (Module 17)

| Table | Rôle |
|---|---|
| `fermes` | L'entité racine du multi-tenant. Contient les paramètres structurants dupliqués en colonnes typées (`devise`, `langue`, `fuseauHoraire`) parce que ce sont des champs lus à quasiment chaque requête (formatage d'affichage) — les y garder en colonne directe évite une jointure supplémentaire systématique vers `parametres`. |
| `parametres` | Paramètres extensibles clé/valeur (`Json`) pour tout ce qui ne justifie pas une colonne dédiée : fréquence de sauvegarde, options d'affichage, seuils personnalisés, etc. Permet d'ajouter un nouveau paramètre sans migration de schéma. |

---

## §4. Module 3 — Parcelles

| Table | Rôle |
|---|---|
| `parcelles` | Fiche complète de parcelle. Le champ `limites` est un polygone **PostGIS** (`geometry(Polygon,4326)`) — permet le calcul natif de superficie (`ST_Area`) exigé par le Module 15 (Cartographie), plutôt que de stocker des coordonnées en JSON et recalculer côté application (moins précis, non standard). `centroide` est un point dupliqué pour l'affichage rapide de marqueurs sur carte sans devoir recalculer le centre du polygone à chaque rendu. |
| `analyses_sol` | Historique des analyses de sol dans le temps (une parcelle peut être analysée plusieurs fois/an). Distincte des champs `ph`/`matiereOrganique` sur `Parcelle`, qui représentent l'état **courant** utilisé pour l'affichage rapide de la fiche — `analyses_sol` est l'historique complet.

---

## §5. Module 4 — Cultures

| Table | Rôle |
|---|---|
| `cultures` | Une culture = une instance de plantation sur une parcelle, avec son cycle (plantation → récolte). Porte son propre `fermeId` (en plus de `parcelleId`) car les cultures sont interrogées très fréquemment par ferme directement (tableau de bord, filtres) — la dénormalisation évite une jointure systématique via `Parcelle`. |
| `suivis_culture` | Historique des observations (stade végétatif, état de santé, maladies/ravageurs observés) dans le temps — une culture a N suivis au fil de son cycle. Les champs `maladies` et `ravageurs` sont des tableaux PostgreSQL natifs (`String[]`), adaptés à une liste courte sans table de jonction supplémentaire. |
| `traitements_culture` | Historique des traitements appliqués (herbicide, insecticide, fongicide, fertilisant), séparé du suivi pour permettre un rapport "coût des intrants par culture" indépendant du suivi sanitaire. |

---

## §6. Module 5 — Calendrier agricole

| Table | Rôle |
|---|---|
| `calendrier_activites` | Table unique pour tous les types d'activité (plantation, semis, irrigation, récolte...) plutôt qu'une table par type. **Pourquoi une seule table** : les activités partagent la quasi-totalité de leurs champs (responsable, priorité, date, statut) et doivent apparaître ensemble dans une vue calendrier unifiée — les distinguer par tables séparées obligerait à une requête `UNION` coûteuse à chaque affichage du calendrier. Le champ `type` (enum) distingue la nature de l'activité pour le filtrage. Les relations `parcelleId`/`cultureId` sont toutes deux optionnelles et non exclusives : une activité peut concerner uniquement une parcelle (ex. entretien général) ou une culture précise. |

---

## §7. Module 6 — Employés

| Table | Rôle |
|---|---|
| `employes` | Fiche RH complète. |
| `contrats` | Historique des contrats d'un employé (un employé peut avoir plusieurs contrats successifs — CDD renouvelé, changement de poste). Séparé de `Employe` pour ne pas perdre l'historique contractuel lors d'un renouvellement. |
| `presences` | Une ligne par employé par jour (`@@unique([employeId, date])` empêche le double pointage). Porte un `fermeId` dénormalisé car les rapports de présence sont systématiquement interrogés "toute la ferme, sur une plage de dates" — sans cette dénormalisation, chaque requête devrait joindre `employes` pour filtrer par ferme. |
| `conges` | Demandes de congé avec workflow d'approbation (`statut` : EN_ATTENTE → APPROUVE/REFUSE). |
| `heures_supplementaires` | Séparée de `presences` car les heures supplémentaires ont leur propre logique de validation et de taux horaire, et ne concernent qu'une minorité des présences. |
| `paiements_employes` | Paiement de salaire à un employé. Lié optionnellement à une `Transaction` financière (`transactionId`) — ce paiement RH peut ainsi apparaître dans les rapports financiers consolidés (Module 9) sans dupliquer la logique comptable. |

---

## §8. Module 7 — Équipements

| Table | Rôle |
|---|---|
| `equipements` | Fiche équipement (tracteur, pompe, outil...). |
| `entretiens_equipement` | Historique des entretiens préventifs/correctifs, avec `prochaineEcheance` indexée pour alimenter les alertes du Module 16 ("entretien à prévoir"). |
| `consommations_carburant` | Séparée des entretiens car la consommation carburant est saisie à une fréquence différente (à chaque plein) et alimente un rapport de coût carburant distinct (KPI "consommation carburant" du module Analyses). |
| `utilisations_equipement` | Trace qui a utilisé quel équipement, combien de temps, sur quelle activité. Lien optionnel vers `calendrier_activites` — permet de rattacher l'usage d'un tracteur à une activité de plantation précise sans rendre ce lien obligatoire (un usage ponctuel hors planning doit pouvoir être saisi). |

---

## §9. Module 8 — Stocks

| Table | Rôle |
|---|---|
| `categories_stock` | Catégories (semences, fertilisants...) — table plutôt qu'enum figé, pour que chaque ferme puisse ajouter ses propres catégories sans migration. Le champ `type` (enum) garde les 8 catégories de la SFD comme classification standard pour les rapports, tandis que `nom` permet une personnalisation libre. |
| `articles_stock` | Un article = un produit stocké avec sa quantité courante (`quantiteStock`), maintenue à jour par agrégation des mouvements (recalculée à chaque mouvement, pas seulement à la lecture — pour que les alertes de seuil bas puissent se déclencher immédiatement). |
| `mouvements_stock` | Historique complet des entrées/sorties/ajustements — jamais de suppression ou modification d'une quantité stock directement sur `ArticleStock` sans mouvement associé, pour garder une traçabilité totale (exigence de valorisation du Module 8). |
| `alertes_stock` | Séparée de `ArticleStock` pour garder un historique des alertes déclenchées et résolues dans le temps (utile pour un rapport "fréquence de rupture par article"), plutôt qu'un simple booléen sur l'article qui écraserait cet historique. |

---

## §10. Module 9 — Finances (ERP)

| Table | Rôle |
|---|---|
| `categories_financieres` | Catégories de recettes/dépenses, avec auto-relation `parentId` pour supporter une hiérarchie (ex. "Intrants" > "Fertilisants", "Intrants" > "Semences") — nécessaire pour un vrai plan comptable simplifié plutôt qu'une liste plate. |
| `transactions` | Table centrale de l'ERP financier : chaque recette ou dépense y transite. Le couple `entiteLieeType`/`entiteLieeId` (sans FK native, voir §0 du document d'architecture) permet de relier une transaction à sa source (une vente, un paiement RH, un achat de stock) sans créer une FK différente par type de source. |
| `budgets` | Budget prévisionnel par catégorie et période (mensuel/annuel), comparé aux `transactions` réelles pour générer les rapports de rentabilité et suivi budgétaire. |

**Pourquoi les rapports (Bilan, Compte de résultat, Flux de trésorerie) n'ont pas de table dédiée** : ce sont des **vues calculées** à partir de `transactions` + `categories_financieres`, pas des données stockées — les stocker créerait un risque de désynchronisation avec les transactions sources. Ils seront générés à la demande (Module 14).

---

## §11. Module 10 — Irrigation

| Table | Rôle |
|---|---|
| `systemes_irrigation` | Un système d'irrigation (gravité, goutte-à-goutte, aspersion) — peut couvrir plusieurs parcelles. |
| `parcelle_systeme_irrigation` | Table de jonction many-to-many : une parcelle peut être couverte par plusieurs systèmes (rare mais possible, ex. complément goutte-à-goutte sur une parcelle en gravité), et un système peut couvrir plusieurs parcelles (cas courant). |
| `pompes` | Pompes rattachées à un système. |
| `releves_pompe` | Relevés dans le temps (pression, débit, durée, consommation d'eau) — alimente directement les graphiques "consommation d'eau" du Tableau de bord (Module 2) et les KPIs du module Analyses. |
| `planifications_irrigation` | Calendrier récurrent d'irrigation (jours de la semaine + heure + durée), distinct de `calendrier_activites` car il s'agit d'une règle récurrente automatisable (pourra piloter une vanne connectée dans une future extension IoT), pas d'une tâche ponctuelle assignée à un responsable humain. |

---

## §12. Module 11 — Récoltes

| Table | Rôle |
|---|---|
| `recoltes` | Une récolte rattache une `Culture` et sa `Parcelle` d'origine, avec quantité, qualité, destination (vente/stock/transformation/perte) et les trois calculs demandés par la SFD : `rendementEstime`, `rendementReel`, `quantitePerte`. Porte son propre `fermeId` pour les mêmes raisons de performance de filtrage que `Culture`. |

---

## §13. Module 12 — Ventes

| Table | Rôle |
|---|---|
| `clients` | Fiche client simple. |
| `commandes` | Commande client avec statut de traitement (`statut`) et statut de paiement (`statutPaiement`) — volontairement deux champs distincts : une commande peut être `LIVREE` mais `PARTIEL` en paiement, ces deux cycles de vie sont indépendants. |
| `lignes_commande` | Détail produit par produit d'une commande. `recolteId` est optionnel et permet de tracer qu'une ligne de vente provient d'une récolte précise (valorisation directe de la production), sans obliger chaque ligne à provenir d'une récolte enregistrée (vente d'un produit acheté/transformé aussi possible). |
| `paiements_vente` | Paiements reçus pour une commande, potentiellement en plusieurs fois — permet de calculer `statutPaiement` (PARTIEL/PAYE) par somme des paiements reçus vs `montantTotal`. |

---

## §14. Module 13 — Documents

| Table | Rôle |
|---|---|
| `documents` | Table unique et polymorphe pour tous les fichiers (contrats, factures, photos, plans, analyses). Le couple `entiteType` (enum fermé : PARCELLE, EMPLOYE, EQUIPEMENT...) + `entiteId` remplace ce qui exigerait sinon une table `document_parcelle`, `document_employe`, `document_equipement`... — au prix de l'absence de contrainte FK native sur ce couple (compensée en Service). Les champs `latitude`/`longitude` optionnels couvrent le besoin "photos géolocalisées" du Module 15 sans table séparée. |

---

## §15. Module 14 — Rapports

| Table | Rôle |
|---|---|
| `rapports_export` | Journal des rapports générés (type, format, paramètres utilisés, lien du fichier produit). Ne stocke pas les données du rapport lui-même (qui restent calculées à la demande depuis les tables sources) — sert à la traçabilité ("qui a exporté quoi") et à permettre un re-téléchargement rapide sans redemander les mêmes paramètres. |

---

## §16. Module 15 — Cartographie

Aucune table dédiée : ce module s'appuie entièrement sur `parcelles.limites` / `parcelles.centroide` (PostGIS) pour le dessin/mesure, et sur `documents` (avec `latitude`/`longitude`) pour les photos géolocalisées. Créer une table "Carte" séparée aurait dupliqué des données déjà présentes sur `Parcelle`.

---

## §17. Module 16 — Notifications

| Table | Rôle |
|---|---|
| `notifications` | Une notification par utilisateur (pas de diffusion groupée stockée en une ligne — chaque destinataire a sa propre ligne avec son propre statut `estLue`, ce qui permet un "marquer comme lu" individuel sans affecter les autres destinataires). Le couple `sourceEntiteType`/`sourceEntiteId` (polymorphe, même logique que `documents`) permet de faire un lien cliquable vers l'entité à l'origine de la notification (ex. cliquer une alerte stock ouvre directement l'article concerné). |

---

## §18. Application mobile — Synchronisation

| Table | Rôle |
|---|---|
| `appareils_mobiles` | Un enregistrement par couple utilisateur/appareil pour suivre l'état de synchronisation différée (`statutSync`, `dernierSyncLe`). Les entités métier elles-mêmes (Présence, Récolte, Document...) n'ont pas de colonne de sync dans ce schéma central : la résolution offline/online se fait côté mobile (SQLite local) et via les endpoints `/sync/push` et `/sync/pull` définis dans l'architecture API — cette table ne fait que suivre **l'état de l'appareil**, pas l'état de chaque ligne. |

---

## §19. Tables volontairement absentes (et pourquoi)

| Table à laquelle on pourrait s'attendre | Pourquoi elle n'existe pas |
|---|---|
| `Produit` (catalogue de vente séparé) | Une vente référence directement une `Recolte` valorisée (`LigneCommande.recolteId`) — créer un catalogue produit séparé dupliquerait l'information déjà portée par `Culture`/`Recolte` sans bénéfice au stade actuel. |
| `Bilan`, `CompteDeResultat`, `FluxTresorerie` | Ce sont des rapports calculés depuis `Transaction`, pas des données stockées (voir §10). |
| `Carte` / `Cartographie` | Portée entièrement par les colonnes géospatiales de `Parcelle` (voir §16). |
| `Elevage`, `Capteur`, `Drone` | Hors périmètre v1.0 — le schéma est conçu pour les accueillir plus tard sans redesign majeur : `metadata`-style extensibilité via `parametres` pour la ferme, et pattern polymorphe déjà en place (`documents`, `notifications`) réutilisable pour un futur module Élevage. |

---

## §20. Récapitulatif — nombre de tables par module

| Module | Tables |
|---|---|
| 1. Authentification/RBAC | `utilisateurs`, `roles`, `permissions`, `role_permissions`, `ferme_utilisateurs`, `sessions_connexion`, `journal_securite`, `journal_audit` (8) |
| Multi-tenant/Paramètres | `fermes`, `parametres` (2) |
| 3. Parcelles | `parcelles`, `analyses_sol` (2) |
| 4. Cultures | `cultures`, `suivis_culture`, `traitements_culture` (3) |
| 5. Calendrier | `calendrier_activites` (1) |
| 6. Employés | `employes`, `contrats`, `presences`, `conges`, `heures_supplementaires`, `paiements_employes` (6) |
| 7. Équipements | `equipements`, `entretiens_equipement`, `consommations_carburant`, `utilisations_equipement` (4) |
| 8. Stocks | `categories_stock`, `articles_stock`, `mouvements_stock`, `alertes_stock` (4) |
| 9. Finances | `categories_financieres`, `transactions`, `budgets` (3) |
| 10. Irrigation | `systemes_irrigation`, `parcelle_systeme_irrigation`, `pompes`, `releves_pompe`, `planifications_irrigation` (5) |
| 11. Récoltes | `recoltes` (1) |
| 12. Ventes | `clients`, `commandes`, `lignes_commande`, `paiements_vente` (4) |
| 13. Documents | `documents` (1) |
| 14. Rapports | `rapports_export` (1) |
| 16. Notifications | `notifications` (1) |
| Mobile/Sync | `appareils_mobiles` (1) |
| **Total** | **47 tables** |

---

## Questions ouvertes à valider avant migration

1. **`quantiteStock` recalculée vs vue matérialisée** : le schéma maintient `ArticleStock.quantiteStock` comme un champ dénormalisé mis à jour à chaque `MouvementStock` (par la couche Service, en transaction). Alternative : ne jamais stocker ce total et le calculer à la volée par `SUM(mouvements)`. Le choix actuel privilégie la vitesse de lecture (dashboard, alertes) au prix d'une logique applicative qui doit rester rigoureuse. À confirmer.
2. **RLS PostgreSQL** : je recommande de l'activer dès la première migration plutôt que de l'ajouter plus tard (une fois des données réelles présentes, l'ajout est plus risqué). À planifier dans l'étape "socle technique".
3. **Politique de rétention `journal_securite`/`journal_audit`** : aucune purge automatique n'est prévue dans ce schéma — à définir (durée légale de conservation) avant la mise en production.

---

Je m'arrête ici, comme convenu. Dis-moi si tu veux que je révise une table, que je détaille une relation en particulier, ou si le schéma est validé pour passer à l'étape suivante.

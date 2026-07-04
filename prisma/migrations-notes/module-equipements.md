# Migration — Module 7 (Équipements & Maintenance)

Cette migration est **purement additive** (colonnes nullables + deux enums +
une relation optionnelle). Aucune donnée existante n'est modifiée ou perdue.

## Générer la migration

```bash
cd apps/api
npx prisma migrate dev --name module_equipements_maintenance
npx prisma generate
```

## SQL équivalent (pour référence / application manuelle)

```sql
-- Nouveaux types énumérés
CREATE TYPE "EtatEquipement" AS ENUM ('NEUF', 'BON', 'MOYEN', 'EN_PANNE');
CREATE TYPE "StatutEntretien" AS ENUM ('PLANIFIE', 'EN_COURS', 'TERMINE');

-- Équipements : nouveaux champs
ALTER TABLE "equipements" ADD COLUMN "etat" "EtatEquipement" NOT NULL DEFAULT 'BON';
ALTER TABLE "equipements" ADD COLUMN "localisation" TEXT;
ALTER TABLE "equipements" ADD COLUMN "responsableId" TEXT;
ALTER TABLE "equipements" ADD COLUMN "notes" TEXT;

-- Numéro de série unique par ferme (les NULL restent autorisés en multiple sous PostgreSQL)
CREATE UNIQUE INDEX "equipements_fermeId_numeroSerie_key"
  ON "equipements"("fermeId", "numeroSerie");
CREATE INDEX "equipements_etat_idx" ON "equipements"("etat");
CREATE INDEX "equipements_responsableId_idx" ON "equipements"("responsableId");

-- Responsable → employé (SET NULL si l'employé est supprimé)
ALTER TABLE "equipements"
  ADD CONSTRAINT "equipements_responsableId_fkey"
  FOREIGN KEY ("responsableId") REFERENCES "employes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Entretiens : statut + pièces utilisées
ALTER TABLE "entretiens_equipement" ADD COLUMN "statut" "StatutEntretien" NOT NULL DEFAULT 'PLANIFIE';
ALTER TABLE "entretiens_equipement" ADD COLUMN "piecesUtilisees" TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX "entretiens_equipement_statut_idx" ON "entretiens_equipement"("statut");
```

## Notes

- `etat` (condition physique : NEUF/BON/MOYEN/EN_PANNE) est le champ piloté par
  le module et par les alertes. Le champ `statut` opérationnel préexistant
  (OPERATIONNEL/EN_PANNE/EN_MAINTENANCE/HORS_SERVICE) est conservé pour le
  tableau de bord ; le service le tient en cohérence (EN_PANNE quand
  `etat = EN_PANNE`).
- La table `employes` doit exister (Module 6) pour la contrainte de clé
  étrangère du responsable. Si le Module 6 n'est pas encore migré, la colonne
  `responsableId` peut rester sans contrainte tant que la table n'existe pas —
  mais dans ce schéma la table `employes` est déjà définie.

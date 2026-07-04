# Migration — Module 5 (Calendrier agricole / Activités)

Migration **purement additive** : deux colonnes nullables sur les activités +
deux nouvelles tables. Aucune donnée existante modifiée.

## Générer la migration

```bash
cd apps/api
npx prisma migrate dev --name module_activites_calendrier
npx prisma generate
```

## SQL équivalent (référence)

```sql
-- Activités : coût + date de fin
ALTER TABLE "calendrier_activites" ADD COLUMN "cout" DECIMAL(14,2);
ALTER TABLE "calendrier_activites" ADD COLUMN "dateFin" TIMESTAMP(3);

-- Liaison employés affectés (plusieurs-à-plusieurs)
CREATE TABLE "activite_employes" (
  "id" TEXT NOT NULL,
  "activiteId" TEXT NOT NULL,
  "employeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activite_employes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "activite_employes_activiteId_employeId_key" ON "activite_employes"("activiteId", "employeId");
CREATE INDEX "activite_employes_activiteId_idx" ON "activite_employes"("activiteId");
CREATE INDEX "activite_employes_employeId_idx" ON "activite_employes"("employeId");
ALTER TABLE "activite_employes" ADD CONSTRAINT "activite_employes_activiteId_fkey"
  FOREIGN KEY ("activiteId") REFERENCES "calendrier_activites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activite_employes" ADD CONSTRAINT "activite_employes_employeId_fkey"
  FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Fil de commentaires
CREATE TABLE "commentaires_activite" (
  "id" TEXT NOT NULL,
  "activiteId" TEXT NOT NULL,
  "auteurId" TEXT,
  "contenu" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commentaires_activite_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "commentaires_activite_activiteId_idx" ON "commentaires_activite"("activiteId");
ALTER TABLE "commentaires_activite" ADD CONSTRAINT "commentaires_activite_activiteId_fkey"
  FOREIGN KEY ("activiteId") REFERENCES "calendrier_activites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commentaires_activite" ADD CONSTRAINT "commentaires_activite_auteurId_fkey"
  FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

## Notes

- `dateProgrammee` = date/heure de début ; `dateFin` = fin optionnelle
  (activités sur plusieurs jours).
- Le statut « en retard » n'est pas stocké : il est calculé à la lecture
  (date programmée dépassée et activité ni terminée ni annulée).
- Le **responsable** d'une activité est un `Utilisateur` (compte) ; les
  **employés affectés** sont des fiches `Employe` via `activite_employes`.
- Les pièces jointes réutilisent la table `Document` polymorphe
  (`entiteType = ACTIVITE`), sans changement de schéma.

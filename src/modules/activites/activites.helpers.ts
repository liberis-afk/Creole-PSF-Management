import { StatutActivite } from '@prisma/client';

/**
 * Statuts d'une activité considérés comme « ouverts » (ni terminée, ni annulée).
 * Source unique de vérité, utilisée par le CRUD et par la vue calendrier.
 */
export const STATUTS_ACTIVITE_OUVERTS: StatutActivite[] = [StatutActivite.PLANIFIEE, StatutActivite.EN_COURS];

/**
 * Retard calculé (jamais stocké) : la date programmée est dépassée et
 * l'activité est encore ouverte.
 */
export function estEnRetard(dateProgrammee: Date, statut: StatutActivite, maintenant: Date = new Date()): boolean {
  return dateProgrammee < maintenant && STATUTS_ACTIVITE_OUVERTS.includes(statut);
}

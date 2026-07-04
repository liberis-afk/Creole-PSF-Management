import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { STATUTS_ACTIVITE_OUVERTS, estEnRetard } from './activites.helpers';

/**
 * Vue calendrier (activités sur une plage de dates) et statistiques légères
 * pour le tableau de bord. Le retard est calculé, jamais stocké.
 */
@Injectable()
export class ActivitesCalendrierService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Activités dont la période [dateProgrammee, dateFin ?? dateProgrammee]
   * intersecte la plage demandée. Renvoie une liste légère prête pour la grille.
   */
  async getCalendrier(fermeId: string, debut: string, fin: string) {
    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);
    // Fin de journée incluse pour la borne haute.
    dateFin.setHours(23, 59, 59, 999);

    const activites = await this.prisma.calendrierActivite.findMany({
      where: {
        fermeId,
        // Intersection de périodes : début ≤ fin de la plage ET
        // (dateFin ?? début) ≥ début de la plage.
        AND: [
          { dateProgrammee: { lte: dateFin } },
          { OR: [{ dateFin: { gte: dateDebut } }, { dateFin: null, dateProgrammee: { gte: dateDebut } }] },
        ],
      },
      orderBy: { dateProgrammee: 'asc' },
      select: {
        id: true,
        titre: true,
        type: true,
        priorite: true,
        statut: true,
        dateProgrammee: true,
        dateFin: true,
        heureProgrammee: true,
      },
    });

    return activites.map((a) => ({
      id: a.id,
      titre: a.titre,
      type: a.type,
      priorite: a.priorite,
      statut: a.statut,
      enRetard: estEnRetard(a.dateProgrammee, a.statut),
      dateProgrammee: a.dateProgrammee.toISOString(),
      dateFin: a.dateFin?.toISOString() ?? null,
      heureProgrammee: a.heureProgrammee,
    }));
  }

  /** Statistiques légères : par statut, par type, à venir (7 j), en retard. */
  async getStatistiques(fermeId: string) {
    const maintenant = new Date();
    const dans7jours = new Date(maintenant.getTime() + 7 * 86_400_000);

    const [total, parStatut, parType, aVenir, enRetard] = await this.prisma.$transaction([
      this.prisma.calendrierActivite.count({ where: { fermeId } }),
      this.prisma.calendrierActivite.groupBy({ by: ['statut'], where: { fermeId }, _count: { statut: true } }),
      this.prisma.calendrierActivite.groupBy({ by: ['type'], where: { fermeId }, _count: { type: true } }),
      this.prisma.calendrierActivite.count({
        where: { fermeId, statut: { in: STATUTS_ACTIVITE_OUVERTS }, dateProgrammee: { gte: maintenant, lte: dans7jours } },
      }),
      this.prisma.calendrierActivite.count({
        where: { fermeId, statut: { in: STATUTS_ACTIVITE_OUVERTS }, dateProgrammee: { lt: maintenant } },
      }),
    ]);

    return {
      total,
      parStatut: parStatut.map((s) => ({ statut: s.statut, nombre: s._count.statut })),
      parType: parType.map((t) => ({ type: t.type, nombre: t._count.type })),
      aVenir7Jours: aVenir,
      enRetard,
    };
  }
}

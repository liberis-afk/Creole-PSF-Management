import { Injectable } from '@nestjs/common';
import { EtatEquipement, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * Alertes et statistiques des équipements. Les alertes sont CALCULÉES à la
 * volée (jamais stockées) à partir de seuils explicites — ajustables plus tard
 * via le Module 17. Les statistiques sont des agrégations réelles filtrées par
 * ferme.
 */
@Injectable()
export class EquipementsAlertesService {
  // Seuils d'alerte (constantes claires, centralisées).
  private readonly JOURS_MAINTENANCE_A_VENIR = 30;
  private readonly JOURS_INUTILISE = 90;
  private readonly RATIO_COUT_ELEVE = 0.5; // 50 % de la valeur d'achat
  private readonly SEUIL_COUT_ABSOLU = 500_000; // si valeur d'achat inconnue (HTG)

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------- ALERTES
  async getAlertes(fermeId: string) {
    const maintenant = new Date();
    const dansXjours = new Date(maintenant.getTime() + this.JOURS_MAINTENANCE_A_VENIR * 86_400_000);
    const seuilInutilise = new Date(maintenant.getTime() - this.JOURS_INUTILISE * 86_400_000);

    const equipements = await this.prisma.equipement.findMany({
      where: { fermeId },
      select: {
        id: true,
        nom: true,
        etat: true,
        coutAchat: true,
        entretiens: { select: { cout: true, statut: true, prochaineEcheance: true, dateEntretien: true } },
        utilisations: { select: { date: true }, orderBy: { date: 'desc' }, take: 1 },
      },
    });

    const maintenanceAVenir: Array<{ id: string; nom: string; echeance: string }> = [];
    const enPanne: Array<{ id: string; nom: string }> = [];
    const coutEleve: Array<{ id: string; nom: string; coutTotal: number }> = [];
    const inutilise: Array<{ id: string; nom: string; derniereUtilisation: string | null }> = [];

    for (const e of equipements) {
      // 1) Maintenance à venir : échéance planifiée non terminée sous X jours.
      const echeanceProche = e.entretiens
        .filter((ent) => ent.statut !== 'TERMINE' && ent.prochaineEcheance && ent.prochaineEcheance <= dansXjours && ent.prochaineEcheance >= maintenant)
        .map((ent) => ent.prochaineEcheance!)
        .sort((a, b) => a.getTime() - b.getTime())[0];
      if (echeanceProche) {
        maintenanceAVenir.push({ id: e.id, nom: e.nom, echeance: echeanceProche.toISOString() });
      }

      // 2) Équipement en panne.
      if (e.etat === EtatEquipement.EN_PANNE) {
        enPanne.push({ id: e.id, nom: e.nom });
      }

      // 3) Coût de maintenance élevé.
      const coutTotal = e.entretiens.reduce((s, ent) => s + (ent.cout ? ent.cout.toNumber() : 0), 0);
      const seuil = e.coutAchat ? e.coutAchat.toNumber() * this.RATIO_COUT_ELEVE : this.SEUIL_COUT_ABSOLU;
      if (coutTotal > 0 && coutTotal >= seuil) {
        coutEleve.push({ id: e.id, nom: e.nom, coutTotal: Math.round(coutTotal * 100) / 100 });
      }

      // 4) Inutilisé trop longtemps (aucune utilisation récente).
      const derniere = e.utilisations[0]?.date ?? null;
      if (!derniere || derniere < seuilInutilise) {
        inutilise.push({ id: e.id, nom: e.nom, derniereUtilisation: derniere?.toISOString() ?? null });
      }
    }

    return {
      maintenanceAVenir,
      enPanne,
      coutEleve,
      inutilise,
      total: maintenanceAVenir.length + enPanne.length + coutEleve.length + inutilise.length,
    };
  }

  // ------------------------------------------------------------- STATISTIQUES
  async getStatistiques(fermeId: string) {
    const [total, parType, parEtat, agregatCout, pannes, equipements] = await this.prisma.$transaction([
      this.prisma.equipement.count({ where: { fermeId } }),
      this.prisma.equipement.groupBy({ by: ['type'], where: { fermeId }, _count: { type: true } }),
      this.prisma.equipement.groupBy({ by: ['etat'], where: { fermeId }, _count: { etat: true } }),
      this.prisma.entretienEquipement.aggregate({
        where: { equipement: { fermeId } },
        _sum: { cout: true },
        _avg: { cout: true },
        _count: true,
      }),
      this.prisma.entretienEquipement.count({ where: { equipement: { fermeId }, type: 'CORRECTIF' } }),
      // Pour le coût par équipement et les plus utilisés, on charge un résumé léger.
      this.prisma.equipement.findMany({
        where: { fermeId },
        select: {
          id: true,
          nom: true,
          entretiens: { select: { cout: true } },
          utilisations: { select: { heuresUtilisation: true } },
        },
      }),
    ]);

    // Coût total et heures par équipement (calcul en mémoire sur le résumé).
    const parEquipement = equipements
      .map((e) => ({
        id: e.id,
        nom: e.nom,
        coutMaintenance: Math.round(e.entretiens.reduce((s, x) => s + (x.cout ? x.cout.toNumber() : 0), 0) * 100) / 100,
        heuresUtilisation: Math.round(e.utilisations.reduce((s, x) => s + x.heuresUtilisation.toNumber(), 0) * 100) / 100,
      }));

    const plusUtilises = [...parEquipement]
      .filter((e) => e.heuresUtilisation > 0)
      .sort((a, b) => b.heuresUtilisation - a.heuresUtilisation)
      .slice(0, 5);

    const heuresTotal = parEquipement.reduce((s, e) => s + e.heuresUtilisation, 0);

    return {
      total,
      parType: parType.map((t) => ({ type: t.type, nombre: t._count.type })),
      parEtat: parEtat.map((e) => ({ etat: e.etat, nombre: e._count.etat })),
      coutTotalMaintenance: this.toNumber(agregatCout._sum.cout, true) ?? 0,
      coutMoyenMaintenance: this.toNumber(agregatCout._avg.cout, true) ?? 0,
      nbMaintenances: typeof agregatCout._count === 'number' ? agregatCout._count : 0,
      nbPannes: pannes,
      heuresUtilisationTotal: Math.round(heuresTotal * 100) / 100,
      coutParEquipement: parEquipement.filter((e) => e.coutMaintenance > 0).sort((a, b) => b.coutMaintenance - a.coutMaintenance).slice(0, 10),
      plusUtilises,
    };
  }

  private toNumber(valeur: Prisma.Decimal | null | undefined, nullable = false): number | null {
    if (valeur === null || valeur === undefined) return nullable ? null : 0;
    return valeur.toNumber();
  }
}

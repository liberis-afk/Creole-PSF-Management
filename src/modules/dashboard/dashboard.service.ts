import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  ActiviteRecenteDto,
  AlerteStockLigneDto,
  DashboardResponseDto,
  FinancesStatsDto,
  GraphiquesDto,
  IrrigationStatsDto,
  KpiDto,
  PointSerieDto,
  ProductionStatsDto,
  RhStatsDto,
  StocksStatsDto,
} from './dto/dashboard-response.dto';

/**
 * Agrège les données de tous les modules pour une ferme donnée.
 *
 * Principe directeur : ce service ne stocke RIEN et n'invente RIEN. Chaque
 * chiffre provient d'une requête Prisma réelle filtrée par fermeId. Tant
 * qu'un module métier (Cultures, Finances…) n'a pas alimenté ses tables, les
 * requêtes renvoient naturellement 0 ou des listes vides — le dashboard
 * s'affiche correctement, vide, et se remplira automatiquement à mesure que
 * les autres modules seront construits. Aucune donnée factice, aucun
 * hardcoding.
 *
 * Toutes les sections sont calculées en parallèle (Promise.all) : le temps de
 * réponse est celui de la requête la plus lente, pas la somme des dix.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(fermeId: string): Promise<DashboardResponseDto> {
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

    const [
      production,
      rh,
      finances,
      stocks,
      irrigation,
      graphiques,
      activitesRecentes,
      alertesStock,
    ] = await Promise.all([
      this.getProduction(fermeId),
      this.getRh(fermeId),
      this.getFinances(fermeId, debutMois),
      this.getStocks(fermeId),
      this.getIrrigation(fermeId),
      this.getGraphiques(fermeId),
      this.getActivitesRecentes(fermeId),
      this.getAlertesStock(fermeId),
    ]);

    // Les KPI dérivent de sections déjà calculées : on les compose ici plutôt
    // que de relancer des requêtes, pour ne pas payer deux fois le même coût.
    const kpis = this.calculerKpis(production, finances, rh);

    return {
      production,
      rh,
      finances,
      stocks,
      irrigation,
      graphiques,
      activitesRecentes,
      alertesStock,
      kpis,
      genereLe: maintenant.toISOString(),
    };
  }

  private async getProduction(fermeId: string): Promise<ProductionStatsDto> {
    const [culturesActives, aggCultures, parcellesCultivees, aggRecoltes] = await Promise.all([
      this.prisma.culture.count({ where: { fermeId, statut: 'ACTIVE' } }),
      this.prisma.culture.aggregate({
        where: { fermeId, statut: 'ACTIVE' },
        _sum: { rendementAttenduKg: true },
      }),
      // Superficie cultivée = somme des superficies des parcelles distinctes
      // portant au moins une culture active. On récupère les parcelles
      // concernées puis on somme leur superficie (une parcelle n'est comptée
      // qu'une fois même si elle porte plusieurs cultures).
      this.prisma.parcelle.findMany({
        where: { fermeId, cultures: { some: { statut: 'ACTIVE' } } },
        select: { superficieHa: true },
      }),
      this.prisma.recolte.aggregate({
        where: { fermeId },
        _sum: { rendementReel: true },
      }),
    ]);

    const superficieCultiveeHa = parcellesCultivees.reduce(
      (total, p) => total + this.toNumber(p.superficieHa),
      0,
    );

    return {
      culturesActives,
      superficieCultiveeHa,
      rendementEstimeKg: this.toNumber(aggCultures._sum.rendementAttenduKg),
      rendementReelKg: this.toNumber(aggRecoltes._sum.rendementReel),
    };
  }

  private async getRh(fermeId: string): Promise<RhStatsDto> {
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);

    const [presents, absents, activitesEnCours, effectifActif] = await Promise.all([
      this.prisma.presence.count({
        where: { fermeId, date: aujourdHui, statut: 'PRESENT' },
      }),
      this.prisma.presence.count({
        where: { fermeId, date: aujourdHui, statut: 'ABSENT' },
      }),
      this.prisma.calendrierActivite.count({
        where: { fermeId, statut: 'EN_COURS' },
      }),
      this.prisma.employe.count({ where: { fermeId, statut: 'ACTIF' } }),
    ]);

    return { employesPresents: presents, employesAbsents: absents, activitesEnCours, effectifActif };
  }

  private async getFinances(fermeId: string, debutMois: Date): Promise<FinancesStatsDto> {
    const [aggDepenses, aggRevenus, aggBudget, ferme] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { fermeId, type: 'DEPENSE', dateTransaction: { gte: debutMois } },
        _sum: { montant: true },
      }),
      this.prisma.transaction.aggregate({
        where: { fermeId, type: 'RECETTE', dateTransaction: { gte: debutMois } },
        _sum: { montant: true },
      }),
      this.prisma.budget.aggregate({
        where: { fermeId, periode: this.periodeCourante() },
        _sum: { montant: true },
      }),
      this.prisma.ferme.findUnique({ where: { id: fermeId }, select: { devise: true } }),
    ]);

    const depensesMois = this.toNumber(aggDepenses._sum.montant);
    const revenusMois = this.toNumber(aggRevenus._sum.montant);
    const budgetTotal = aggBudget._sum.montant;

    return {
      depensesMois,
      revenusMois,
      profitMois: revenusMois - depensesMois,
      // budgetRestant reste null si aucun budget n'est défini — l'UI affiche
      // alors "—" plutôt qu'un 0 trompeur qui suggérerait un budget épuisé.
      budgetRestant: budgetTotal === null ? null : this.toNumber(budgetTotal) - depensesMois,
      devise: ferme?.devise ?? 'HTG',
    };
  }

  private async getStocks(fermeId: string): Promise<StocksStatsDto> {
    const [articlesTotal, articlesCritiques, alertesActives] = await Promise.all([
      this.prisma.articleStock.count({ where: { fermeId } }),
      // "Critique" = quantité en stock <= seuil minimum. Prisma ne compare pas
      // deux colonnes entre elles dans un count() ; on passe par une requête
      // brute sécurisée (paramétrée) sur les deux colonnes de la même ligne.
      this.compterArticlesSousSeuil(fermeId),
      this.prisma.alerteStock.count({
        where: { article: { fermeId }, resolueLe: null },
      }),
    ]);

    return { articlesTotal, articlesCritiques, alertesActives };
  }

  private async getIrrigation(fermeId: string): Promise<IrrigationStatsDto> {
    const [aggEau, pompesActives, systemesActifs] = await Promise.all([
      this.prisma.relevePompe.aggregate({
        where: { pompe: { systemeIrrigation: { fermeId } } },
        _sum: { consommationEau: true },
      }),
      this.prisma.pompe.count({
        where: { systemeIrrigation: { fermeId }, statut: 'OPERATIONNEL' },
      }),
      this.prisma.systemeIrrigation.count({ where: { fermeId, statut: 'ACTIF' } }),
    ]);

    return {
      consommationEau: this.toNumber(aggEau._sum.consommationEau),
      pompesActives,
      systemesActifs,
    };
  }

  private async getGraphiques(fermeId: string): Promise<GraphiquesDto> {
    // 6 derniers mois. On calcule les bornes puis on agrège par mois côté
    // application à partir de requetes groupées — suffisant à ce volume et
    // portable (pas de SQL date_trunc spécifique au moteur).
    const mois = this.derniersMois(6);
    const debut = new Date(`${mois[0]}-01T00:00:00.000Z`);

    const [transactions, recoltes, releves] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { fermeId, dateTransaction: { gte: debut } },
        select: { type: true, montant: true, dateTransaction: true },
      }),
      this.prisma.recolte.findMany({
        where: { fermeId, dateRecolte: { gte: debut } },
        select: { quantite: true, dateRecolte: true },
      }),
      this.prisma.relevePompe.findMany({
        where: { pompe: { systemeIrrigation: { fermeId } }, date: { gte: debut } },
        select: { consommationEau: true, date: true },
      }),
    ]);

    const depensesMensuelles = this.grouperParMois(mois, transactions
      .filter((t) => t.type === 'DEPENSE')
      .map((t) => ({ date: t.dateTransaction, valeur: this.toNumber(t.montant) })));

    const revenusMensuels = this.grouperParMois(mois, transactions
      .filter((t) => t.type === 'RECETTE')
      .map((t) => ({ date: t.dateTransaction, valeur: this.toNumber(t.montant) })));

    const productionMensuelle = this.grouperParMois(mois, recoltes
      .map((r) => ({ date: r.dateRecolte, valeur: this.toNumber(r.quantite) })));

    const consommationEau = this.grouperParMois(mois, releves
      .map((r) => ({ date: r.date, valeur: this.toNumber(r.consommationEau) })));

    return { depensesMensuelles, revenusMensuels, productionMensuelle, consommationEau };
  }

  private async getActivitesRecentes(fermeId: string): Promise<ActiviteRecenteDto[]> {
    const activites = await this.prisma.calendrierActivite.findMany({
      where: { fermeId },
      orderBy: { dateProgrammee: 'desc' },
      take: 8,
      include: {
        responsable: { select: { prenom: true, nom: true } },
        parcelle: { select: { nom: true } },
      },
    });

    return activites.map((a) => ({
      id: a.id,
      titre: a.titre,
      type: a.type,
      priorite: a.priorite,
      statut: a.statut,
      dateProgrammee: a.dateProgrammee.toISOString(),
      responsable: a.responsable ? `${a.responsable.prenom} ${a.responsable.nom}` : null,
      parcelle: a.parcelle?.nom ?? null,
    }));
  }

  private async getAlertesStock(fermeId: string): Promise<AlerteStockLigneDto[]> {
    // Les articles réellement sous leur seuil, triés du plus critique au moins
    // critique. On récupère les articles sous seuil et on dérive le niveau.
    const articles = await this.prisma.$queryRaw<
      Array<{ id: string; nom: string; quantiteStock: Prisma.Decimal; seuilMinimum: Prisma.Decimal; unite: string }>
    >`
      SELECT id, nom, "quantiteStock", "seuilMinimum", unite
      FROM articles_stock
      WHERE "fermeId" = ${fermeId}
        AND "quantiteStock" <= "seuilMinimum"
      ORDER BY ("quantiteStock" - "seuilMinimum") ASC
      LIMIT 8
    `;

    return articles.map((a) => {
      const qte = this.toNumber(a.quantiteStock);
      const seuil = this.toNumber(a.seuilMinimum);
      return {
        id: a.id,
        article: a.nom,
        quantiteStock: qte,
        seuilMinimum: seuil,
        unite: a.unite,
        niveau: qte <= 0 ? 'RUPTURE' : qte <= seuil / 2 ? 'CRITIQUE' : 'BAS',
      };
    });
  }

  private calculerKpis(
    production: ProductionStatsDto,
    finances: FinancesStatsDto,
    rh: RhStatsDto,
  ): KpiDto {
    const ha = production.superficieCultiveeHa;
    // Division protégée : si la superficie ou l'effectif est nul, le KPI est
    // null (non calculable) plutôt que 0 ou Infinity — l'UI affiche "—".
    return {
      rendementParHa: ha > 0 ? production.rendementReelKg / ha : null,
      coutParHa: ha > 0 ? finances.depensesMois / ha : null,
      profitParHa: ha > 0 ? finances.profitMois / ha : null,
      productiviteEmployes:
        rh.effectifActif > 0 ? production.rendementReelKg / rh.effectifActif : null,
    };
  }

  // ----- Utilitaires privés -------------------------------------------------

  private async compterArticlesSousSeuil(fermeId: string): Promise<number> {
    const resultat = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM articles_stock
      WHERE "fermeId" = ${fermeId}
        AND "quantiteStock" <= "seuilMinimum"
    `;
    return Number(resultat[0]?.count ?? 0);
  }

  /** Convertit un Decimal Prisma (ou null) en nombre JS sûr. */
  private toNumber(valeur: Prisma.Decimal | number | null | undefined): number {
    if (valeur === null || valeur === undefined) return 0;
    return typeof valeur === 'number' ? valeur : valeur.toNumber();
  }

  /** Période courante au format YYYY-MM (clé des budgets mensuels). */
  private periodeCourante(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  /** Liste des N derniers mois (inclus le mois courant) au format YYYY-MM. */
  private derniersMois(n: number): string[] {
    const mois: string[] = [];
    const d = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      mois.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
    }
    return mois;
  }

  /** Agrège une liste (date, valeur) en points mensuels alignés sur `mois`. */
  private grouperParMois(
    mois: string[],
    donnees: Array<{ date: Date; valeur: number }>,
  ): PointSerieDto[] {
    const totaux = new Map<string, number>(mois.map((m) => [m, 0]));
    for (const { date, valeur } of donnees) {
      const cle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (totaux.has(cle)) {
        totaux.set(cle, (totaux.get(cle) ?? 0) + valeur);
      }
    }
    return mois.map((periode) => ({ periode, valeur: totaux.get(periode) ?? 0 }));
  }
}

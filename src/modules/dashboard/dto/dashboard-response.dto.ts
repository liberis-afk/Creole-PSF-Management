import { ApiProperty } from '@nestjs/swagger';

/**
 * Contrat de réponse de GET /dashboard. Ces classes servent à trois choses à
 * la fois : typer le retour du service, documenter automatiquement Swagger
 * (@ApiProperty), et — côté frontend — être la source de vérité des types
 * consommés par les composants. Une seule définition, aucune divergence
 * possible entre ce que le backend renvoie et ce que l'UI attend.
 *
 * Chaque section correspond à un bloc de la SFD Module 2.
 */

export class ProductionStatsDto {
  @ApiProperty({ description: 'Nombre de cultures au statut ACTIVE' })
  culturesActives!: number;

  @ApiProperty({ description: 'Somme des superficies (ha) des parcelles portant une culture active' })
  superficieCultiveeHa!: number;

  @ApiProperty({ description: 'Rendement attendu cumulé (kg) des cultures actives' })
  rendementEstimeKg!: number;

  @ApiProperty({ description: 'Rendement réel cumulé (kg) des récoltes de la période' })
  rendementReelKg!: number;
}

export class RhStatsDto {
  @ApiProperty() employesPresents!: number;
  @ApiProperty() employesAbsents!: number;
  @ApiProperty({ description: "Activités du calendrier au statut EN_COURS" })
  activitesEnCours!: number;
  @ApiProperty({ description: "Effectif actif total (référence pour le taux de présence)" })
  effectifActif!: number;
}

export class FinancesStatsDto {
  @ApiProperty({ description: 'Dépenses du mois en cours' })
  depensesMois!: number;
  @ApiProperty({ description: 'Revenus du mois en cours' })
  revenusMois!: number;
  @ApiProperty({ description: 'Profit = revenus - dépenses (mois en cours)' })
  profitMois!: number;
  @ApiProperty({ description: 'Budget restant (budget de la période - dépenses). Null si aucun budget défini.', nullable: true })
  budgetRestant!: number | null;
  @ApiProperty() devise!: string;
}

export class StocksStatsDto {
  @ApiProperty({ description: "Nombre d'articles en stock" })
  articlesTotal!: number;
  @ApiProperty({ description: "Articles dont la quantité <= seuil minimum" })
  articlesCritiques!: number;
  @ApiProperty({ description: 'Alertes de stock non résolues' })
  alertesActives!: number;
}

export class IrrigationStatsDto {
  @ApiProperty({ description: "Consommation d'eau cumulée de la période (unité selon relevés)" })
  consommationEau!: number;
  @ApiProperty({ description: 'Pompes au statut OPERATIONNEL' })
  pompesActives!: number;
  @ApiProperty({ description: 'Nombre de systèmes d’irrigation actifs' })
  systemesActifs!: number;
}

/** Un point de série temporelle générique (mois -> valeur). */
export class PointSerieDto {
  @ApiProperty({ example: '2026-01', description: 'Période au format YYYY-MM' })
  periode!: string;
  @ApiProperty() valeur!: number;
}

export class GraphiquesDto {
  @ApiProperty({ type: [PointSerieDto] }) depensesMensuelles!: PointSerieDto[];
  @ApiProperty({ type: [PointSerieDto] }) revenusMensuels!: PointSerieDto[];
  @ApiProperty({ type: [PointSerieDto] }) productionMensuelle!: PointSerieDto[];
  @ApiProperty({ type: [PointSerieDto] }) consommationEau!: PointSerieDto[];
}

export class ActiviteRecenteDto {
  @ApiProperty() id!: string;
  @ApiProperty() titre!: string;
  @ApiProperty({ enum: ['PLANTATION', 'SEMIS', 'FERTILISATION', 'IRRIGATION', 'DESHERBAGE', 'PULVERISATION', 'RECOLTE', 'TRANSPORT', 'MAINTENANCE', 'AUTRE'] })
  type!: string;
  @ApiProperty({ enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'] })
  priorite!: string;
  @ApiProperty({ enum: ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE', 'EN_RETARD'] })
  statut!: string;
  @ApiProperty() dateProgrammee!: string;
  @ApiProperty({ nullable: true }) responsable!: string | null;
  @ApiProperty({ nullable: true }) parcelle!: string | null;
}

export class AlerteStockLigneDto {
  @ApiProperty() id!: string;
  @ApiProperty() article!: string;
  @ApiProperty() quantiteStock!: number;
  @ApiProperty() seuilMinimum!: number;
  @ApiProperty() unite!: string;
  @ApiProperty({ enum: ['BAS', 'CRITIQUE', 'RUPTURE'] })
  niveau!: string;
}

export class KpiDto {
  @ApiProperty({ description: 'Rendement par hectare (kg/ha)', nullable: true })
  rendementParHa!: number | null;
  @ApiProperty({ description: 'Coût par hectare', nullable: true })
  coutParHa!: number | null;
  @ApiProperty({ description: 'Profit par hectare', nullable: true })
  profitParHa!: number | null;
  @ApiProperty({ description: "Productivité des employés (kg récoltés / employé actif)", nullable: true })
  productiviteEmployes!: number | null;
}

export class DashboardResponseDto {
  @ApiProperty() production!: ProductionStatsDto;
  @ApiProperty() rh!: RhStatsDto;
  @ApiProperty() finances!: FinancesStatsDto;
  @ApiProperty() stocks!: StocksStatsDto;
  @ApiProperty() irrigation!: IrrigationStatsDto;
  @ApiProperty() graphiques!: GraphiquesDto;
  @ApiProperty({ type: [ActiviteRecenteDto] }) activitesRecentes!: ActiviteRecenteDto[];
  @ApiProperty({ type: [AlerteStockLigneDto] }) alertesStock!: AlerteStockLigneDto[];
  @ApiProperty() kpis!: KpiDto;
  @ApiProperty({ description: 'Horodatage de génération (pour affichage "mis à jour à")' })
  genereLe!: string;
}

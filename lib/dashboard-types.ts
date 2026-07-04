/**
 * Miroir des DTO de réponse du backend (dashboard-response.dto.ts).
 * Idéalement généré depuis l'OpenAPI (packages/api-client, prévu dans
 * l'architecture) ; en attendant la mise en place de cette génération, on le
 * maintient à la main — c'est le seul type dupliqué, et il est isolé ici pour
 * être remplacé d'un bloc le jour où le client généré arrive.
 */

export interface PointSerie {
  periode: string;
  valeur: number;
}

export interface DashboardData {
  production: {
    culturesActives: number;
    superficieCultiveeHa: number;
    rendementEstimeKg: number;
    rendementReelKg: number;
  };
  rh: {
    employesPresents: number;
    employesAbsents: number;
    activitesEnCours: number;
    effectifActif: number;
  };
  finances: {
    depensesMois: number;
    revenusMois: number;
    profitMois: number;
    budgetRestant: number | null;
    devise: string;
  };
  stocks: {
    articlesTotal: number;
    articlesCritiques: number;
    alertesActives: number;
  };
  irrigation: {
    consommationEau: number;
    pompesActives: number;
    systemesActifs: number;
  };
  graphiques: {
    depensesMensuelles: PointSerie[];
    revenusMensuels: PointSerie[];
    productionMensuelle: PointSerie[];
    consommationEau: PointSerie[];
  };
  activitesRecentes: Array<{
    id: string;
    titre: string;
    type: string;
    priorite: string;
    statut: string;
    dateProgrammee: string;
    responsable: string | null;
    parcelle: string | null;
  }>;
  alertesStock: Array<{
    id: string;
    article: string;
    quantiteStock: number;
    seuilMinimum: number;
    unite: string;
    niveau: string;
  }>;
  kpis: {
    rendementParHa: number | null;
    coutParHa: number | null;
    profitParHa: number | null;
    productiviteEmployes: number | null;
  };
  genereLe: string;
}

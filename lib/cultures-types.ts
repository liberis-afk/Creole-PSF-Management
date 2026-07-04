/**
 * Types du module Cultures côté client. Miroir des réponses backend, maintenus
 * à la main en attendant la génération OpenAPI.
 */

export type StatutCulture = 'PLANIFIEE' | 'ACTIVE' | 'RECOLTEE' | 'ABANDONNEE';
export type StadeVegetatif = 'GERMINATION' | 'CROISSANCE' | 'FLORAISON' | 'FRUCTIFICATION' | 'MATURITE' | 'RECOLTE';
export type EtatSante = 'BONNE' | 'MOYENNE' | 'MAUVAISE' | 'CRITIQUE';
export type TypeTraitement = 'HERBICIDE' | 'INSECTICIDE' | 'FONGICIDE' | 'FERTILISANT' | 'AUTRE';

export interface ParcelleRef {
  id: string;
  nom: string;
  code: string;
  superficieHa?: number;
}

export interface CultureListItem {
  id: string;
  nom: string;
  variete: string | null;
  espece: string | null;
  statut: StatutCulture;
  datePlantation: string;
  dateRecoltePrevue: string | null;
  rendementAttenduKg: number | null;
  parcelle: ParcelleRef;
  nbSuivis: number;
  nbRecoltes: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CultureListResponse {
  donnees: CultureListItem[];
  pagination: Pagination;
}

export interface CultureDetail {
  id: string;
  nom: string;
  variete: string | null;
  espece: string | null;
  cycleJours: number | null;
  datePlantation: string;
  dateRecoltePrevue: string | null;
  dateRecolteReelle: string | null;
  espacementCm: number | null;
  densite: number | null;
  population: number | null;
  quantiteSemences: number | null;
  uniteSemences: string | null;
  rendementAttenduKg: number | null;
  statut: StatutCulture;
  parcelle: ParcelleRef;
  nbSuivis: number;
  nbTraitements: number;
  nbRecoltes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Statistiques {
  total: number;
  parStatut: Record<StatutCulture, number>;
  parEspece: Array<{ espece: string | null; nombre: number }>;
  rendementAttenduTotalKg: number;
  populationTotale: number;
  culturesActives: number;
  superficieCultiveeHa: number;
}

export interface Suivi {
  id: string;
  dateSuivi: string;
  stade: StadeVegetatif;
  etatSante: EtatSante;
  maladies: string[];
  ravageurs: string[];
  notes: string | null;
}

export interface Traitement {
  id: string;
  dateTraitement: string;
  type: TypeTraitement;
  produit: string;
  dose: number | null;
  unite: string | null;
  appliquePar: string | null;
  notes: string | null;
}

export interface Rendements {
  lignes: Array<{
    id: string;
    date: string;
    quantite: number;
    unite: string;
    rendementReel: number | null;
    qualite: string | null;
    destination: string;
  }>;
  totalRecolteKg: number;
}

export interface Calendrier {
  jalons: {
    plantation: string;
    recoltePrevue: string | null;
    recoltePrevueEstimee: boolean;
    recolteReelle: string | null;
  };
  cycleJours: number | null;
  progression: number | null;
  stadeActuel: { stade: StadeVegetatif; etatSante: EtatSante; date: string } | null;
  activites: Array<{ id: string; type: string; titre: string; date: string; statut: string; priorite: string }>;
}

export interface Photo {
  id: string;
  titre: string;
  typeMime: string | null;
  taille: number | null;
  url: string;
  createdAt: string;
}

export interface CultureInput {
  parcelleId: string;
  nom: string;
  variete?: string;
  espece?: string;
  cycleJours?: number;
  datePlantation: string;
  dateRecoltePrevue?: string;
  dateRecolteReelle?: string;
  espacementCm?: number;
  densite?: number;
  population?: number;
  quantiteSemences?: number;
  uniteSemences?: string;
  rendementAttenduKg?: number;
  statut?: StatutCulture;
}

export const LIBELLE_STATUT: Record<StatutCulture, string> = {
  PLANIFIEE: 'Planifiée',
  ACTIVE: 'Active',
  RECOLTEE: 'Récoltée',
  ABANDONNEE: 'Abandonnée',
};

export const LIBELLE_STADE: Record<StadeVegetatif, string> = {
  GERMINATION: 'Germination',
  CROISSANCE: 'Croissance',
  FLORAISON: 'Floraison',
  FRUCTIFICATION: 'Fructification',
  MATURITE: 'Maturité',
  RECOLTE: 'Récolte',
};

export const LIBELLE_SANTE: Record<EtatSante, string> = {
  BONNE: 'Bonne',
  MOYENNE: 'Moyenne',
  MAUVAISE: 'Mauvaise',
  CRITIQUE: 'Critique',
};

export const LIBELLE_TRAITEMENT: Record<TypeTraitement, string> = {
  HERBICIDE: 'Herbicide',
  INSECTICIDE: 'Insecticide',
  FONGICIDE: 'Fongicide',
  FERTILISANT: 'Fertilisant',
  AUTRE: 'Autre',
};

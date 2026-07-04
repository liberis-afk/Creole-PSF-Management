/**
 * Types du module Parcelles côté client. Maintenus à la main en attendant la
 * génération depuis l'OpenAPI (packages/api-client) ; isolés ici pour un
 * remplacement d'un bloc le moment venu.
 */

export type StatutParcelle = 'ACTIVE' | 'EN_JACHERE' | 'INACTIVE';
export type TypeDrainage = 'BON' | 'MOYEN' | 'FAIBLE' | 'STAGNANT';

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number];
}

/** Ligne de la liste paginée. */
export interface ParcelleListItem {
  id: string;
  nom: string;
  code: string;
  superficieHa: number;
  adresse: string | null;
  typeSol: string | null;
  drainage: TypeDrainage | null;
  statut: StatutParcelle;
  nbCultures: number;
  nbAnalyses: number;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ParcelleListResponse {
  donnees: ParcelleListItem[];
  pagination: Pagination;
}

/** Détail complet d'une parcelle. */
export interface ParcelleDetail {
  id: string;
  nom: string;
  code: string;
  superficieHa: number;
  adresse: string | null;
  altitude: number | null;
  typeSol: string | null;
  ph: number | null;
  matiereOrganique: number | null;
  texture: string | null;
  drainage: TypeDrainage | null;
  statut: StatutParcelle;
  contour: GeoJsonPolygon | null;
  centroide: GeoJsonPoint | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParcelleCarte {
  id: string;
  nom: string;
  code: string;
  statut: StatutParcelle;
  superficieHa: number;
  contour: GeoJsonPolygon | null;
  centroide: GeoJsonPoint | null;
}

export interface Photo {
  id: string;
  titre: string;
  typeMime: string | null;
  taille: number | null;
  latitude: number | null;
  longitude: number | null;
  url: string;
  createdAt: string;
}

export interface AnalyseSol {
  id: string;
  dateAnalyse: string;
  ph: number | null;
  matiereOrganique: number | null;
  azote: number | null;
  phosphore: number | null;
  potassium: number | null;
  texture: string | null;
  laboratoire: string | null;
  notes: string | null;
}

export interface Historique {
  culturesPrecedentes: Array<{
    id: string;
    nom: string;
    variete: string | null;
    datePlantation: string;
    dateRecolte: string | null;
    statut: string;
  }>;
  rendements: Array<{ id: string; date: string; quantite: number; unite: string; rendementReel: number | null }>;
  observationsSante: Array<{ id: string; date: string; etatSante: string; maladies: string[]; ravageurs: string[] }>;
  analysesSol: AnalyseSol[];
}

/** Payload d'écriture (create/update). */
export interface ParcelleInput {
  nom: string;
  code: string;
  superficieHa?: number;
  adresse?: string;
  altitude?: number;
  typeSol?: string;
  ph?: number;
  matiereOrganique?: number;
  texture?: string;
  drainage?: TypeDrainage;
  statut?: StatutParcelle;
  geometrie?: {
    contour?: GeoJsonPolygon;
    pointGps?: { lat: number; lng: number };
  };
}

export const LIBELLE_STATUT: Record<StatutParcelle, string> = {
  ACTIVE: 'Active',
  EN_JACHERE: 'En jachère',
  INACTIVE: 'Inactive',
};

export const LIBELLE_DRAINAGE: Record<TypeDrainage, string> = {
  BON: 'Bon',
  MOYEN: 'Moyen',
  FAIBLE: 'Faible',
  STAGNANT: 'Stagnant',
};

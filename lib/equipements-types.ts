/**
 * Types du module Équipements côté client. Miroir des réponses backend.
 */

export type TypeEquipement = 'TRACTEUR' | 'CAMION' | 'MOTO' | 'POMPE' | 'GENERATEUR' | 'OUTIL' | 'SYSTEME_IRRIGATION' | 'AUTRE';
export type EtatEquipement = 'NEUF' | 'BON' | 'MOYEN' | 'EN_PANNE';
export type TypeEntretien = 'PREVENTIF' | 'CORRECTIF';
export type StatutEntretien = 'PLANIFIE' | 'EN_COURS' | 'TERMINE';

export interface ResponsableRef {
  id: string;
  nom: string;
  fonction?: string;
}

export interface EquipementListItem {
  id: string;
  nom: string;
  type: TypeEquipement;
  etat: EtatEquipement;
  numeroSerie: string | null;
  marque: string | null;
  modele: string | null;
  dateAchat: string | null;
  coutAchat: number | null;
  localisation: string | null;
  responsable: { id: string; nom: string } | null;
  nbEntretiens: number;
  nbUtilisations: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EquipementListResponse {
  donnees: EquipementListItem[];
  pagination: Pagination;
}

export interface EquipementDetail {
  id: string;
  nom: string;
  type: TypeEquipement;
  marque: string | null;
  modele: string | null;
  numeroSerie: string | null;
  etat: EtatEquipement;
  statut: string;
  dateAchat: string | null;
  coutAchat: number | null;
  localisation: string | null;
  responsable: ResponsableRef | null;
  notes: string | null;
  nbEntretiens: number;
  nbUtilisations: number;
  createdAt: string;
  updatedAt: string;
}

export interface Entretien {
  id: string;
  type: TypeEntretien;
  statut: StatutEntretien;
  dateEntretien: string;
  description: string | null;
  cout: number | null;
  piecesUtilisees: string[];
  effectuePar: string | null;
  prochaineEcheance: string | null;
}

export interface Utilisation {
  id: string;
  date: string;
  heuresUtilisation: number;
  operateur: { id: string; nom: string } | null;
  notes: string | null;
}

export interface Historique {
  maintenances: Entretien[];
  utilisations: Array<{ id: string; date: string; heuresUtilisation: number; operateur: string | null; notes: string | null }>;
  resume: {
    coutTotalMaintenance: number;
    nbMaintenances: number;
    nbPannes: number;
    heuresUtilisationTotal: number;
  };
}

export interface Alertes {
  maintenanceAVenir: Array<{ id: string; nom: string; echeance: string }>;
  enPanne: Array<{ id: string; nom: string }>;
  coutEleve: Array<{ id: string; nom: string; coutTotal: number }>;
  inutilise: Array<{ id: string; nom: string; derniereUtilisation: string | null }>;
  total: number;
}

export interface Statistiques {
  total: number;
  parType: Array<{ type: TypeEquipement; nombre: number }>;
  parEtat: Array<{ etat: EtatEquipement; nombre: number }>;
  coutTotalMaintenance: number;
  coutMoyenMaintenance: number;
  nbMaintenances: number;
  nbPannes: number;
  heuresUtilisationTotal: number;
  coutParEquipement: Array<{ id: string; nom: string; coutMaintenance: number; heuresUtilisation: number }>;
  plusUtilises: Array<{ id: string; nom: string; coutMaintenance: number; heuresUtilisation: number }>;
}

export interface Photo {
  id: string;
  titre: string;
  typeMime: string | null;
  taille: number | null;
  url: string;
  createdAt: string;
}

export interface EquipementInput {
  nom: string;
  type: TypeEquipement;
  marque?: string;
  modele?: string;
  numeroSerie?: string;
  etat?: EtatEquipement;
  dateAchat?: string;
  coutAchat?: number;
  localisation?: string;
  responsableId?: string;
  notes?: string;
}

export const LIBELLE_TYPE: Record<TypeEquipement, string> = {
  TRACTEUR: 'Tracteur',
  CAMION: 'Camion',
  MOTO: 'Moto',
  POMPE: 'Pompe',
  GENERATEUR: 'Générateur',
  OUTIL: 'Outil',
  SYSTEME_IRRIGATION: "Système d'irrigation",
  AUTRE: 'Autre',
};

export const LIBELLE_ETAT: Record<EtatEquipement, string> = {
  NEUF: 'Neuf',
  BON: 'Bon',
  MOYEN: 'Moyen',
  EN_PANNE: 'En panne',
};

export const LIBELLE_TYPE_ENTRETIEN: Record<TypeEntretien, string> = {
  PREVENTIF: 'Préventif',
  CORRECTIF: 'Correctif',
};

export const LIBELLE_STATUT_ENTRETIEN: Record<StatutEntretien, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
};

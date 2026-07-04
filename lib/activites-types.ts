/**
 * Types du module Activités (Calendrier agricole) côté client.
 */

export type TypeActivite =
  | 'PLANTATION' | 'SEMIS' | 'FERTILISATION' | 'IRRIGATION' | 'DESHERBAGE'
  | 'PULVERISATION' | 'RECOLTE' | 'TRANSPORT' | 'MAINTENANCE' | 'AUTRE';
export type StatutActivite = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE' | 'EN_RETARD';
export type PrioriteActivite = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';

export interface Ref { id: string; nom: string }

export interface ActiviteListItem {
  id: string;
  titre: string;
  type: TypeActivite;
  dateProgrammee: string;
  dateFin: string | null;
  heureProgrammee: string | null;
  priorite: PrioriteActivite;
  statut: StatutActivite;
  enRetard: boolean;
  cout: number | null;
  responsable: Ref | null;
  parcelle: Ref | null;
  culture: Ref | null;
  nbEmployes: number;
  nbCommentaires: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ActiviteListResponse {
  donnees: ActiviteListItem[];
  pagination: Pagination;
}

export interface EmployeAffecte { id: string; nom: string; fonction: string }

export interface ActiviteDetail {
  id: string;
  titre: string;
  type: TypeActivite;
  description: string | null;
  dateProgrammee: string;
  dateFin: string | null;
  heureProgrammee: string | null;
  priorite: PrioriteActivite;
  statut: StatutActivite;
  enRetard: boolean;
  cout: number | null;
  responsable: Ref | null;
  parcelle: (Ref & { code?: string }) | null;
  culture: Ref | null;
  employes: EmployeAffecte[];
  nbCommentaires: number;
  termineeLe: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActiviteCalendrier {
  id: string;
  titre: string;
  type: TypeActivite;
  priorite: PrioriteActivite;
  statut: StatutActivite;
  enRetard: boolean;
  dateProgrammee: string;
  dateFin: string | null;
  heureProgrammee: string | null;
}

export interface Commentaire {
  id: string;
  contenu: string;
  auteur: Ref | null;
  createdAt: string;
}

export interface PieceJointe {
  id: string;
  titre: string;
  type: string;
  estImage: boolean;
  typeMime: string | null;
  taille: number | null;
  url: string;
  createdAt: string;
}

export interface Statistiques {
  total: number;
  parStatut: Array<{ statut: StatutActivite; nombre: number }>;
  parType: Array<{ type: TypeActivite; nombre: number }>;
  aVenir7Jours: number;
  enRetard: number;
}

export interface ActiviteInput {
  titre: string;
  type: TypeActivite;
  description?: string;
  dateProgrammee: string;
  dateFin?: string;
  heureProgrammee?: string;
  priorite?: PrioriteActivite;
  statut?: StatutActivite;
  cout?: number;
  responsableId?: string;
  parcelleId?: string;
  cultureId?: string;
  employeIds?: string[];
}

export const LIBELLE_TYPE: Record<TypeActivite, string> = {
  PLANTATION: 'Plantation',
  SEMIS: 'Semis',
  FERTILISATION: 'Fertilisation',
  IRRIGATION: 'Irrigation',
  DESHERBAGE: 'Désherbage',
  PULVERISATION: 'Pulvérisation',
  RECOLTE: 'Récolte',
  TRANSPORT: 'Transport',
  MAINTENANCE: 'Maintenance',
  AUTRE: 'Autre',
};

export const LIBELLE_STATUT: Record<StatutActivite, string> = {
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
  EN_RETARD: 'En retard',
};

export const LIBELLE_PRIORITE: Record<PrioriteActivite, string> = {
  BASSE: 'Basse',
  NORMALE: 'Normale',
  HAUTE: 'Haute',
  URGENTE: 'Urgente',
};

/** Couleur associée à chaque type (pastilles du calendrier). */
export const COULEUR_TYPE: Record<TypeActivite, string> = {
  PLANTATION: '#16a34a',
  SEMIS: '#65a30d',
  FERTILISATION: '#ca8a04',
  IRRIGATION: '#0891b2',
  DESHERBAGE: '#9333ea',
  PULVERISATION: '#c026d3',
  RECOLTE: '#ea580c',
  TRANSPORT: '#2563eb',
  MAINTENANCE: '#64748b',
  AUTRE: '#6b7280',
};

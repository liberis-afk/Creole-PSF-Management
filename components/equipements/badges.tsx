import type { EtatEquipement, StatutEntretien, TypeEntretien } from '@/lib/equipements-types';
import { LIBELLE_ETAT, LIBELLE_STATUT_ENTRETIEN, LIBELLE_TYPE_ENTRETIEN } from '@/lib/equipements-types';

const COULEURS_ETAT: Record<EtatEquipement, string> = {
  NEUF: 'bg-brand-50 text-brand-700 dark:bg-brand-600/10 dark:text-brand-200',
  BON: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  MOYEN: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  EN_PANNE: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
};

const COULEURS_STATUT_ENTRETIEN: Record<StatutEntretien, string> = {
  PLANIFIE: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  EN_COURS: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  TERMINE: 'bg-brand-50 text-brand-700 dark:bg-brand-600/10 dark:text-brand-200',
};

export function EtatBadge({ etat }: { etat: EtatEquipement }) {
  return <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${COULEURS_ETAT[etat]}`}>{LIBELLE_ETAT[etat]}</span>;
}

export function StatutEntretienBadge({ statut }: { statut: StatutEntretien }) {
  return <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${COULEURS_STATUT_ENTRETIEN[statut]}`}>{LIBELLE_STATUT_ENTRETIEN[statut]}</span>;
}

export function TypeEntretienBadge({ type }: { type: TypeEntretien }) {
  const couleur = type === 'CORRECTIF'
    ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
  return <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${couleur}`}>{LIBELLE_TYPE_ENTRETIEN[type]}</span>;
}

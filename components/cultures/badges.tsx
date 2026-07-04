import type { StatutCulture, EtatSante } from '@/lib/cultures-types';
import { LIBELLE_STATUT, LIBELLE_SANTE } from '@/lib/cultures-types';

const COULEURS_STATUT: Record<StatutCulture, string> = {
  PLANIFIEE: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  ACTIVE: 'bg-brand-50 text-brand-700 dark:bg-brand-600/10 dark:text-brand-200',
  RECOLTEE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  ABANDONNEE: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
};

const COULEURS_SANTE: Record<EtatSante, string> = {
  BONNE: 'bg-brand-50 text-brand-700 dark:bg-brand-600/10 dark:text-brand-200',
  MOYENNE: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  MAUVAISE: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  CRITIQUE: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
};

export function StatutBadge({ statut }: { statut: StatutCulture }) {
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${COULEURS_STATUT[statut]}`}>
      {LIBELLE_STATUT[statut]}
    </span>
  );
}

export function SanteBadge({ etat }: { etat: EtatSante }) {
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${COULEURS_SANTE[etat]}`}>
      {LIBELLE_SANTE[etat]}
    </span>
  );
}

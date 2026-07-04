import type { PrioriteActivite, StatutActivite, TypeActivite } from '@/lib/activites-types';
import { LIBELLE_STATUT, LIBELLE_PRIORITE, LIBELLE_TYPE, COULEUR_TYPE } from '@/lib/activites-types';

const COULEURS_STATUT: Record<StatutActivite, string> = {
  PLANIFIEE: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  EN_COURS: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  TERMINEE: 'bg-brand-50 text-brand-700 dark:bg-brand-600/10 dark:text-brand-200',
  ANNULEE: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  EN_RETARD: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
};

const COULEURS_PRIORITE: Record<PrioriteActivite, string> = {
  BASSE: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  NORMALE: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  HAUTE: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  URGENTE: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
};

export function StatutBadge({ statut }: { statut: StatutActivite }) {
  return <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${COULEURS_STATUT[statut]}`}>{LIBELLE_STATUT[statut]}</span>;
}

export function PrioriteBadge({ priorite }: { priorite: PrioriteActivite }) {
  return <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${COULEURS_PRIORITE[priorite]}`}>{LIBELLE_PRIORITE[priorite]}</span>;
}

export function TypeBadge({ type }: { type: TypeActivite }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COULEUR_TYPE[type] }} />
      {LIBELLE_TYPE[type]}
    </span>
  );
}

export function RetardBadge() {
  return <span className="inline-block rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">En retard</span>;
}

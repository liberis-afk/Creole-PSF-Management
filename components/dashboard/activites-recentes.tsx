'use client';

import { CalendarClock } from 'lucide-react';
import type { DashboardData } from '@/lib/dashboard-types';
import { formaterDateCourte } from './format';

type Activite = DashboardData['activitesRecentes'][number];

const COULEUR_STATUT: Record<string, string> = {
  PLANIFIEE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  EN_COURS: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  TERMINEE: 'bg-brand-50 text-brand-700 dark:bg-brand-600/10 dark:text-brand-200',
  ANNULEE: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500',
  EN_RETARD: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
};

const LIBELLE_STATUT: Record<string, string> = {
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
  EN_RETARD: 'En retard',
};

export function ActivitesRecentes({ activites, chargement }: { activites: Activite[]; chargement?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
        <CalendarClock className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Activités récentes</h3>
      </div>

      {chargement ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />
          ))}
        </div>
      ) : activites.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          Aucune activité enregistrée pour le moment.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {activites.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{a.titre}</p>
                <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                  {formaterDateCourte(a.dateProgrammee)}
                  {a.parcelle ? ` · ${a.parcelle}` : ''}
                  {a.responsable ? ` · ${a.responsable}` : ''}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                  COULEUR_STATUT[a.statut] ?? COULEUR_STATUT.PLANIFIEE
                }`}
              >
                {LIBELLE_STATUT[a.statut] ?? a.statut}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

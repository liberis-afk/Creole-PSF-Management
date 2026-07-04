'use client';

import type { DashboardData } from '@/lib/dashboard-types';
import { formaterOuTiret } from './format';

/**
 * Bandeau compact des KPI de la section ANALYSES de la SFD. Présentés
 * ensemble car ce sont des ratios dérivés (par hectare, par employé) qui se
 * lisent en groupe. Les valeurs null s'affichent "—" : elles ne sont pas
 * calculables tant que la superficie cultivée ou l'effectif est nul.
 */
export function BandeauKpi({ kpis, devise, chargement }: { kpis: DashboardData['kpis']; devise: string; chargement?: boolean }) {
  const items = [
    { label: 'Rendement / ha', valeur: formaterOuTiret(kpis.rendementParHa, ' kg') },
    { label: 'Coût / ha', valeur: kpis.coutParHa === null ? '—' : `${formaterOuTiret(kpis.coutParHa)} ${devise}` },
    { label: 'Profit / ha', valeur: kpis.profitParHa === null ? '—' : `${formaterOuTiret(kpis.profitParHa)} ${devise}` },
    { label: 'Productivité employés', valeur: formaterOuTiret(kpis.productiviteEmployes, ' kg') },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 dark:border-gray-800 dark:bg-gray-800 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white p-4 dark:bg-gray-950">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{item.label}</p>
          {chargement ? (
            <div className="mt-2 h-6 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          ) : (
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{item.valeur}</p>
          )}
        </div>
      ))}
    </div>
  );
}

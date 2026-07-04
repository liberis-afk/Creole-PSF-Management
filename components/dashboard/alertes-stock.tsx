'use client';

import { PackageX } from 'lucide-react';
import type { DashboardData } from '@/lib/dashboard-types';
import { formaterNombre } from './format';

type AlerteStock = DashboardData['alertesStock'][number];

const COULEUR_NIVEAU: Record<string, string> = {
  RUPTURE: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  CRITIQUE: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  BAS: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

const LIBELLE_NIVEAU: Record<string, string> = {
  RUPTURE: 'Rupture',
  CRITIQUE: 'Critique',
  BAS: 'Bas',
};

/**
 * Tableau des articles sous leur seuil. Rendu en table HTML sémantique
 * (thead/tbody) — approprié pour des données tabulaires et accessible aux
 * lecteurs d'écran, contrairement à une grille de div.
 */
export function AlertesStock({ alertes, chargement }: { alertes: AlerteStock[]; chargement?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
        <PackageX className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Stocks critiques</h3>
      </div>

      {chargement ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />
          ))}
        </div>
      ) : alertes.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          Aucun article sous son seuil. Tout va bien.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 dark:text-gray-500">
              <th className="px-5 py-2 font-medium">Article</th>
              <th className="px-5 py-2 text-right font-medium">Stock</th>
              <th className="px-5 py-2 text-right font-medium">Seuil</th>
              <th className="px-5 py-2 text-right font-medium">Niveau</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {alertes.map((a) => (
              <tr key={a.id}>
                <td className="px-5 py-2.5 font-medium text-gray-900 dark:text-white">{a.article}</td>
                <td className="px-5 py-2.5 text-right text-gray-600 dark:text-gray-300">
                  {formaterNombre(a.quantiteStock)} {a.unite}
                </td>
                <td className="px-5 py-2.5 text-right text-gray-400 dark:text-gray-500">
                  {formaterNombre(a.seuilMinimum)} {a.unite}
                </td>
                <td className="px-5 py-2.5 text-right">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                      COULEUR_NIVEAU[a.niveau] ?? COULEUR_NIVEAU.BAS
                    }`}
                  >
                    {LIBELLE_NIVEAU[a.niveau] ?? a.niveau}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

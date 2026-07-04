'use client';

import { useEffect, useState } from 'react';
import { Wrench, AlertTriangle, Clock, Coins } from 'lucide-react';
import type { Statistiques } from '@/lib/equipements-types';
import { LIBELLE_TYPE } from '@/lib/equipements-types';

const devise = (n: number) => `${n.toLocaleString('fr-FR')} HTG`;

/**
 * Statistiques agrégées des équipements (coûts, pannes, utilisation). Données
 * réelles chargées depuis /equipements/statistiques.
 */
export function StatistiquesEquipements({ actualiser }: { actualiser: number }) {
  const [stats, setStats] = useState<Statistiques | null>(null);

  useEffect(() => {
    fetch('/api/equipements/statistiques', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null));
  }, [actualiser]);

  const cartes = [
    { icone: Wrench, label: 'Équipements', valeur: stats ? String(stats.total) : '—' },
    { icone: AlertTriangle, label: 'Pannes cumulées', valeur: stats ? String(stats.nbPannes) : '—', alerte: (stats?.nbPannes ?? 0) > 0 },
    { icone: Coins, label: 'Coût maintenance', valeur: stats ? devise(stats.coutTotalMaintenance) : '—' },
    { icone: Clock, label: 'Heures d\'utilisation', valeur: stats ? `${stats.heuresUtilisationTotal.toLocaleString('fr-FR')} h` : '—' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cartes.map((c) => (
        <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center gap-1.5 text-gray-400">
            <c.icone className="h-4 w-4" />
            <span className="text-xs">{c.label}</span>
          </div>
          <p className={`mt-1 text-xl font-semibold ${c.alerte ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{c.valeur}</p>
        </div>
      ))}

      {stats && (stats.parType.length > 0 || stats.plusUtilises.length > 0) && (
        <div className="col-span-2 grid grid-cols-1 gap-4 lg:col-span-4 lg:grid-cols-2">
          {stats.parType.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Répartition par type</p>
              <div className="flex flex-wrap gap-2">
                {stats.parType.map((t) => (
                  <span key={t.type} className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                    {LIBELLE_TYPE[t.type]} : <strong>{t.nombre}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
          {stats.plusUtilises.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Les plus utilisés</p>
              <ul className="space-y-1">
                {stats.plusUtilises.map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 dark:text-gray-300">{e.nom}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{e.heuresUtilisation.toLocaleString('fr-FR')} h</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

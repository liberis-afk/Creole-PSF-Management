'use client';

import { useEffect, useState } from 'react';
import { Sprout, Activity, Ruler, Scale } from 'lucide-react';
import type { Statistiques } from '@/lib/cultures-types';
import { LIBELLE_STATUT } from '@/lib/cultures-types';

/**
 * Bandeau de statistiques agrégées, chargé depuis /cultures/statistiques.
 * Données 100 % réelles : tant qu'aucune culture n'existe, tout est à zéro et
 * se remplit automatiquement.
 */
export function StatistiquesCultures({ actualiser }: { actualiser: number }) {
  const [stats, setStats] = useState<Statistiques | null>(null);

  useEffect(() => {
    fetch('/api/cultures/statistiques', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null));
  }, [actualiser]);

  const cartes = [
    { icone: Sprout, label: 'Cultures', valeur: stats ? String(stats.total) : '—', ton: 'text-brand-600' },
    { icone: Activity, label: 'Actives', valeur: stats ? String(stats.culturesActives) : '—', ton: 'text-brand-600' },
    { icone: Ruler, label: 'Superficie cultivée', valeur: stats ? `${stats.superficieCultiveeHa.toLocaleString('fr-FR')} ha` : '—', ton: 'text-gray-700 dark:text-gray-200' },
    { icone: Scale, label: 'Rendement attendu', valeur: stats ? `${stats.rendementAttenduTotalKg.toLocaleString('fr-FR')} kg` : '—', ton: 'text-gray-700 dark:text-gray-200' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cartes.map((c) => (
        <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center gap-1.5 text-gray-400">
            <c.icone className="h-4 w-4" />
            <span className="text-xs">{c.label}</span>
          </div>
          <p className={`mt-1 text-xl font-semibold ${c.ton}`}>{c.valeur}</p>
        </div>
      ))}

      {stats && stats.parEspece.length > 0 && (
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 lg:col-span-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Répartition</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(stats.parStatut) as Array<keyof typeof stats.parStatut>)
              .filter((s) => stats.parStatut[s] > 0)
              .map((s) => (
                <span key={s} className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                  {LIBELLE_STATUT[s]} : <strong>{stats.parStatut[s]}</strong>
                </span>
              ))}
            {stats.parEspece.map((e) => (
              <span key={e.espece} className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs text-brand-700 dark:bg-brand-600/10 dark:text-brand-200">
                {e.espece} : <strong>{e.nombre}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

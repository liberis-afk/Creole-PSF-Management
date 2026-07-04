'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, Sprout, Wheat, CheckCircle2 } from 'lucide-react';
import type { Calendrier } from '@/lib/cultures-types';
import { LIBELLE_STADE, LIBELLE_SANTE } from '@/lib/cultures-types';

const dateFr = (iso: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));

/**
 * Calendrier cultural : frise de vie calculée (plantation → récolte), barre de
 * progression sur le cycle, stade actuel, et activités liées (lecture seule).
 * Toutes les valeurs viennent du backend qui les calcule ; ce composant ne fait
 * que présenter.
 */
export function CalendrierCultural({ cultureId }: { cultureId: string }) {
  const [data, setData] = useState<Calendrier | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    fetch(`/api/cultures/${cultureId}/calendrier`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setChargement(false));
  }, [cultureId]);

  if (chargement) {
    return <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900" />;
  }
  if (!data) return null;

  const jalons = [
    { icone: Sprout, label: 'Plantation', date: data.jalons.plantation, ton: 'text-brand-600' },
    {
      icone: Wheat,
      label: data.jalons.recoltePrevueEstimee ? 'Récolte prévue (estimée)' : 'Récolte prévue',
      date: data.jalons.recoltePrevue,
      ton: 'text-amber-600',
    },
    { icone: CheckCircle2, label: 'Récolte réelle', date: data.jalons.recolteReelle, ton: 'text-gray-600 dark:text-gray-300' },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Calendrier cultural</h3>
      </div>

      {/* Jalons */}
      <div className="grid grid-cols-3 gap-3">
        {jalons.map((j) => (
          <div key={j.label} className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
            <div className={`flex items-center gap-1.5 ${j.ton}`}>
              <j.icone className="h-4 w-4" />
              <span className="text-xs text-gray-400">{j.label}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{j.date ? dateFr(j.date) : '—'}</p>
          </div>
        ))}
      </div>

      {/* Progression */}
      {data.progression !== null && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Progression du cycle{data.cycleJours ? ` (${data.cycleJours} j)` : ''}</span>
            <span className="font-medium">{data.progression}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${data.progression}%` }} />
          </div>
        </div>
      )}

      {/* Stade actuel */}
      {data.stadeActuel && (
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900">
          <span className="text-gray-500 dark:text-gray-400">Stade actuel :</span>
          <span className="font-medium text-gray-900 dark:text-white">{LIBELLE_STADE[data.stadeActuel.stade]}</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className="text-gray-500 dark:text-gray-400">Santé : {LIBELLE_SANTE[data.stadeActuel.etatSante]}</span>
        </div>
      )}

      {/* Activités liées (lecture seule) */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Activités planifiées</p>
        {data.activites.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Aucune activité liée à cette culture.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.activites.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-900 dark:text-white">
                  {a.titre} <span className="text-xs text-gray-400">· {a.type.toLowerCase()}</span>
                </span>
                <span className="text-xs text-gray-400">{dateFr(a.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

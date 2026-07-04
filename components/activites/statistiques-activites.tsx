'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Statistiques } from '@/lib/activites-types';

/** Statistiques des activités : total, à venir (7 j), en retard, terminées. */
export function StatistiquesActivites({ actualiser }: { actualiser: number }) {
  const [stats, setStats] = useState<Statistiques | null>(null);

  useEffect(() => {
    fetch('/api/activites/statistiques', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null));
  }, [actualiser]);

  const terminees = stats?.parStatut.find((s) => s.statut === 'TERMINEE')?.nombre ?? 0;

  const cartes = [
    { icone: CalendarDays, label: 'Activités', valeur: stats ? String(stats.total) : '—' },
    { icone: Clock, label: 'À venir (7 j)', valeur: stats ? String(stats.aVenir7Jours) : '—' },
    { icone: AlertTriangle, label: 'En retard', valeur: stats ? String(stats.enRetard) : '—', alerte: (stats?.enRetard ?? 0) > 0 },
    { icone: CheckCircle2, label: 'Terminées', valeur: stats ? String(terminees) : '—' },
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
    </div>
  );
}

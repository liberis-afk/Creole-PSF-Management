'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CalendarClock, WrenchIcon, Coins, PauseCircle } from 'lucide-react';
import type { Alertes } from '@/lib/equipements-types';

const dateFr = (iso: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));

/**
 * Panneau des 4 alertes calculées côté serveur. N'affiche que les catégories
 * non vides ; masqué complètement s'il n'y a aucune alerte (pas de bruit
 * visuel inutile).
 */
export function AlertesPanel({ actualiser }: { actualiser: number }) {
  const [alertes, setAlertes] = useState<Alertes | null>(null);

  useEffect(() => {
    fetch('/api/equipements/alertes', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setAlertes)
      .catch(() => setAlertes(null));
  }, [actualiser]);

  if (!alertes || alertes.total === 0) return null;

  const sections = [
    { cle: 'maintenanceAVenir', titre: 'Maintenance à venir', icone: CalendarClock, ton: 'text-amber-600', items: alertes.maintenanceAVenir.map((a) => ({ id: a.id, nom: a.nom, detail: dateFr(a.echeance) })) },
    { cle: 'enPanne', titre: 'En panne', icone: WrenchIcon, ton: 'text-red-600', items: alertes.enPanne.map((a) => ({ id: a.id, nom: a.nom, detail: '' })) },
    { cle: 'coutEleve', titre: 'Coût de maintenance élevé', icone: Coins, ton: 'text-orange-600', items: alertes.coutEleve.map((a) => ({ id: a.id, nom: a.nom, detail: `${a.coutTotal.toLocaleString('fr-FR')} HTG` })) },
    { cle: 'inutilise', titre: 'Inutilisé depuis longtemps', icone: PauseCircle, ton: 'text-gray-500', items: alertes.inutilise.map((a) => ({ id: a.id, nom: a.nom, detail: a.derniereUtilisation ? `dès ${dateFr(a.derniereUtilisation)}` : 'jamais utilisé' })) },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Alertes ({alertes.total})</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <div key={s.cle} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
            <div className={`mb-1.5 flex items-center gap-1.5 ${s.ton}`}>
              <s.icone className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{s.titre}</span>
            </div>
            <ul className="space-y-1">
              {s.items.slice(0, 5).map((it) => (
                <li key={it.id} className="flex items-center justify-between text-sm">
                  <Link href={`/equipements/${it.id}`} className="text-gray-700 hover:text-brand-700 dark:text-gray-300 dark:hover:text-brand-200">{it.nom}</Link>
                  {it.detail && <span className="text-xs text-gray-400">{it.detail}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

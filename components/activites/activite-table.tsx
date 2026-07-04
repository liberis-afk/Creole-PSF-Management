'use client';

import Link from 'next/link';
import { ArrowUpDown, CalendarDays, Users } from 'lucide-react';
import type { ActiviteListItem } from '@/lib/activites-types';
import { StatutBadge, PrioriteBadge, TypeBadge, RetardBadge } from './badges';

interface TableProps {
  activites: ActiviteListItem[];
  chargement: boolean;
  tri: string;
  ordre: 'asc' | 'desc';
  onTri: (colonne: string) => void;
}

const dateFr = (iso: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));

function EnteteTriable({ label, colonne, tri, ordre, onTri }: { label: string; colonne: string; tri: string; ordre: string; onTri: (c: string) => void }) {
  const actif = tri === colonne;
  return (
    <th className="px-4 py-3 text-left font-medium">
      <button onClick={() => onTri(colonne)} className={`inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 ${actif ? 'text-gray-700 dark:text-gray-200' : ''}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ${actif ? 'opacity-100' : 'opacity-40'}`} />
        {actif && <span className="text-xs">{ordre === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  );
}

export function ActiviteTable({ activites, chargement, tri, ordre, onTri }: TableProps) {
  if (chargement) {
    return (
      <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />)}
      </div>
    );
  }

  if (activites.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-950">
        <CalendarDays className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Aucune activité ne correspond à ces critères.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
          <tr>
            <EnteteTriable label="Activité" colonne="titre" tri={tri} ordre={ordre} onTri={onTri} />
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <EnteteTriable label="Date" colonne="dateProgrammee" tri={tri} ordre={ordre} onTri={onTri} />
            <th className="px-4 py-3 text-left font-medium">Responsable</th>
            <th className="px-4 py-3 text-left font-medium">Rattachement</th>
            <EnteteTriable label="Priorité" colonne="priorite" tri={tri} ordre={ordre} onTri={onTri} />
            <th className="px-4 py-3 text-left font-medium">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {activites.map((a) => (
            <tr key={a.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="px-4 py-3">
                <Link href={`/calendrier/${a.id}`} className="font-medium text-gray-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-200">
                  {a.titre}
                </Link>
                {a.nbEmployes > 0 && (
                  <p className="flex items-center gap-1 text-xs text-gray-400"><Users className="h-3 w-3" />{a.nbEmployes}</p>
                )}
              </td>
              <td className="px-4 py-3"><TypeBadge type={a.type} /></td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                {dateFr(a.dateProgrammee)}
                {a.heureProgrammee ? <span className="text-xs text-gray-400"> · {a.heureProgrammee}</span> : ''}
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{a.responsable?.nom ?? '—'}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{a.parcelle?.nom ?? a.culture?.nom ?? '—'}</td>
              <td className="px-4 py-3"><PrioriteBadge priorite={a.priorite} /></td>
              <td className="px-4 py-3">{a.enRetard ? <RetardBadge /> : <StatutBadge statut={a.statut} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

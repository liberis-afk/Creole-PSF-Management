'use client';

import Link from 'next/link';
import { ArrowUpDown, Sprout } from 'lucide-react';
import type { CultureListItem } from '@/lib/cultures-types';
import { StatutBadge } from './badges';

interface TableProps {
  cultures: CultureListItem[];
  chargement: boolean;
  tri: string;
  ordre: 'asc' | 'desc';
  onTri: (colonne: string) => void;
}

function EnteteTriable({ label, colonne, tri, ordre, onTri, align = 'left' }: { label: string; colonne: string; tri: string; ordre: string; onTri: (c: string) => void; align?: 'left' | 'right' }) {
  const actif = tri === colonne;
  return (
    <th className={`px-4 py-3 font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button onClick={() => onTri(colonne)} className={`inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 ${actif ? 'text-gray-700 dark:text-gray-200' : ''}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ${actif ? 'opacity-100' : 'opacity-40'}`} />
        {actif && <span className="text-xs">{ordre === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  );
}

const dateFr = (iso: string | null) => (iso ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso)) : '—');

export function CultureTable({ cultures, chargement, tri, ordre, onTri }: TableProps) {
  if (chargement) {
    return (
      <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />
        ))}
      </div>
    );
  }

  if (cultures.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-950">
        <Sprout className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Aucune culture ne correspond à ces critères.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
          <tr>
            <EnteteTriable label="Nom" colonne="nom" tri={tri} ordre={ordre} onTri={onTri} />
            <th className="px-4 py-3 text-left font-medium">Parcelle</th>
            <th className="px-4 py-3 text-left font-medium">Espèce / variété</th>
            <EnteteTriable label="Plantation" colonne="datePlantation" tri={tri} ordre={ordre} onTri={onTri} />
            <EnteteTriable label="Récolte prévue" colonne="dateRecoltePrevue" tri={tri} ordre={ordre} onTri={onTri} />
            <th className="px-4 py-3 text-right font-medium">Rdt attendu</th>
            <EnteteTriable label="Statut" colonne="statut" tri={tri} ordre={ordre} onTri={onTri} />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {cultures.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="px-4 py-3">
                <Link href={`/cultures/${c.id}`} className="font-medium text-gray-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-200">
                  {c.nom}
                </Link>
                {(c.nbSuivis > 0 || c.nbRecoltes > 0) && (
                  <p className="text-xs text-gray-400">
                    {c.nbSuivis > 0 ? `${c.nbSuivis} suivi${c.nbSuivis > 1 ? 's' : ''}` : ''}
                    {c.nbSuivis > 0 && c.nbRecoltes > 0 ? ' · ' : ''}
                    {c.nbRecoltes > 0 ? `${c.nbRecoltes} récolte${c.nbRecoltes > 1 ? 's' : ''}` : ''}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                <Link href={`/parcelles/${c.parcelle.id}`} className="hover:text-brand-700 dark:hover:text-brand-200">
                  {c.parcelle.nom}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                {c.espece ?? '—'}
                {c.variete ? <span className="text-gray-400"> · {c.variete}</span> : ''}
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{dateFr(c.datePlantation)}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{dateFr(c.dateRecoltePrevue)}</td>
              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                {c.rendementAttenduKg !== null ? `${c.rendementAttenduKg.toLocaleString('fr-FR')} kg` : '—'}
              </td>
              <td className="px-4 py-3"><StatutBadge statut={c.statut} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ArrowUpDown, Wrench } from 'lucide-react';
import type { EquipementListItem } from '@/lib/equipements-types';
import { LIBELLE_TYPE } from '@/lib/equipements-types';
import { EtatBadge } from './badges';

interface TableProps {
  equipements: EquipementListItem[];
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

export function EquipementTable({ equipements, chargement, tri, ordre, onTri }: TableProps) {
  if (chargement) {
    return (
      <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />
        ))}
      </div>
    );
  }

  if (equipements.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-950">
        <Wrench className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Aucun équipement ne correspond à ces critères.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
          <tr>
            <EnteteTriable label="Nom" colonne="nom" tri={tri} ordre={ordre} onTri={onTri} />
            <EnteteTriable label="Type" colonne="type" tri={tri} ordre={ordre} onTri={onTri} />
            <th className="px-4 py-3 text-left font-medium">N° série</th>
            <th className="px-4 py-3 text-left font-medium">Responsable</th>
            <th className="px-4 py-3 text-left font-medium">Localisation</th>
            <EnteteTriable label="Acquisition" colonne="dateAchat" tri={tri} ordre={ordre} onTri={onTri} />
            <EnteteTriable label="État" colonne="etat" tri={tri} ordre={ordre} onTri={onTri} />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {equipements.map((e) => (
            <tr key={e.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="px-4 py-3">
                <Link href={`/equipements/${e.id}`} className="font-medium text-gray-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-200">
                  {e.nom}
                </Link>
                {(e.marque || e.modele) && (
                  <p className="text-xs text-gray-400">{[e.marque, e.modele].filter(Boolean).join(' ')}</p>
                )}
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{LIBELLE_TYPE[e.type]}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{e.numeroSerie ?? '—'}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{e.responsable?.nom ?? '—'}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{e.localisation ?? '—'}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{dateFr(e.dateAchat)}</td>
              <td className="px-4 py-3"><EtatBadge etat={e.etat} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

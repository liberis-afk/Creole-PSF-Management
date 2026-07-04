'use client';

import { Search } from 'lucide-react';
import { LIBELLE_TYPE, LIBELLE_STATUT, LIBELLE_PRIORITE } from '@/lib/activites-types';

interface FiltresProps {
  recherche: string;
  onRecherche: (v: string) => void;
  type: string;
  onType: (v: string) => void;
  statut: string;
  onStatut: (v: string) => void;
  priorite: string;
  onPriorite: (v: string) => void;
  enRetard: boolean;
  onEnRetard: (v: boolean) => void;
}

const classeSelect =
  'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200';

export function ActiviteFiltres({ recherche, onRecherche, type, onType, statut, onStatut, priorite, onPriorite, enRetard, onEnRetard }: FiltresProps) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative flex-1 lg:min-w-[240px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={recherche}
          onChange={(e) => onRecherche(e.target.value)}
          placeholder="Rechercher une activité…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-gray-400 focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
        />
      </div>

      <select value={type} onChange={(e) => onType(e.target.value)} className={classeSelect} aria-label="Filtrer par type">
        <option value="">Tous les types</option>
        {Object.entries(LIBELLE_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>

      <select value={statut} onChange={(e) => onStatut(e.target.value)} className={classeSelect} aria-label="Filtrer par statut">
        <option value="">Tous les statuts</option>
        {Object.entries(LIBELLE_STATUT).filter(([k]) => k !== 'EN_RETARD').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>

      <select value={priorite} onChange={(e) => onPriorite(e.target.value)} className={classeSelect} aria-label="Filtrer par priorité">
        <option value="">Toutes priorités</option>
        {Object.entries(LIBELLE_PRIORITE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>

      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
        <input type="checkbox" checked={enRetard} onChange={(e) => onEnRetard(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
        En retard
      </label>
    </div>
  );
}

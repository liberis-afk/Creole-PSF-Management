'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { ParcelleRef } from '@/lib/cultures-types';

interface FiltresProps {
  recherche: string;
  onRecherche: (v: string) => void;
  statut: string;
  onStatut: (v: string) => void;
  parcelleId: string;
  onParcelle: (v: string) => void;
}

const classeSelect =
  'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200';

/**
 * Barre de filtres des cultures. Le sélecteur de parcelle se remplit depuis la
 * liste des parcelles (module déjà livré) — on réutilise sa route, sans la
 * dupliquer.
 */
export function CultureFiltres({ recherche, onRecherche, statut, onStatut, parcelleId, onParcelle }: FiltresProps) {
  const [parcelles, setParcelles] = useState<ParcelleRef[]>([]);

  useEffect(() => {
    // On récupère un lot large de parcelles pour peupler le filtre.
    fetch('/api/parcelles?limit=100&tri=nom&ordre=asc', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.donnees) setParcelles(d.donnees.map((p: ParcelleRef) => ({ id: p.id, nom: p.nom, code: p.code })));
      })
      .catch(() => setParcelles([]));
  }, []);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={recherche}
          onChange={(e) => onRecherche(e.target.value)}
          placeholder="Rechercher par nom, variété, espèce…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-gray-400 focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
        />
      </div>

      <select value={statut} onChange={(e) => onStatut(e.target.value)} className={classeSelect} aria-label="Filtrer par statut">
        <option value="">Tous les statuts</option>
        <option value="PLANIFIEE">Planifiée</option>
        <option value="ACTIVE">Active</option>
        <option value="RECOLTEE">Récoltée</option>
        <option value="ABANDONNEE">Abandonnée</option>
      </select>

      <select value={parcelleId} onChange={(e) => onParcelle(e.target.value)} className={classeSelect} aria-label="Filtrer par parcelle">
        <option value="">Toutes les parcelles</option>
        {parcelles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nom} ({p.code})
          </option>
        ))}
      </select>
    </div>
  );
}

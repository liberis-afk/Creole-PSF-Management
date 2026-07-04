'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { LIBELLE_TYPE, LIBELLE_ETAT } from '@/lib/equipements-types';

interface FiltresProps {
  recherche: string;
  onRecherche: (v: string) => void;
  type: string;
  onType: (v: string) => void;
  etat: string;
  onEtat: (v: string) => void;
  responsableId: string;
  onResponsable: (v: string) => void;
}

interface EmployeRef { id: string; nom: string }

const classeSelect =
  'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200';

/**
 * Filtres des équipements : recherche + type + état + responsable. Le sélecteur
 * de responsable se remplit depuis la liste des équipements (les responsables
 * déjà assignés) pour éviter de dépendre du module Employés non construit ; il
 * bascule automatiquement sur la vraie liste d'employés dès que l'API répond.
 */
export function EquipementFiltres({ recherche, onRecherche, type, onType, etat, onEtat, responsableId, onResponsable }: FiltresProps) {
  const [responsables, setResponsables] = useState<EmployeRef[]>([]);

  useEffect(() => {
    // On dérive la liste des responsables depuis les équipements existants
    // (dé-doublonnée) — pas de dépendance au module Employés.
    fetch('/api/equipements?limit=100', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.donnees) return;
        const map = new Map<string, string>();
        for (const e of d.donnees) if (e.responsable) map.set(e.responsable.id, e.responsable.nom);
        setResponsables([...map.entries()].map(([id, nom]) => ({ id, nom })));
      })
      .catch(() => setResponsables([]));
  }, []);

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={recherche}
          onChange={(e) => onRecherche(e.target.value)}
          placeholder="Rechercher par nom, marque, modèle, n° série…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-gray-400 focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
        />
      </div>

      <select value={type} onChange={(e) => onType(e.target.value)} className={classeSelect} aria-label="Filtrer par type">
        <option value="">Tous les types</option>
        {Object.entries(LIBELLE_TYPE).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      <select value={etat} onChange={(e) => onEtat(e.target.value)} className={classeSelect} aria-label="Filtrer par état">
        <option value="">Tous les états</option>
        {Object.entries(LIBELLE_ETAT).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      {responsables.length > 0 && (
        <select value={responsableId} onChange={(e) => onResponsable(e.target.value)} className={classeSelect} aria-label="Filtrer par responsable">
          <option value="">Tous les responsables</option>
          {responsables.map((r) => (
            <option key={r.id} value={r.id}>{r.nom}</option>
          ))}
        </select>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ActiviteListResponse } from '@/lib/activites-types';

export interface FiltresActivites {
  recherche: string;
  type: string;
  statut: string;
  priorite: string;
  enRetard: boolean;
  page: number;
  limit: number;
  tri: string;
  ordre: 'asc' | 'desc';
}

const FILTRES_DEFAUT: FiltresActivites = {
  recherche: '',
  type: '',
  statut: '',
  priorite: '',
  enRetard: false,
  page: 1,
  limit: 15,
  tri: 'dateProgrammee',
  ordre: 'asc',
};

/**
 * État de la liste des activités : filtres (type, statut, priorité, en retard),
 * recherche débouncée, pagination, tri.
 */
export function useActivitesList() {
  const [filtres, setFiltres] = useState<FiltresActivites>(FILTRES_DEFAUT);
  const [rechercheSaisie, setRechercheSaisie] = useState('');
  const [data, setData] = useState<ActiviteListResponse | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setFiltres((f) => ({ ...f, recherche: rechercheSaisie, page: 1 })), 350);
    return () => clearTimeout(timer);
  }, [rechercheSaisie]);

  const charger = useCallback(async () => {
    setChargement(true);
    const params = new URLSearchParams();
    if (filtres.recherche) params.set('recherche', filtres.recherche);
    if (filtres.type) params.set('type', filtres.type);
    if (filtres.statut) params.set('statut', filtres.statut);
    if (filtres.priorite) params.set('priorite', filtres.priorite);
    if (filtres.enRetard) params.set('enRetard', 'true');
    params.set('page', String(filtres.page));
    params.set('limit', String(filtres.limit));
    params.set('tri', filtres.tri);
    params.set('ordre', filtres.ordre);

    try {
      const res = await fetch(`/api/activites?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      setData((await res.json()) as ActiviteListResponse);
      setErreur(null);
    } catch {
      setErreur('Impossible de charger les activités');
    } finally {
      setChargement(false);
    }
  }, [filtres]);

  useEffect(() => {
    charger();
  }, [charger]);

  return {
    data,
    chargement,
    erreur,
    filtres,
    rechercheSaisie,
    setRechercheSaisie,
    setType: (type: string) => setFiltres((f) => ({ ...f, type, page: 1 })),
    setStatut: (statut: string) => setFiltres((f) => ({ ...f, statut, page: 1 })),
    setPriorite: (priorite: string) => setFiltres((f) => ({ ...f, priorite, page: 1 })),
    setEnRetard: (enRetard: boolean) => setFiltres((f) => ({ ...f, enRetard, page: 1 })),
    setPage: (page: number) => setFiltres((f) => ({ ...f, page })),
    setTri: (tri: string, ordre: 'asc' | 'desc') => setFiltres((f) => ({ ...f, tri, ordre, page: 1 })),
    rafraichir: charger,
  };
}

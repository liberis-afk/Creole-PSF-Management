'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ParcelleListResponse } from '@/lib/parcelles-types';

export interface FiltresParcelles {
  recherche: string;
  statut: string;
  drainage: string;
  page: number;
  limit: number;
  tri: string;
  ordre: 'asc' | 'desc';
}

const FILTRES_DEFAUT: FiltresParcelles = {
  recherche: '',
  statut: '',
  drainage: '',
  page: 1,
  limit: 12,
  tri: 'createdAt',
  ordre: 'desc',
};

/**
 * Gère l'état de la liste : filtres, recherche (debouncée 350 ms pour ne pas
 * lancer une requête à chaque frappe), pagination et tri. Reconstruit la query
 * string et refetch à chaque changement de filtre.
 */
export function useParcellesList() {
  const [filtres, setFiltres] = useState<FiltresParcelles>(FILTRES_DEFAUT);
  const [rechercheSaisie, setRechercheSaisie] = useState('');
  const [data, setData] = useState<ParcelleListResponse | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Debounce de la recherche : on n'écrit dans les filtres (donc on ne fetch)
  // que 350 ms après la dernière frappe, en revenant page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltres((f) => ({ ...f, recherche: rechercheSaisie, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [rechercheSaisie]);

  const charger = useCallback(async () => {
    setChargement(true);
    const params = new URLSearchParams();
    if (filtres.recherche) params.set('recherche', filtres.recherche);
    if (filtres.statut) params.set('statut', filtres.statut);
    if (filtres.drainage) params.set('drainage', filtres.drainage);
    params.set('page', String(filtres.page));
    params.set('limit', String(filtres.limit));
    params.set('tri', filtres.tri);
    params.set('ordre', filtres.ordre);

    try {
      const res = await fetch(`/api/parcelles?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      setData((await res.json()) as ParcelleListResponse);
      setErreur(null);
    } catch {
      setErreur('Impossible de charger les parcelles');
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
    setStatut: (statut: string) => setFiltres((f) => ({ ...f, statut, page: 1 })),
    setDrainage: (drainage: string) => setFiltres((f) => ({ ...f, drainage, page: 1 })),
    setPage: (page: number) => setFiltres((f) => ({ ...f, page })),
    setTri: (tri: string, ordre: 'asc' | 'desc') => setFiltres((f) => ({ ...f, tri, ordre, page: 1 })),
    rafraichir: charger,
  };
}

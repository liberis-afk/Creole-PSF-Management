'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CultureListResponse } from '@/lib/cultures-types';

export interface FiltresCultures {
  recherche: string;
  statut: string;
  parcelleId: string;
  page: number;
  limit: number;
  tri: string;
  ordre: 'asc' | 'desc';
}

const FILTRES_DEFAUT: FiltresCultures = {
  recherche: '',
  statut: '',
  parcelleId: '',
  page: 1,
  limit: 12,
  tri: 'datePlantation',
  ordre: 'desc',
};

/**
 * État de la liste des cultures : filtres, recherche debouncée (350 ms),
 * pagination, tri. Même schéma que useParcellesList — les deux pourront être
 * généralisés en un hook de liste réutilisable plus tard.
 */
export function useCulturesList() {
  const [filtres, setFiltres] = useState<FiltresCultures>(FILTRES_DEFAUT);
  const [rechercheSaisie, setRechercheSaisie] = useState('');
  const [data, setData] = useState<CultureListResponse | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

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
    if (filtres.parcelleId) params.set('parcelleId', filtres.parcelleId);
    params.set('page', String(filtres.page));
    params.set('limit', String(filtres.limit));
    params.set('tri', filtres.tri);
    params.set('ordre', filtres.ordre);

    try {
      const res = await fetch(`/api/cultures?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      setData((await res.json()) as CultureListResponse);
      setErreur(null);
    } catch {
      setErreur('Impossible de charger les cultures');
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
    setParcelle: (parcelleId: string) => setFiltres((f) => ({ ...f, parcelleId, page: 1 })),
    setPage: (page: number) => setFiltres((f) => ({ ...f, page })),
    setTri: (tri: string, ordre: 'asc' | 'desc') => setFiltres((f) => ({ ...f, tri, ordre, page: 1 })),
    rafraichir: charger,
  };
}

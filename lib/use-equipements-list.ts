'use client';

import { useCallback, useEffect, useState } from 'react';
import type { EquipementListResponse } from '@/lib/equipements-types';

export interface FiltresEquipements {
  recherche: string;
  type: string;
  etat: string;
  responsableId: string;
  page: number;
  limit: number;
  tri: string;
  ordre: 'asc' | 'desc';
}

const FILTRES_DEFAUT: FiltresEquipements = {
  recherche: '',
  type: '',
  etat: '',
  responsableId: '',
  page: 1,
  limit: 12,
  tri: 'dateAchat',
  ordre: 'desc',
};

/**
 * État de la liste des équipements : filtres (type, état, responsable),
 * recherche débouncée (350 ms), pagination, tri. Même schéma que les modules
 * précédents.
 */
export function useEquipementsList() {
  const [filtres, setFiltres] = useState<FiltresEquipements>(FILTRES_DEFAUT);
  const [rechercheSaisie, setRechercheSaisie] = useState('');
  const [data, setData] = useState<EquipementListResponse | null>(null);
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
    if (filtres.type) params.set('type', filtres.type);
    if (filtres.etat) params.set('etat', filtres.etat);
    if (filtres.responsableId) params.set('responsableId', filtres.responsableId);
    params.set('page', String(filtres.page));
    params.set('limit', String(filtres.limit));
    params.set('tri', filtres.tri);
    params.set('ordre', filtres.ordre);

    try {
      const res = await fetch(`/api/equipements?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      setData((await res.json()) as EquipementListResponse);
      setErreur(null);
    } catch {
      setErreur('Impossible de charger les équipements');
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
    setEtat: (etat: string) => setFiltres((f) => ({ ...f, etat, page: 1 })),
    setResponsable: (responsableId: string) => setFiltres((f) => ({ ...f, responsableId, page: 1 })),
    setPage: (page: number) => setFiltres((f) => ({ ...f, page })),
    setTri: (tri: string, ordre: 'asc' | 'desc') => setFiltres((f) => ({ ...f, tri, ordre, page: 1 })),
    rafraichir: charger,
  };
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DashboardData } from '@/lib/dashboard-types';

interface EtatDashboard {
  data: DashboardData | null;
  chargementInitial: boolean;
  enRafraichissement: boolean;
  erreur: string | null;
  rafraichir: () => void;
}

/**
 * Rend le dashboard "dynamique" côté client : charge les données puis les
 * rafraîchit à intervalle régulier (défaut 60 s). C'est l'approche
 * pragmatique adaptée aux connexions faibles visées par la SFD — un vrai push
 * WebSocket temps réel viendra avec le Module 16 (Notifications), qui portera
 * déjà la passerelle temps réel ; il suffira alors de déclencher rafraichir()
 * sur l'événement plutôt qu'au minuteur.
 *
 * Distinction volontaire chargementInitial / enRafraichissement : au premier
 * chargement on montre des squelettes ; lors des rafraîchissements suivants on
 * garde les données affichées (pas de clignotement), avec un discret
 * indicateur de mise à jour.
 */
export function useDashboard(intervalleMs = 60_000): EtatDashboard {
  const [data, setData] = useState<DashboardData | null>(null);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [enRafraichissement, setEnRafraichissement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const dejaCharge = useRef(false);

  const charger = useCallback(async () => {
    if (dejaCharge.current) setEnRafraichissement(true);
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!res.ok) throw new Error('Réponse non OK');
      const json = (await res.json()) as DashboardData;
      setData(json);
      setErreur(null);
    } catch {
      // On n'efface pas les données déjà affichées en cas d'échec d'un
      // rafraîchissement : mieux vaut des chiffres légèrement datés qu'un
      // écran vide. L'erreur n'est signalée franchement qu'au tout premier
      // chargement.
      if (!dejaCharge.current) setErreur('Impossible de charger le tableau de bord');
    } finally {
      setChargementInitial(false);
      setEnRafraichissement(false);
      dejaCharge.current = true;
    }
  }, []);

  useEffect(() => {
    charger();
    const timer = setInterval(charger, intervalleMs);
    return () => clearInterval(timer);
  }, [charger, intervalleMs]);

  return { data, chargementInitial, enRafraichissement, erreur, rafraichir: charger };
}

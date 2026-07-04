'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ActiviteCalendrier } from '@/lib/activites-types';
import { COULEUR_TYPE, LIBELLE_TYPE } from '@/lib/activites-types';

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Clé locale AAAA-MM-JJ (sans décalage de fuseau). */
function cleJour(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Grille calendrier mensuelle : 6 semaines à partir du lundi. Les activités
 * sont posées sur chaque jour couvert par leur période [début, fin]. Composant
 * autonome, sans dépendance externe. Le clic sur une activité ouvre son détail ;
 * le clic sur un jour vide propose d'en créer une (via onCreer).
 */
export function CalendrierVue({ onCreer, actualiser }: { onCreer?: (dateISO: string) => void; actualiser: number }) {
  const router = useRouter();
  const [curseur, setCurseur] = useState(() => new Date());
  const [activites, setActivites] = useState<ActiviteCalendrier[]>([]);
  const [chargement, setChargement] = useState(true);

  // Bornes de la grille : du lundi précédant le 1er, sur 42 jours.
  const { debutGrille, jours } = useMemo(() => {
    const premier = new Date(curseur.getFullYear(), curseur.getMonth(), 1);
    const decalage = (premier.getDay() + 6) % 7; // lundi = 0
    const debut = new Date(premier);
    debut.setDate(premier.getDate() - decalage);
    const liste: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(debut);
      d.setDate(debut.getDate() + i);
      liste.push(d);
    }
    return { debutGrille: debut, jours: liste };
  }, [curseur]);

  useEffect(() => {
    const fin = new Date(debutGrille);
    fin.setDate(debutGrille.getDate() + 41);
    const params = new URLSearchParams({ debut: cleJour(debutGrille), fin: cleJour(fin) });
    setChargement(true);
    fetch(`/api/activites/calendrier?${params.toString()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then(setActivites)
      .catch(() => setActivites([]))
      .finally(() => setChargement(false));
  }, [debutGrille, actualiser]);

  // Indexe les activités par jour couvert.
  const parJour = useMemo(() => {
    const map = new Map<string, ActiviteCalendrier[]>();
    for (const a of activites) {
      const debut = new Date(a.dateProgrammee);
      const fin = a.dateFin ? new Date(a.dateFin) : debut;
      const d = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate());
      const dernier = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
      while (d <= dernier) {
        const cle = cleJour(d);
        if (!map.has(cle)) map.set(cle, []);
        map.get(cle)!.push(a);
        d.setDate(d.getDate() + 1);
      }
    }
    return map;
  }, [activites]);

  const cleAujourdhui = cleJour(new Date());
  const moisCourant = curseur.getMonth();

  function changerMois(delta: number) {
    setCurseur((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      {/* Barre de navigation */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          {MOIS[moisCourant]} {curseur.getFullYear()}
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurseur(new Date())} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900">
            Aujourd&apos;hui
          </button>
          <button onClick={() => changerMois(-1)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Mois précédent">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => changerMois(1)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Mois suivant">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* En-tête des jours */}
      <div className="grid grid-cols-7 border-b border-gray-100 text-center text-xs font-medium text-gray-400 dark:border-gray-800">
        {JOURS.map((j) => <div key={j} className="py-2">{j}</div>)}
      </div>

      {/* Grille */}
      <div className={`grid grid-cols-7 ${chargement ? 'opacity-50' : ''}`}>
        {jours.map((jour) => {
          const cle = cleJour(jour);
          const duJour = parJour.get(cle) ?? [];
          const horsMois = jour.getMonth() !== moisCourant;
          const estAujourdhui = cle === cleAujourdhui;
          return (
            <div
              key={cle}
              className={`min-h-[92px] border-b border-r border-gray-100 p-1.5 dark:border-gray-800 ${horsMois ? 'bg-gray-50/50 dark:bg-gray-900/30' : ''}`}
            >
              <button
                onClick={() => onCreer?.(cle)}
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${estAujourdhui ? 'bg-brand-600 font-semibold text-white' : horsMois ? 'text-gray-300 dark:text-gray-600' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}
                title="Créer une activité ce jour"
              >
                {jour.getDate()}
              </button>
              <div className="space-y-1">
                {duJour.slice(0, 3).map((a) => (
                  <button
                    key={a.id + cle}
                    onClick={() => router.push(`/calendrier/${a.id}`)}
                    className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] hover:opacity-80"
                    style={{ backgroundColor: `${COULEUR_TYPE[a.type]}1a`, color: COULEUR_TYPE[a.type] }}
                    title={`${LIBELLE_TYPE[a.type]} — ${a.titre}${a.enRetard ? ' (en retard)' : ''}`}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: COULEUR_TYPE[a.type] }} />
                    <span className="truncate">{a.heureProgrammee ? `${a.heureProgrammee} ` : ''}{a.titre}</span>
                  </button>
                ))}
                {duJour.length > 3 && (
                  <p className="px-1 text-[10px] text-gray-400">+{duJour.length - 3} autre{duJour.length - 3 > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-gray-100 px-4 py-2 dark:border-gray-800">
        {Object.entries(LIBELLE_TYPE).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COULEUR_TYPE[k as keyof typeof COULEUR_TYPE] }} />
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Plus, List, CalendarDays } from 'lucide-react';
import { useActivitesList } from '@/lib/use-activites-list';
import { StatistiquesActivites } from '@/components/activites/statistiques-activites';
import { ActiviteFiltres } from '@/components/activites/activite-filtres';
import { ActiviteTable } from '@/components/activites/activite-table';
import { CalendrierVue } from '@/components/activites/calendrier-vue';
import { ActiviteForm } from '@/components/activites/activite-form';
import { PaginationControl } from '@/components/parcelles/pagination-control';

type Vue = 'calendrier' | 'liste';

/**
 * Page principale du calendrier agricole. Bascule entre la vue calendrier
 * (grille mensuelle) et la vue liste (table filtrable). Le formulaire de
 * création est partagé ; un clic sur un jour du calendrier pré-remplit la date.
 */
export default function CalendrierPage() {
  const {
    data, chargement, erreur, filtres,
    rechercheSaisie, setRechercheSaisie, setType, setStatut, setPriorite, setEnRetard, setPage, setTri, rafraichir,
  } = useActivitesList();

  const [vue, setVue] = useState<Vue>('calendrier');
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [dateInitiale, setDateInitiale] = useState<string | undefined>();
  const [version, setVersion] = useState(0);

  function basculerTri(colonne: string) {
    const ordre = filtres.tri === colonne && filtres.ordre === 'asc' ? 'desc' : 'asc';
    setTri(colonne, ordre);
  }

  function ouvrirCreation(date?: string) {
    setDateInitiale(date);
    setFormulaireOuvert(true);
  }

  function apresEnregistrement() {
    setFormulaireOuvert(false);
    setDateInitiale(undefined);
    rafraichir();
    setVersion((v) => v + 1);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Calendrier agricole</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Planifiez et suivez les activités : plantation, irrigation, récolte, maintenance…
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bascule de vue */}
          <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-800">
            <button
              onClick={() => setVue('calendrier')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium ${vue === 'calendrier' ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <CalendarDays className="h-4 w-4" /> Calendrier
            </button>
            <button
              onClick={() => setVue('liste')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium ${vue === 'liste' ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <List className="h-4 w-4" /> Liste
            </button>
          </div>
          <button onClick={() => ouvrirCreation()} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" />
            Nouvelle activité
          </button>
        </div>
      </div>

      <StatistiquesActivites actualiser={version} />

      {vue === 'calendrier' ? (
        <CalendrierVue actualiser={version} onCreer={ouvrirCreation} />
      ) : (
        <>
          <ActiviteFiltres
            recherche={rechercheSaisie}
            onRecherche={setRechercheSaisie}
            type={filtres.type}
            onType={setType}
            statut={filtres.statut}
            onStatut={setStatut}
            priorite={filtres.priorite}
            onPriorite={setPriorite}
            enRetard={filtres.enRetard}
            onEnRetard={setEnRetard}
          />
          {erreur ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              {erreur}
            </div>
          ) : (
            <>
              <ActiviteTable
                activites={data?.donnees ?? []}
                chargement={chargement}
                tri={filtres.tri}
                ordre={filtres.ordre}
                onTri={basculerTri}
              />
              {data && <PaginationControl pagination={data.pagination} onPage={setPage} libelle="activité" />}
            </>
          )}
        </>
      )}

      {formulaireOuvert && (
        <ActiviteForm
          dateInitiale={dateInitiale}
          onFerme={() => { setFormulaireOuvert(false); setDateInitiale(undefined); }}
          onEnregistre={apresEnregistrement}
        />
      )}
    </div>
  );
}

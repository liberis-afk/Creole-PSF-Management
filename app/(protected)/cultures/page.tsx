'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCulturesList } from '@/lib/use-cultures-list';
import { StatistiquesCultures } from '@/components/cultures/statistiques-cultures';
import { CultureFiltres } from '@/components/cultures/culture-filtres';
import { CultureTable } from '@/components/cultures/culture-table';
import { CultureForm } from '@/components/cultures/culture-form';
import { PaginationControl } from '@/components/parcelles/pagination-control';

/**
 * Page liste des cultures. Assemble le bandeau de statistiques, les filtres, la
 * table triable, la pagination (réutilisée du module Parcelles) et le
 * formulaire de création en modale.
 */
export default function CulturesPage() {
  const {
    data, chargement, erreur, filtres,
    rechercheSaisie, setRechercheSaisie, setStatut, setParcelle, setPage, setTri, rafraichir,
  } = useCulturesList();

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  // Compteur pour forcer le rechargement des statistiques après une création.
  const [versionStats, setVersionStats] = useState(0);

  function basculerTri(colonne: string) {
    const ordre = filtres.tri === colonne && filtres.ordre === 'asc' ? 'desc' : 'asc';
    setTri(colonne, ordre);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Cultures</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Suivez vos cultures, leur cycle, leur santé et leurs rendements.
          </p>
        </div>
        <button
          onClick={() => setFormulaireOuvert(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle culture
        </button>
      </div>

      <StatistiquesCultures actualiser={versionStats} />

      <CultureFiltres
        recherche={rechercheSaisie}
        onRecherche={setRechercheSaisie}
        statut={filtres.statut}
        onStatut={setStatut}
        parcelleId={filtres.parcelleId}
        onParcelle={setParcelle}
      />

      {erreur ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {erreur}
        </div>
      ) : (
        <>
          <CultureTable
            cultures={data?.donnees ?? []}
            chargement={chargement}
            tri={filtres.tri}
            ordre={filtres.ordre}
            onTri={basculerTri}
          />
          {data && <PaginationControl pagination={data.pagination} onPage={setPage} libelle="culture" />}
        </>
      )}

      {formulaireOuvert && (
        <CultureForm
          onFerme={() => setFormulaireOuvert(false)}
          onEnregistre={() => {
            setFormulaireOuvert(false);
            rafraichir();
            setVersionStats((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}

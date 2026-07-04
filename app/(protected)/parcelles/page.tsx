'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Map } from 'lucide-react';
import { useParcellesList } from '@/lib/use-parcelles-list';
import { ParcelleFiltres } from '@/components/parcelles/parcelle-filtres';
import { ParcelleTable } from '@/components/parcelles/parcelle-table';
import { PaginationControl } from '@/components/parcelles/pagination-control';
import { ParcelleForm } from '@/components/parcelles/parcelle-form';

/**
 * Page liste des parcelles. Orchestre le hook de données (filtres, recherche,
 * pagination, tri) et les composants de présentation. Le formulaire de création
 * est monté à la demande dans une modale ; après enregistrement on rafraîchit
 * la liste.
 */
export default function ParcellesPage() {
  const {
    data,
    chargement,
    erreur,
    filtres,
    rechercheSaisie,
    setRechercheSaisie,
    setStatut,
    setDrainage,
    setPage,
    setTri,
    rafraichir,
  } = useParcellesList();

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  // Bascule le tri : re-cliquer sur la colonne active inverse l'ordre.
  function basculerTri(colonne: string) {
    const ordre = filtres.tri === colonne && filtres.ordre === 'asc' ? 'desc' : 'asc';
    setTri(colonne, ordre);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Parcelles</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gérez vos parcelles, leur sol, leurs photos et leur historique.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/parcelles/carte"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            <Map className="h-4 w-4" />
            Carte
          </Link>
          <button
            onClick={() => setFormulaireOuvert(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle parcelle
          </button>
        </div>
      </div>

      <ParcelleFiltres
        recherche={rechercheSaisie}
        onRecherche={setRechercheSaisie}
        statut={filtres.statut}
        onStatut={setStatut}
        drainage={filtres.drainage}
        onDrainage={setDrainage}
      />

      {erreur ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {erreur}
        </div>
      ) : (
        <>
          <ParcelleTable
            parcelles={data?.donnees ?? []}
            chargement={chargement}
            tri={filtres.tri}
            ordre={filtres.ordre}
            onTri={basculerTri}
          />
          {data && <PaginationControl pagination={data.pagination} onPage={setPage} libelle="parcelle" />}
        </>
      )}

      {formulaireOuvert && (
        <ParcelleForm
          onFerme={() => setFormulaireOuvert(false)}
          onEnregistre={() => {
            setFormulaireOuvert(false);
            rafraichir();
          }}
        />
      )}
    </div>
  );
}

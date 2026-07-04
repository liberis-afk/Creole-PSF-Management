'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useEquipementsList } from '@/lib/use-equipements-list';
import { StatistiquesEquipements } from '@/components/equipements/statistiques-equipements';
import { AlertesPanel } from '@/components/equipements/alertes-panel';
import { EquipementFiltres } from '@/components/equipements/equipement-filtres';
import { EquipementTable } from '@/components/equipements/equipement-table';
import { EquipementForm } from '@/components/equipements/equipement-form';
import { ExportMenu } from '@/components/equipements/export-menu';
import { PaginationControl } from '@/components/parcelles/pagination-control';

/**
 * Page liste des équipements : statistiques, alertes calculées, filtres,
 * table triable, export (CSV/Excel/PDF), pagination et formulaire de création.
 */
export default function EquipementsPage() {
  const {
    data, chargement, erreur, filtres,
    rechercheSaisie, setRechercheSaisie, setType, setEtat, setResponsable, setPage, setTri, rafraichir,
  } = useEquipementsList();

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [version, setVersion] = useState(0);

  function basculerTri(colonne: string) {
    const ordre = filtres.tri === colonne && filtres.ordre === 'asc' ? 'desc' : 'asc';
    setTri(colonne, ordre);
  }

  function apresChangement() {
    rafraichir();
    setVersion((v) => v + 1);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Équipements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gérez vos équipements, leur maintenance, leur utilisation et leurs coûts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu />
          <button
            onClick={() => setFormulaireOuvert(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouvel équipement
          </button>
        </div>
      </div>

      <StatistiquesEquipements actualiser={version} />
      <AlertesPanel actualiser={version} />

      <EquipementFiltres
        recherche={rechercheSaisie}
        onRecherche={setRechercheSaisie}
        type={filtres.type}
        onType={setType}
        etat={filtres.etat}
        onEtat={setEtat}
        responsableId={filtres.responsableId}
        onResponsable={setResponsable}
      />

      {erreur ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {erreur}
        </div>
      ) : (
        <>
          <EquipementTable
            equipements={data?.donnees ?? []}
            chargement={chargement}
            tri={filtres.tri}
            ordre={filtres.ordre}
            onTri={basculerTri}
          />
          {data && <PaginationControl pagination={data.pagination} onPage={setPage} libelle="équipement" />}
        </>
      )}

      {formulaireOuvert && (
        <EquipementForm
          onFerme={() => setFormulaireOuvert(false)}
          onEnregistre={() => {
            setFormulaireOuvert(false);
            apresChangement();
          }}
        />
      )}
    </div>
  );
}

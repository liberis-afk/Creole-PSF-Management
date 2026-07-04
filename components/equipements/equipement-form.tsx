'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { EquipementDetail, EquipementInput } from '@/lib/equipements-types';
import { LIBELLE_TYPE, LIBELLE_ETAT } from '@/lib/equipements-types';

interface FormProps {
  equipement?: EquipementDetail;
  onFerme: () => void;
  onEnregistre: () => void;
}

interface EmployeRef { id: string; nom: string }

const classeInput =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';
const classeLabel = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300';

const isoVersInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

/**
 * Formulaire création/édition d'un équipement (un composant, deux modes). Le
 * sélecteur de responsable tente de charger la liste des employés ; s'il
 * échoue (module Employés non encore disponible), le champ reste vide sans
 * bloquer la création.
 */
export function EquipementForm({ equipement, onFerme, onEnregistre }: FormProps) {
  const edition = Boolean(equipement);
  const [employes, setEmployes] = useState<EmployeRef[]>([]);

  const [form, setForm] = useState({
    nom: equipement?.nom ?? '',
    type: equipement?.type ?? 'TRACTEUR',
    marque: equipement?.marque ?? '',
    modele: equipement?.modele ?? '',
    numeroSerie: equipement?.numeroSerie ?? '',
    etat: equipement?.etat ?? 'BON',
    dateAchat: isoVersInput(equipement?.dateAchat),
    coutAchat: equipement?.coutAchat?.toString() ?? '',
    localisation: equipement?.localisation ?? '',
    responsableId: equipement?.responsable?.id ?? '',
    notes: equipement?.notes ?? '',
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    // Chargement best-effort des employés (module 6). Si l'endpoint n'existe
    // pas encore, on ignore silencieusement.
    fetch('/api/employes?limit=100', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.donnees) setEmployes(d.donnees.map((e: { id: string; prenom?: string; nom: string }) => ({ id: e.id, nom: `${e.prenom ?? ''} ${e.nom}`.trim() })));
      })
      .catch(() => setEmployes([]));
  }, []);

  function maj<K extends keyof typeof form>(champ: K, valeur: string) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);

    const payload: EquipementInput = {
      nom: form.nom.trim(),
      type: form.type as EquipementInput['type'],
      marque: form.marque || undefined,
      modele: form.modele || undefined,
      numeroSerie: form.numeroSerie || undefined,
      etat: form.etat as EquipementInput['etat'],
      dateAchat: form.dateAchat || undefined,
      coutAchat: form.coutAchat ? Number(form.coutAchat) : undefined,
      localisation: form.localisation || undefined,
      responsableId: form.responsableId || undefined,
      notes: form.notes || undefined,
    };

    try {
      const url = edition ? `/api/equipements/${equipement!.id}` : '/api/equipements';
      const res = await fetch(url, {
        method: edition ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErreur(data.message ?? "Échec de l'enregistrement");
        return;
      }
      onEnregistre();
    } catch {
      setErreur('Impossible de contacter le serveur');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {edition ? "Modifier l'équipement" : 'Nouvel équipement'}
          </h2>
          <button onClick={onFerme} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={soumettre} className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={classeLabel}>Nom *</label>
              <input required value={form.nom} onChange={(e) => maj('nom', e.target.value)} className={classeInput} placeholder="Tracteur John Deere" />
            </div>
            <div>
              <label className={classeLabel}>Type *</label>
              <select value={form.type} onChange={(e) => maj('type', e.target.value)} className={classeInput}>
                {Object.entries(LIBELLE_TYPE).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={classeLabel}>Marque</label>
              <input value={form.marque} onChange={(e) => maj('marque', e.target.value)} className={classeInput} />
            </div>
            <div>
              <label className={classeLabel}>Modèle</label>
              <input value={form.modele} onChange={(e) => maj('modele', e.target.value)} className={classeInput} />
            </div>
            <div>
              <label className={classeLabel}>N° d'identification</label>
              <input value={form.numeroSerie} onChange={(e) => maj('numeroSerie', e.target.value)} className={classeInput} placeholder="Unique dans la ferme" />
            </div>
            <div>
              <label className={classeLabel}>État</label>
              <select value={form.etat} onChange={(e) => maj('etat', e.target.value)} className={classeInput}>
                {Object.entries(LIBELLE_ETAT).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Acquisition &amp; affectation</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={classeLabel}>Date d'acquisition</label>
                <input type="date" value={form.dateAchat} onChange={(e) => maj('dateAchat', e.target.value)} className={classeInput} />
              </div>
              <div>
                <label className={classeLabel}>Valeur d'achat (HTG)</label>
                <input type="number" step="0.01" value={form.coutAchat} onChange={(e) => maj('coutAchat', e.target.value)} className={classeInput} />
              </div>
              <div>
                <label className={classeLabel}>Localisation</label>
                <input value={form.localisation} onChange={(e) => maj('localisation', e.target.value)} className={classeInput} placeholder="Hangar principal" />
              </div>
              <div>
                <label className={classeLabel}>Responsable</label>
                {employes.length > 0 ? (
                  <select value={form.responsableId} onChange={(e) => maj('responsableId', e.target.value)} className={classeInput}>
                    <option value="">Aucun</option>
                    {employes.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.nom}</option>
                    ))}
                  </select>
                ) : (
                  <input value={form.responsableId} onChange={(e) => maj('responsableId', e.target.value)} className={classeInput} placeholder="ID employé (liste indisponible)" />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className={classeLabel}>Notes</label>
            <textarea value={form.notes} onChange={(e) => maj('notes', e.target.value)} rows={2} className={classeInput} />
          </div>

          {erreur && <p className="text-sm text-red-600 dark:text-red-400">{erreur}</p>}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button type="button" onClick={onFerme} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900">
              Annuler
            </button>
            <button type="submit" disabled={envoi} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {envoi ? 'Enregistrement…' : edition ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

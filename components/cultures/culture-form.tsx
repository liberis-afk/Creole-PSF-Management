'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { CultureDetail, CultureInput, ParcelleRef } from '@/lib/cultures-types';

interface FormProps {
  culture?: CultureDetail;
  /** Pré-sélection de la parcelle (création depuis une parcelle). */
  parcelleIdInitiale?: string;
  onFerme: () => void;
  onEnregistre: () => void;
}

const classeInput =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';
const classeLabel = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300';

const isoVersInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

/**
 * Formulaire création/édition d'une culture. Un seul composant, deux modes.
 * La liste des parcelles est chargée pour le sélecteur obligatoire.
 */
export function CultureForm({ culture, parcelleIdInitiale, onFerme, onEnregistre }: FormProps) {
  const edition = Boolean(culture);
  const [parcelles, setParcelles] = useState<ParcelleRef[]>([]);

  const [form, setForm] = useState({
    parcelleId: culture?.parcelle.id ?? parcelleIdInitiale ?? '',
    nom: culture?.nom ?? '',
    variete: culture?.variete ?? '',
    espece: culture?.espece ?? '',
    cycleJours: culture?.cycleJours?.toString() ?? '',
    datePlantation: isoVersInput(culture?.datePlantation) || new Date().toISOString().slice(0, 10),
    dateRecoltePrevue: isoVersInput(culture?.dateRecoltePrevue),
    espacementCm: culture?.espacementCm?.toString() ?? '',
    densite: culture?.densite?.toString() ?? '',
    population: culture?.population?.toString() ?? '',
    quantiteSemences: culture?.quantiteSemences?.toString() ?? '',
    uniteSemences: culture?.uniteSemences ?? '',
    rendementAttenduKg: culture?.rendementAttenduKg?.toString() ?? '',
    statut: culture?.statut ?? 'PLANIFIEE',
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    fetch('/api/parcelles?limit=100&tri=nom&ordre=asc', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.donnees) setParcelles(d.donnees.map((p: ParcelleRef) => ({ id: p.id, nom: p.nom, code: p.code })));
      })
      .catch(() => setParcelles([]));
  }, []);

  function maj<K extends keyof typeof form>(champ: K, valeur: string) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);

    const payload: CultureInput = {
      parcelleId: form.parcelleId,
      nom: form.nom.trim(),
      variete: form.variete || undefined,
      espece: form.espece || undefined,
      cycleJours: form.cycleJours ? Number(form.cycleJours) : undefined,
      datePlantation: form.datePlantation,
      dateRecoltePrevue: form.dateRecoltePrevue || undefined,
      espacementCm: form.espacementCm ? Number(form.espacementCm) : undefined,
      densite: form.densite ? Number(form.densite) : undefined,
      population: form.population ? Number(form.population) : undefined,
      quantiteSemences: form.quantiteSemences ? Number(form.quantiteSemences) : undefined,
      uniteSemences: form.uniteSemences || undefined,
      rendementAttenduKg: form.rendementAttenduKg ? Number(form.rendementAttenduKg) : undefined,
      statut: form.statut as CultureInput['statut'],
    };

    try {
      const url = edition ? `/api/cultures/${culture!.id}` : '/api/cultures';
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
            {edition ? 'Modifier la culture' : 'Nouvelle culture'}
          </h2>
          <button onClick={onFerme} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={soumettre} className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={classeLabel}>Parcelle *</label>
              <select required value={form.parcelleId} onChange={(e) => maj('parcelleId', e.target.value)} className={classeInput}>
                <option value="">Sélectionner une parcelle…</option>
                {parcelles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} ({p.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={classeLabel}>Nom *</label>
              <input required value={form.nom} onChange={(e) => maj('nom', e.target.value)} className={classeInput} placeholder="Maïs saison 1" />
            </div>
            <div>
              <label className={classeLabel}>Statut</label>
              <select value={form.statut} onChange={(e) => maj('statut', e.target.value)} className={classeInput}>
                <option value="PLANIFIEE">Planifiée</option>
                <option value="ACTIVE">Active</option>
                <option value="RECOLTEE">Récoltée</option>
                <option value="ABANDONNEE">Abandonnée</option>
              </select>
            </div>
            <div>
              <label className={classeLabel}>Espèce</label>
              <input value={form.espece} onChange={(e) => maj('espece', e.target.value)} className={classeInput} placeholder="Zea mays" />
            </div>
            <div>
              <label className={classeLabel}>Variété</label>
              <input value={form.variete} onChange={(e) => maj('variete', e.target.value)} className={classeInput} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Cycle</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={classeLabel}>Date de plantation *</label>
                <input required type="date" value={form.datePlantation} onChange={(e) => maj('datePlantation', e.target.value)} className={classeInput} />
              </div>
              <div>
                <label className={classeLabel}>Récolte prévue</label>
                <input type="date" value={form.dateRecoltePrevue} onChange={(e) => maj('dateRecoltePrevue', e.target.value)} className={classeInput} />
              </div>
              <div>
                <label className={classeLabel}>Cycle (jours)</label>
                <input type="number" value={form.cycleJours} onChange={(e) => maj('cycleJours', e.target.value)} className={classeInput} placeholder="120" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Paramètres techniques</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className={classeLabel}>Espacement (cm)</label>
                <input type="number" step="0.01" value={form.espacementCm} onChange={(e) => maj('espacementCm', e.target.value)} className={classeInput} />
              </div>
              <div>
                <label className={classeLabel}>Densité (/ha)</label>
                <input type="number" step="0.01" value={form.densite} onChange={(e) => maj('densite', e.target.value)} className={classeInput} />
              </div>
              <div>
                <label className={classeLabel}>Population</label>
                <input type="number" value={form.population} onChange={(e) => maj('population', e.target.value)} className={classeInput} />
              </div>
              <div>
                <label className={classeLabel}>Qté semences</label>
                <input type="number" step="0.001" value={form.quantiteSemences} onChange={(e) => maj('quantiteSemences', e.target.value)} className={classeInput} />
              </div>
              <div>
                <label className={classeLabel}>Unité semences</label>
                <input value={form.uniteSemences} onChange={(e) => maj('uniteSemences', e.target.value)} className={classeInput} placeholder="kg" />
              </div>
              <div>
                <label className={classeLabel}>Rdt attendu (kg)</label>
                <input type="number" step="0.001" value={form.rendementAttenduKg} onChange={(e) => maj('rendementAttenduKg', e.target.value)} className={classeInput} />
              </div>
            </div>
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

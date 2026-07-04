'use client';

import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import type { ActiviteDetail, ActiviteInput } from '@/lib/activites-types';
import { LIBELLE_TYPE, LIBELLE_PRIORITE, LIBELLE_STATUT } from '@/lib/activites-types';

interface FormProps {
  activite?: ActiviteDetail;
  dateInitiale?: string;
  onFerme: () => void;
  onEnregistre: () => void;
}

interface Ref { id: string; nom: string }

const classeInput =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';
const classeLabel = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300';
const isoVersInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

/**
 * Formulaire création/édition d'une activité. Charge en best-effort les
 * utilisateurs (responsable), employés (affectation), parcelles et cultures ;
 * chaque liste se dégrade proprement si son module n'est pas encore disponible.
 */
export function ActiviteForm({ activite, dateInitiale, onFerme, onEnregistre }: FormProps) {
  const edition = Boolean(activite);
  const [utilisateurs, setUtilisateurs] = useState<Ref[]>([]);
  const [employes, setEmployes] = useState<Ref[]>([]);
  const [parcelles, setParcelles] = useState<Ref[]>([]);
  const [cultures, setCultures] = useState<Ref[]>([]);

  const [form, setForm] = useState({
    titre: activite?.titre ?? '',
    type: activite?.type ?? 'PLANTATION',
    description: activite?.description ?? '',
    dateProgrammee: isoVersInput(activite?.dateProgrammee) || dateInitiale || new Date().toISOString().slice(0, 10),
    dateFin: isoVersInput(activite?.dateFin),
    heureProgrammee: activite?.heureProgrammee ?? '',
    priorite: activite?.priorite ?? 'NORMALE',
    statut: activite?.statut ?? 'PLANIFIEE',
    cout: activite?.cout?.toString() ?? '',
    responsableId: activite?.responsable?.id ?? '',
    parcelleId: activite?.parcelle?.id ?? '',
    cultureId: activite?.culture?.id ?? '',
  });
  const [employesSelection, setEmployesSelection] = useState<string[]>(activite?.employes.map((e) => e.id) ?? []);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    const charger = async (url: string, mapper: (d: any) => Ref[], set: (r: Ref[]) => void) => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) set(mapper(await res.json()));
      } catch { /* module indisponible : liste vide */ }
    };
    charger('/api/utilisateurs?limit=100', (d) => (d.donnees ?? d ?? []).map((u: any) => ({ id: u.id, nom: `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || u.email })), setUtilisateurs);
    charger('/api/employes?limit=200', (d) => (d.donnees ?? []).map((e: any) => ({ id: e.id, nom: `${e.prenom ?? ''} ${e.nom}`.trim() })), setEmployes);
    charger('/api/parcelles?limit=200', (d) => (d.donnees ?? []).map((p: any) => ({ id: p.id, nom: p.nom })), setParcelles);
    charger('/api/cultures?limit=200', (d) => (d.donnees ?? []).map((c: any) => ({ id: c.id, nom: c.nom })), setCultures);
  }, []);

  function maj<K extends keyof typeof form>(champ: K, valeur: string) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  function basculerEmploye(id: string) {
    setEmployesSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);

    const payload: ActiviteInput = {
      titre: form.titre.trim(),
      type: form.type as ActiviteInput['type'],
      description: form.description || undefined,
      dateProgrammee: form.dateProgrammee,
      dateFin: form.dateFin || undefined,
      heureProgrammee: form.heureProgrammee || undefined,
      priorite: form.priorite as ActiviteInput['priorite'],
      statut: form.statut as ActiviteInput['statut'],
      cout: form.cout ? Number(form.cout) : undefined,
      responsableId: form.responsableId || undefined,
      parcelleId: form.parcelleId || undefined,
      cultureId: form.cultureId || undefined,
      employeIds: employesSelection,
    };

    try {
      const url = edition ? `/api/activites/${activite!.id}` : '/api/activites';
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
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{edition ? "Modifier l'activité" : 'Nouvelle activité'}</h2>
          <button onClick={onFerme} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Fermer"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={soumettre} className="space-y-4 p-5">
          <div>
            <label className={classeLabel}>Titre *</label>
            <input required value={form.titre} onChange={(e) => maj('titre', e.target.value)} className={classeInput} placeholder="Semis maïs parcelle Nord" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={classeLabel}>Type *</label>
              <select value={form.type} onChange={(e) => maj('type', e.target.value)} className={classeInput}>
                {Object.entries(LIBELLE_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={classeLabel}>Priorité</label>
              <select value={form.priorite} onChange={(e) => maj('priorite', e.target.value)} className={classeInput}>
                {Object.entries(LIBELLE_PRIORITE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={classeLabel}>Date de début *</label>
              <input required type="date" value={form.dateProgrammee} onChange={(e) => maj('dateProgrammee', e.target.value)} className={classeInput} />
            </div>
            <div>
              <label className={classeLabel}>Date de fin</label>
              <input type="date" value={form.dateFin} onChange={(e) => maj('dateFin', e.target.value)} className={classeInput} />
            </div>
            <div>
              <label className={classeLabel}>Heure</label>
              <input type="time" value={form.heureProgrammee} onChange={(e) => maj('heureProgrammee', e.target.value)} className={classeInput} />
            </div>
            <div>
              <label className={classeLabel}>Coût (HTG)</label>
              <input type="number" step="0.01" value={form.cout} onChange={(e) => maj('cout', e.target.value)} className={classeInput} />
            </div>
            <div>
              <label className={classeLabel}>Statut</label>
              <select value={form.statut} onChange={(e) => maj('statut', e.target.value)} className={classeInput}>
                {Object.entries(LIBELLE_STATUT).filter(([k]) => k !== 'EN_RETARD').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={classeLabel}>Responsable</label>
              {utilisateurs.length > 0 ? (
                <select value={form.responsableId} onChange={(e) => maj('responsableId', e.target.value)} className={classeInput}>
                  <option value="">Aucun</option>
                  {utilisateurs.map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
                </select>
              ) : (
                <input value={form.responsableId} onChange={(e) => maj('responsableId', e.target.value)} className={classeInput} placeholder="ID utilisateur" />
              )}
            </div>
          </div>

          {(parcelles.length > 0 || cultures.length > 0) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {parcelles.length > 0 && (
                <div>
                  <label className={classeLabel}>Parcelle liée</label>
                  <select value={form.parcelleId} onChange={(e) => maj('parcelleId', e.target.value)} className={classeInput}>
                    <option value="">Aucune</option>
                    {parcelles.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>
                </div>
              )}
              {cultures.length > 0 && (
                <div>
                  <label className={classeLabel}>Culture liée</label>
                  <select value={form.cultureId} onChange={(e) => maj('cultureId', e.target.value)} className={classeInput}>
                    <option value="">Aucune</option>
                    {cultures.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Employés affectés (multi-sélection) */}
          {employes.length > 0 && (
            <div>
              <label className={classeLabel}>Employés affectés</label>
              <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-800">
                {employes.map((emp) => {
                  const actif = employesSelection.includes(emp.id);
                  return (
                    <button
                      type="button"
                      key={emp.id}
                      onClick={() => basculerEmploye(emp.id)}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${actif ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
                    >
                      {actif && <Check className="h-3 w-3" />}
                      {emp.nom}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className={classeLabel}>Description</label>
            <textarea value={form.description} onChange={(e) => maj('description', e.target.value)} rows={2} className={classeInput} />
          </div>

          {erreur && <p className="text-sm text-red-600 dark:text-red-400">{erreur}</p>}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button type="button" onClick={onFerme} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900">Annuler</button>
            <button type="submit" disabled={envoi} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {envoi ? 'Enregistrement…' : edition ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

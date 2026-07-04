'use client';

import { useEffect, useState } from 'react';
import { Plus, Wrench, Trash2 } from 'lucide-react';
import type { Entretien, StatutEntretien } from '@/lib/equipements-types';
import { LIBELLE_TYPE_ENTRETIEN, LIBELLE_STATUT_ENTRETIEN } from '@/lib/equipements-types';
import { TypeEntretienBadge, StatutEntretienBadge } from './badges';

const dateFr = (iso: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));
const classeInput =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

const STATUTS: StatutEntretien[] = ['PLANIFIE', 'EN_COURS', 'TERMINE'];

/**
 * Panneau maintenance : liste des entretiens, ajout inline, et changement de
 * statut (planifié → en cours → terminé) directement depuis la liste. Chaque
 * changement rafraîchit les alertes/stats du parent via onChangement.
 */
export function MaintenancePanel({ equipementId, onChangement }: { equipementId: string; onChangement?: () => void }) {
  const [entretiens, setEntretiens] = useState<Entretien[]>([]);
  const [chargement, setChargement] = useState(true);
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [form, setForm] = useState({
    type: 'PREVENTIF',
    statut: 'PLANIFIE',
    dateEntretien: new Date().toISOString().slice(0, 10),
    description: '',
    cout: '',
    piecesUtilisees: '',
    effectuePar: '',
    prochaineEcheance: '',
  });

  async function charger() {
    try {
      const res = await fetch(`/api/equipements/${equipementId}/entretiens`, { cache: 'no-store' });
      if (res.ok) setEntretiens(await res.json());
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipementId]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    try {
      const res = await fetch(`/api/equipements/${equipementId}/entretiens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          statut: form.statut,
          dateEntretien: form.dateEntretien,
          description: form.description || undefined,
          cout: form.cout ? Number(form.cout) : undefined,
          piecesUtilisees: form.piecesUtilisees ? form.piecesUtilisees.split(',').map((x) => x.trim()).filter(Boolean) : [],
          effectuePar: form.effectuePar || undefined,
          prochaineEcheance: form.prochaineEcheance || undefined,
        }),
      });
      if (res.ok) {
        setForm({ type: 'PREVENTIF', statut: 'PLANIFIE', dateEntretien: new Date().toISOString().slice(0, 10), description: '', cout: '', piecesUtilisees: '', effectuePar: '', prochaineEcheance: '' });
        setOuvert(false);
        await charger();
        onChangement?.();
      }
    } finally {
      setEnvoi(false);
    }
  }

  async function changerStatut(id: string, statut: StatutEntretien) {
    await fetch(`/api/equipements/${equipementId}/entretiens/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    });
    await charger();
    onChangement?.();
  }

  async function supprimer(id: string) {
    await fetch(`/api/equipements/${equipementId}/entretiens/${id}`, { method: 'DELETE' });
    setEntretiens((es) => es.filter((e) => e.id !== id));
    onChangement?.();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Wrench className="h-4 w-4 text-gray-400" />
          Maintenance
        </h3>
        <button onClick={() => setOuvert((o) => !o)} className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>

      {ouvert && (
        <form onSubmit={ajouter} className="mb-4 space-y-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={classeInput}>
                {Object.entries(LIBELLE_TYPE_ENTRETIEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Statut</label>
              <select value={form.statut} onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value }))} className={classeInput}>
                {STATUTS.map((s) => <option key={s} value={s}>{LIBELLE_STATUT_ENTRETIEN[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Date</label>
              <input required type="date" value={form.dateEntretien} onChange={(e) => setForm((f) => ({ ...f, dateEntretien: e.target.value }))} className={classeInput} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Prochaine échéance</label>
              <input type="date" value={form.prochaineEcheance} onChange={(e) => setForm((f) => ({ ...f, prochaineEcheance: e.target.value }))} className={classeInput} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-gray-500">Description du problème</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={classeInput} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Coût (HTG)</label>
              <input type="number" step="0.01" value={form.cout} onChange={(e) => setForm((f) => ({ ...f, cout: e.target.value }))} className={classeInput} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Technicien</label>
              <input value={form.effectuePar} onChange={(e) => setForm((f) => ({ ...f, effectuePar: e.target.value }))} className={classeInput} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-gray-500">Pièces utilisées (séparées par virgule)</label>
              <input value={form.piecesUtilisees} onChange={(e) => setForm((f) => ({ ...f, piecesUtilisees: e.target.value }))} className={classeInput} placeholder="filtre à huile, courroie" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={envoi} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {envoi ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {chargement ? (
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />)}</div>
      ) : entretiens.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">Aucune maintenance enregistrée.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {entretiens.map((e) => (
            <li key={e.id} className="py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeEntretienBadge type={e.type} />
                    <StatutEntretienBadge statut={e.statut} />
                    <span className="text-xs text-gray-400">{dateFr(e.dateEntretien)}</span>
                    {e.cout !== null && <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{e.cout.toLocaleString('fr-FR')} HTG</span>}
                  </div>
                  {e.description && <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{e.description}</p>}
                  <p className="mt-0.5 text-xs text-gray-400">
                    {e.effectuePar ? `Technicien : ${e.effectuePar}` : ''}
                    {e.effectuePar && e.piecesUtilisees.length > 0 ? ' · ' : ''}
                    {e.piecesUtilisees.length > 0 ? `Pièces : ${e.piecesUtilisees.join(', ')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {/* Changement rapide de statut */}
                  <select
                    value={e.statut}
                    onChange={(ev) => changerStatut(e.id, ev.target.value as StatutEntretien)}
                    className="rounded-md border border-gray-200 px-1.5 py-1 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    aria-label="Changer le statut"
                  >
                    {STATUTS.map((s) => <option key={s} value={s}>{LIBELLE_STATUT_ENTRETIEN[s]}</option>)}
                  </select>
                  <button onClick={() => supprimer(e.id)} className="rounded-md p-1 text-gray-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10" aria-label="Supprimer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

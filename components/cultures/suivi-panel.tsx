'use client';

import { useEffect, useState } from 'react';
import { Plus, Stethoscope } from 'lucide-react';
import type { Suivi } from '@/lib/cultures-types';
import { LIBELLE_STADE } from '@/lib/cultures-types';
import { SanteBadge } from './badges';

const dateFr = (iso: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));
const classeInput =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

/**
 * Suivi sanitaire de la culture : liste des observations + formulaire d'ajout
 * inline (stade, santé, maladies, ravageurs). Les maladies/ravageurs sont
 * saisis en texte séparé par des virgules et convertis en tableau.
 */
export function SuiviPanel({ cultureId, onChangement }: { cultureId: string; onChangement?: () => void }) {
  const [suivis, setSuivis] = useState<Suivi[]>([]);
  const [chargement, setChargement] = useState(true);
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [form, setForm] = useState({ stade: 'CROISSANCE', etatSante: 'BONNE', maladies: '', ravageurs: '', notes: '' });

  async function charger() {
    try {
      const res = await fetch(`/api/cultures/${cultureId}/suivis`, { cache: 'no-store' });
      if (res.ok) setSuivis(await res.json());
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cultureId]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    const enListe = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);
    try {
      const res = await fetch(`/api/cultures/${cultureId}/suivis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stade: form.stade,
          etatSante: form.etatSante,
          maladies: enListe(form.maladies),
          ravageurs: enListe(form.ravageurs),
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        setForm({ stade: 'CROISSANCE', etatSante: 'BONNE', maladies: '', ravageurs: '', notes: '' });
        setOuvert(false);
        await charger();
        onChangement?.();
      }
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Stethoscope className="h-4 w-4 text-gray-400" />
          Suivi sanitaire
        </h3>
        <button onClick={() => setOuvert((o) => !o)} className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> Observer
        </button>
      </div>

      {ouvert && (
        <form onSubmit={ajouter} className="mb-4 space-y-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Stade</label>
              <select value={form.stade} onChange={(e) => setForm((f) => ({ ...f, stade: e.target.value }))} className={classeInput}>
                {Object.entries(LIBELLE_STADE).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">État de santé</label>
              <select value={form.etatSante} onChange={(e) => setForm((f) => ({ ...f, etatSante: e.target.value }))} className={classeInput}>
                <option value="BONNE">Bonne</option>
                <option value="MOYENNE">Moyenne</option>
                <option value="MAUVAISE">Mauvaise</option>
                <option value="CRITIQUE">Critique</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Maladies (séparées par virgule)</label>
              <input value={form.maladies} onChange={(e) => setForm((f) => ({ ...f, maladies: e.target.value }))} className={classeInput} placeholder="mildiou, rouille" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Ravageurs</label>
              <input value={form.ravageurs} onChange={(e) => setForm((f) => ({ ...f, ravageurs: e.target.value }))} className={classeInput} placeholder="pucerons" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Notes</label>
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={classeInput} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={envoi} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {envoi ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {chargement ? (
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />)}</div>
      ) : suivis.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">Aucune observation enregistrée.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {suivis.map((s) => (
            <li key={s.id} className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{LIBELLE_STADE[s.stade]}</span>
                <div className="flex items-center gap-2">
                  <SanteBadge etat={s.etatSante} />
                  <span className="text-xs text-gray-400">{dateFr(s.dateSuivi)}</span>
                </div>
              </div>
              {(s.maladies.length > 0 || s.ravageurs.length > 0) && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{[...s.maladies, ...s.ravageurs].join(', ')}</p>
              )}
              {s.notes && <p className="mt-0.5 text-xs text-gray-400">{s.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Plus, SprayCan, Wheat } from 'lucide-react';
import type { Traitement, Rendements } from '@/lib/cultures-types';
import { LIBELLE_TRAITEMENT } from '@/lib/cultures-types';

const dateFr = (iso: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));
const classeInput =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

/** Traitements appliqués à la culture, avec formulaire d'ajout inline. */
export function TraitementsPanel({ cultureId }: { cultureId: string }) {
  const [traitements, setTraitements] = useState<Traitement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [form, setForm] = useState({
    dateTraitement: new Date().toISOString().slice(0, 10),
    type: 'HERBICIDE',
    produit: '',
    dose: '',
    unite: '',
    appliquePar: '',
  });

  async function charger() {
    try {
      const res = await fetch(`/api/cultures/${cultureId}/traitements`, { cache: 'no-store' });
      if (res.ok) setTraitements(await res.json());
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
    try {
      const res = await fetch(`/api/cultures/${cultureId}/traitements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateTraitement: form.dateTraitement,
          type: form.type,
          produit: form.produit.trim(),
          dose: form.dose ? Number(form.dose) : undefined,
          unite: form.unite || undefined,
          appliquePar: form.appliquePar || undefined,
        }),
      });
      if (res.ok) {
        setForm({ dateTraitement: new Date().toISOString().slice(0, 10), type: 'HERBICIDE', produit: '', dose: '', unite: '', appliquePar: '' });
        setOuvert(false);
        await charger();
      }
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <SprayCan className="h-4 w-4 text-gray-400" />
          Traitements
        </h3>
        <button onClick={() => setOuvert((o) => !o)} className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>

      {ouvert && (
        <form onSubmit={ajouter} className="mb-4 space-y-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Date</label>
              <input required type="date" value={form.dateTraitement} onChange={(e) => setForm((f) => ({ ...f, dateTraitement: e.target.value }))} className={classeInput} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={classeInput}>
                {Object.entries(LIBELLE_TRAITEMENT).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-gray-500">Produit</label>
              <input required value={form.produit} onChange={(e) => setForm((f) => ({ ...f, produit: e.target.value }))} className={classeInput} placeholder="Glyphosate 480" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Dose</label>
              <input type="number" step="0.001" value={form.dose} onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))} className={classeInput} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Unité</label>
              <input value={form.unite} onChange={(e) => setForm((f) => ({ ...f, unite: e.target.value }))} className={classeInput} placeholder="L/ha" />
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
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />)}</div>
      ) : traitements.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">Aucun traitement enregistré.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {traitements.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">{t.produit}</span>
                <span className="ml-2 text-xs text-gray-400">{LIBELLE_TRAITEMENT[t.type]}{t.dose ? ` · ${t.dose} ${t.unite ?? ''}` : ''}</span>
              </div>
              <span className="text-xs text-gray-400">{dateFr(t.dateTraitement)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Rendements (récoltes) de la culture, en lecture seule. */
export function RendementsPanel({ cultureId }: { cultureId: string }) {
  const [data, setData] = useState<Rendements | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    fetch(`/api/cultures/${cultureId}/rendements`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setChargement(false));
  }, [cultureId]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Wheat className="h-4 w-4 text-gray-400" />
          Rendements
        </h3>
        {data && data.lignes.length > 0 && (
          <span className="text-sm font-medium text-brand-700 dark:text-brand-200">
            {data.totalRecolteKg.toLocaleString('fr-FR')} kg au total
          </span>
        )}
      </div>

      {chargement ? (
        <div className="h-16 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />
      ) : !data || data.lignes.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          Aucune récolte enregistrée. Les récoltes apparaîtront ici depuis le module Récoltes.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.lignes.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">{r.quantite.toLocaleString('fr-FR')} {r.unite}</span>
                {r.qualite && <span className="ml-2 text-xs text-gray-400">Qualité : {r.qualite}</span>}
              </div>
              <span className="text-xs text-gray-400">{dateFr(r.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Plus, Clock, Coins, AlertTriangle } from 'lucide-react';
import type { Utilisation, Historique } from '@/lib/equipements-types';

const dateFr = (iso: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));
const classeInput =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

/**
 * Panneau utilisation : enregistrement des heures d'usage + liste. Alimente les
 * statistiques « temps d'utilisation » et « plus utilisés ».
 */
export function UtilisationPanel({ equipementId, onChangement }: { equipementId: string; onChangement?: () => void }) {
  const [utilisations, setUtilisations] = useState<Utilisation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), heuresUtilisation: '', notes: '' });

  async function charger() {
    try {
      const res = await fetch(`/api/equipements/${equipementId}/utilisations`, { cache: 'no-store' });
      if (res.ok) setUtilisations(await res.json());
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
      const res = await fetch(`/api/equipements/${equipementId}/utilisations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          heuresUtilisation: Number(form.heuresUtilisation),
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        setForm({ date: new Date().toISOString().slice(0, 10), heuresUtilisation: '', notes: '' });
        setOuvert(false);
        await charger();
        onChangement?.();
      }
    } finally {
      setEnvoi(false);
    }
  }

  const total = utilisations.reduce((s, u) => s + u.heuresUtilisation, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Clock className="h-4 w-4 text-gray-400" />
          Utilisation
          {total > 0 && <span className="text-xs font-normal text-gray-400">· {total.toLocaleString('fr-FR')} h au total</span>}
        </h3>
        <button onClick={() => setOuvert((o) => !o)} className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> Enregistrer
        </button>
      </div>

      {ouvert && (
        <form onSubmit={ajouter} className="mb-4 space-y-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Date</label>
              <input required type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={classeInput} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Heures</label>
              <input required type="number" step="0.1" min="0" value={form.heuresUtilisation} onChange={(e) => setForm((f) => ({ ...f, heuresUtilisation: e.target.value }))} className={classeInput} />
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
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />)}</div>
      ) : utilisations.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">Aucune utilisation enregistrée.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {utilisations.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">{u.heuresUtilisation.toLocaleString('fr-FR')} h</span>
                {u.operateur && <span className="ml-2 text-xs text-gray-400">{u.operateur.nom}</span>}
                {u.notes && <p className="text-xs text-gray-400">{u.notes}</p>}
              </div>
              <span className="text-xs text-gray-400">{dateFr(u.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Résumé de l'historique (coût total, nombre de pannes, heures). Chargé depuis
 * l'endpoint historique consolidé. Se rafraîchit via la clé `version`.
 */
export function HistoriqueResume({ equipementId, version }: { equipementId: string; version: number }) {
  const [data, setData] = useState<Historique['resume'] | null>(null);

  useEffect(() => {
    fetch(`/api/equipements/${equipementId}/historique`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Historique) => setData(d.resume))
      .catch(() => setData(null));
  }, [equipementId, version]);

  const cartes = [
    { icone: Coins, label: 'Coût maintenance', valeur: data ? `${data.coutTotalMaintenance.toLocaleString('fr-FR')} HTG` : '—' },
    { icone: AlertTriangle, label: 'Pannes', valeur: data ? String(data.nbPannes) : '—' },
    { icone: Clock, label: 'Heures totales', valeur: data ? `${data.heuresUtilisationTotal.toLocaleString('fr-FR')} h` : '—' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cartes.map((c) => (
        <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center gap-1.5 text-gray-400">
            <c.icone className="h-4 w-4" />
            <span className="text-xs">{c.label}</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{c.valeur}</p>
        </div>
      ))}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { History, FlaskConical } from 'lucide-react';
import type { Historique } from '@/lib/parcelles-types';

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{titre}</h4>
      {children}
    </div>
  );
}

function ListeVide({ texte }: { texte: string }) {
  return <p className="text-sm text-gray-400 dark:text-gray-500">{texte}</p>;
}

/**
 * Panneau historique de la parcelle. Agrège en lecture seule les données des
 * modules liés (cultures, récoltes, suivis) + les analyses de sol propres à la
 * parcelle. Tant que ces modules ne sont pas alimentés, les sections affichent
 * un état vide — elles se rempliront automatiquement plus tard.
 */
export function HistoriquePanel({ parcelleId }: { parcelleId: string }) {
  const [data, setData] = useState<Historique | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    fetch(`/api/parcelles/${parcelleId}/historique`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setChargement(false));
  }, [parcelleId]);

  if (chargement) {
    return (
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />
        ))}
      </div>
    );
  }

  const dateFr = (iso: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));

  return (
    <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Historique</h3>
      </div>

      <Section titre="Cultures précédentes">
        {!data || data.culturesPrecedentes.length === 0 ? (
          <ListeVide texte="Aucune culture enregistrée sur cette parcelle." />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.culturesPrecedentes.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-900 dark:text-white">
                  {c.nom}
                  {c.variete ? <span className="text-gray-400"> · {c.variete}</span> : ''}
                </span>
                <span className="text-xs text-gray-400">{dateFr(c.datePlantation)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section titre="Rendements">
        {!data || data.rendements.length === 0 ? (
          <ListeVide texte="Aucune récolte enregistrée." />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.rendements.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700 dark:text-gray-300">{dateFr(r.date)}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {r.quantite.toLocaleString('fr-FR')} {r.unite}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section titre="Observations sanitaires">
        {!data || data.observationsSante.length === 0 ? (
          <ListeVide texte="Aucune observation." />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.observationsSante.map((o) => (
              <li key={o.id} className="py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">État : {o.etatSante}</span>
                  <span className="text-xs text-gray-400">{dateFr(o.date)}</span>
                </div>
                {(o.maladies.length > 0 || o.ravageurs.length > 0) && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    {[...o.maladies, ...o.ravageurs].join(', ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section titre="Analyses de sol">
        {!data || data.analysesSol.length === 0 ? (
          <ListeVide texte="Aucune analyse de sol." />
        ) : (
          <ul className="space-y-2">
            {data.analysesSol.map((a) => (
              <li key={a.id} className="rounded-lg border border-gray-100 p-3 text-sm dark:border-gray-800">
                <div className="mb-1 flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <FlaskConical className="h-3.5 w-3.5" />
                  <span className="text-xs">{dateFr(a.dateAnalyse)}</span>
                  {a.laboratoire && <span className="text-xs">· {a.laboratoire}</span>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                  {a.ph !== null && <span>pH : {a.ph}</span>}
                  {a.matiereOrganique !== null && <span>MO : {a.matiereOrganique}%</span>}
                  {a.azote !== null && <span>N : {a.azote}</span>}
                  {a.phosphore !== null && <span>P : {a.phosphore}</span>}
                  {a.potassium !== null && <span>K : {a.potassium}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

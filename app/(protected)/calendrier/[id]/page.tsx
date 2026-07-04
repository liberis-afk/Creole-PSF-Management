'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, User, MapPin, Sprout, Coins, Clock, Users } from 'lucide-react';
import type { ActiviteDetail } from '@/lib/activites-types';
import { StatutBadge, PrioriteBadge, TypeBadge, RetardBadge } from '@/components/activites/badges';
import { ActiviteForm } from '@/components/activites/activite-form';
import { CommentairesPanel } from '@/components/activites/commentaires-panel';
import { PiecesJointesPanel } from '@/components/activites/pieces-jointes-panel';

const dateFr = (iso: string | null) => (iso ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(iso)) : '—');
const devise = (n: number | null) => (n !== null ? `${n.toLocaleString('fr-FR')} HTG` : '—');

/**
 * Page détail d'une activité : informations, employés affectés, commentaires
 * (fil) et pièces jointes.
 */
export default function ActiviteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activite, setActivite] = useState<ActiviteDetail | null>(null);
  const [chargement, setChargement] = useState(true);
  const [introuvable, setIntrouvable] = useState(false);
  const [editionOuverte, setEditionOuverte] = useState(false);
  const [suppression, setSuppression] = useState(false);

  async function charger() {
    setChargement(true);
    try {
      const res = await fetch(`/api/activites/${params.id}`, { cache: 'no-store' });
      if (res.status === 404) { setIntrouvable(true); return; }
      if (res.ok) setActivite(await res.json());
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function supprimer() {
    if (!confirm('Supprimer définitivement cette activité ?')) return;
    setSuppression(true);
    const res = await fetch(`/api/activites/${params.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/calendrier');
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.message ?? 'Suppression impossible');
      setSuppression(false);
    }
  }

  if (introuvable) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-950">
        <p className="text-sm text-gray-500 dark:text-gray-400">Cette activité est introuvable.</p>
        <Link href="/calendrier" className="mt-3 inline-block text-sm text-brand-600 hover:underline">Retour au calendrier</Link>
      </div>
    );
  }

  if (chargement || !activite) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-900" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900" />
      </div>
    );
  }

  const infos = [
    { icone: Clock, label: 'Date', valeur: `${dateFr(activite.dateProgrammee)}${activite.heureProgrammee ? ` · ${activite.heureProgrammee}` : ''}${activite.dateFin ? ` → ${dateFr(activite.dateFin)}` : ''}` },
    { icone: User, label: 'Responsable', valeur: activite.responsable?.nom ?? '—' },
    { icone: Coins, label: 'Coût', valeur: devise(activite.cout) },
    activite.parcelle
      ? { icone: MapPin, label: 'Parcelle', valeur: activite.parcelle.nom, lien: `/parcelles/${activite.parcelle.id}` }
      : { icone: Sprout, label: 'Culture', valeur: activite.culture?.nom ?? '—', lien: activite.culture ? `/cultures/${activite.culture.id}` : undefined },
  ];

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/calendrier" className="mb-2 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="h-4 w-4" />
            Calendrier
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{activite.titre}</h1>
            {activite.enRetard ? <RetardBadge /> : <StatutBadge statut={activite.statut} />}
            <PrioriteBadge priorite={activite.priorite} />
          </div>
          <div className="mt-1"><TypeBadge type={activite.type} /></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditionOuverte(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900">
            <Pencil className="h-4 w-4" />
            Modifier
          </button>
          <button onClick={supprimer} disabled={suppression} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10">
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Infos clés */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {infos.map((info) => (
          <div key={info.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center gap-1.5 text-gray-400">
              <info.icone className="h-4 w-4" />
              <span className="text-xs">{info.label}</span>
            </div>
            {'lien' in info && info.lien ? (
              <Link href={info.lien} className="mt-1 block text-sm font-semibold text-gray-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-200">{info.valeur}</Link>
            ) : (
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{info.valeur}</p>
            )}
          </div>
        ))}
      </div>

      {activite.description && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
          {activite.description}
        </div>
      )}

      {/* Employés affectés */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Users className="h-4 w-4 text-gray-400" />
          Employés affectés
          {activite.employes.length > 0 && <span className="text-xs font-normal text-gray-400">· {activite.employes.length}</span>}
        </h3>
        {activite.employes.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Aucun employé affecté. Utilisez « Modifier » pour en assigner.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activite.employes.map((e) => (
              <span key={e.id} className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {e.nom}
                <span className="text-xs text-gray-400">{e.fonction}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Commentaires + Pièces jointes */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CommentairesPanel activiteId={activite.id} />
        <PiecesJointesPanel activiteId={activite.id} />
      </div>

      {editionOuverte && (
        <ActiviteForm
          activite={activite}
          onFerme={() => setEditionOuverte(false)}
          onEnregistre={() => { setEditionOuverte(false); charger(); }}
        />
      )}
    </div>
  );
}

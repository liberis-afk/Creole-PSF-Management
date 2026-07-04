'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, MapPin, Ruler, CalendarClock, Scale } from 'lucide-react';
import type { CultureDetail } from '@/lib/cultures-types';
import { StatutBadge } from '@/components/cultures/badges';
import { CultureForm } from '@/components/cultures/culture-form';
import { CalendrierCultural } from '@/components/cultures/calendrier-cultural';
import { SuiviPanel } from '@/components/cultures/suivi-panel';
import { TraitementsPanel, RendementsPanel } from '@/components/cultures/traitements-rendements';
import { PhotoGallery } from '@/components/cultures/photo-gallery';

const dateFr = (iso: string | null) => (iso ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso)) : '—');

/**
 * Page détail d'une culture. Assemble le calendrier cultural, le suivi
 * sanitaire, les traitements, les rendements et les photos. Un compteur de
 * rafraîchissement permet de resynchroniser le calendrier après un nouveau
 * suivi (le stade actuel en dépend).
 */
export default function CultureDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [culture, setCulture] = useState<CultureDetail | null>(null);
  const [chargement, setChargement] = useState(true);
  const [introuvable, setIntrouvable] = useState(false);
  const [editionOuverte, setEditionOuverte] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [versionSuivi, setVersionSuivi] = useState(0);

  async function charger() {
    setChargement(true);
    try {
      const res = await fetch(`/api/cultures/${params.id}`, { cache: 'no-store' });
      if (res.status === 404) { setIntrouvable(true); return; }
      if (res.ok) setCulture(await res.json());
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function supprimer() {
    if (!confirm('Supprimer définitivement cette culture ?')) return;
    setSuppression(true);
    const res = await fetch(`/api/cultures/${params.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/cultures');
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.message ?? 'Suppression impossible');
      setSuppression(false);
    }
  }

  if (introuvable) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-950">
        <p className="text-sm text-gray-500 dark:text-gray-400">Cette culture est introuvable.</p>
        <Link href="/cultures" className="mt-3 inline-block text-sm text-brand-600 hover:underline">Retour à la liste</Link>
      </div>
    );
  }

  if (chargement || !culture) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-900" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900" />
      </div>
    );
  }

  const infos = [
    { icone: MapPin, label: 'Parcelle', valeur: `${culture.parcelle.nom} (${culture.parcelle.code})`, lien: `/parcelles/${culture.parcelle.id}` },
    { icone: CalendarClock, label: 'Plantation', valeur: dateFr(culture.datePlantation) },
    { icone: Ruler, label: 'Population', valeur: culture.population !== null ? culture.population.toLocaleString('fr-FR') : '—' },
    { icone: Scale, label: 'Rdt attendu', valeur: culture.rendementAttenduKg !== null ? `${culture.rendementAttenduKg.toLocaleString('fr-FR')} kg` : '—' },
  ];

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/cultures" className="mb-2 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="h-4 w-4" />
            Cultures
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{culture.nom}</h1>
            <StatutBadge statut={culture.statut} />
          </div>
          <p className="mt-0.5 text-sm text-gray-400">
            {culture.espece ?? 'Espèce non renseignée'}
            {culture.variete ? ` · ${culture.variete}` : ''}
          </p>
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

      {/* Cartes d'informations */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {infos.map((info) => (
          <div key={info.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center gap-1.5 text-gray-400">
              <info.icone className="h-4 w-4" />
              <span className="text-xs">{info.label}</span>
            </div>
            {info.lien ? (
              <Link href={info.lien} className="mt-1 block text-sm font-semibold text-gray-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-200">{info.valeur}</Link>
            ) : (
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{info.valeur}</p>
            )}
          </div>
        ))}
      </div>

      {/* Calendrier cultural (pleine largeur) */}
      <CalendrierCultural key={`cal-${versionSuivi}`} cultureId={culture.id} />

      {/* Suivi + Traitements */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SuiviPanel cultureId={culture.id} onChangement={() => setVersionSuivi((v) => v + 1)} />
        <TraitementsPanel cultureId={culture.id} />
      </div>

      {/* Rendements + Photos */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RendementsPanel cultureId={culture.id} />
        <PhotoGallery cultureId={culture.id} />
      </div>

      {editionOuverte && (
        <CultureForm
          culture={culture}
          onFerme={() => setEditionOuverte(false)}
          onEnregistre={() => { setEditionOuverte(false); charger(); }}
        />
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, MapPin, Ruler, Mountain, Beaker } from 'lucide-react';
import type { ParcelleDetail } from '@/lib/parcelles-types';
import { LIBELLE_DRAINAGE } from '@/lib/parcelles-types';
import { StatutBadge } from '@/components/parcelles/statut-badge';
import { ParcelleForm } from '@/components/parcelles/parcelle-form';
import { PhotoGallery } from '@/components/parcelles/photo-gallery';
import { HistoriquePanel } from '@/components/parcelles/historique-panel';

/**
 * Page détail d'une parcelle. Charge le détail côté client (position GPS
 * incluse), et compose les panneaux photos et historique. L'édition rouvre le
 * même formulaire modal que la création ; la suppression renvoie à la liste.
 */
export default function ParcelleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [parcelle, setParcelle] = useState<ParcelleDetail | null>(null);
  const [chargement, setChargement] = useState(true);
  const [introuvable, setIntrouvable] = useState(false);
  const [editionOuverte, setEditionOuverte] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  async function charger() {
    setChargement(true);
    try {
      const res = await fetch(`/api/parcelles/${params.id}`, { cache: 'no-store' });
      if (res.status === 404) {
        setIntrouvable(true);
        return;
      }
      if (res.ok) setParcelle(await res.json());
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function supprimer() {
    if (!confirm('Supprimer définitivement cette parcelle ?')) return;
    setSuppressionEnCours(true);
    const res = await fetch(`/api/parcelles/${params.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/parcelles');
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.message ?? 'Suppression impossible');
      setSuppressionEnCours(false);
    }
  }

  if (introuvable) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-950">
        <p className="text-sm text-gray-500 dark:text-gray-400">Cette parcelle est introuvable.</p>
        <Link href="/parcelles" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  if (chargement || !parcelle) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-900" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900" />
      </div>
    );
  }

  const infos: Array<{ icone: typeof Ruler; label: string; valeur: string }> = [
    { icone: Ruler, label: 'Superficie', valeur: `${parcelle.superficieHa.toLocaleString('fr-FR')} ha` },
    { icone: Mountain, label: 'Altitude', valeur: parcelle.altitude !== null ? `${parcelle.altitude} m` : '—' },
    { icone: Beaker, label: 'pH', valeur: parcelle.ph !== null ? String(parcelle.ph) : '—' },
  ];

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/parcelles"
            className="mb-2 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Parcelles
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{parcelle.nom}</h1>
            <StatutBadge statut={parcelle.statut} />
          </div>
          <p className="mt-0.5 font-mono text-xs text-gray-400">{parcelle.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditionOuverte(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </button>
          <button
            onClick={supprimer}
            disabled={suppressionEnCours}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Cartes d'informations */}
      <div className="grid grid-cols-3 gap-4">
        {infos.map((info) => (
          <div key={info.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center gap-1.5 text-gray-400">
              <info.icone className="h-4 w-4" />
              <span className="text-xs">{info.label}</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{info.valeur}</p>
          </div>
        ))}
      </div>

      {/* Détails du sol + position */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Caractéristiques</h3>
          <dl className="space-y-2.5 text-sm">
            {[
              ['Adresse', parcelle.adresse],
              ['Type de sol', parcelle.typeSol],
              ['Texture', parcelle.texture],
              ['Drainage', parcelle.drainage ? LIBELLE_DRAINAGE[parcelle.drainage] : null],
              ['Matière organique', parcelle.matiereOrganique !== null ? `${parcelle.matiereOrganique} %` : null],
            ].map(([label, valeur]) => (
              <div key={label} className="flex justify-between border-b border-gray-50 pb-2 last:border-0 dark:border-gray-900">
                <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{valeur ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
          <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
            <MapPin className="h-4 w-4 text-gray-400" />
            Position
          </h3>
          {parcelle.centroide ? (
            <div className="space-y-1 text-sm">
              <p className="text-gray-500 dark:text-gray-400">
                Latitude : <span className="font-mono text-gray-900 dark:text-white">{parcelle.centroide.coordinates[1].toFixed(6)}</span>
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Longitude : <span className="font-mono text-gray-900 dark:text-white">{parcelle.centroide.coordinates[0].toFixed(6)}</span>
              </p>
              {parcelle.contour && (
                <p className="mt-2 text-xs text-brand-600 dark:text-brand-300">Contour délimité · superficie calculée automatiquement</p>
              )}
              <Link href="/parcelles/carte" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
                Voir sur la carte
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Aucune position enregistrée. Ajoutez un point GPS en modifiant la parcelle, ou tracez son contour sur la carte.
            </p>
          )}
        </div>
      </div>

      {/* Photos + Historique */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PhotoGallery parcelleId={parcelle.id} />
        <HistoriquePanel parcelleId={parcelle.id} />
      </div>

      {editionOuverte && (
        <ParcelleForm
          parcelle={parcelle}
          onFerme={() => setEditionOuverte(false)}
          onEnregistre={() => {
            setEditionOuverte(false);
            charger();
          }}
        />
      )}
    </div>
  );
}

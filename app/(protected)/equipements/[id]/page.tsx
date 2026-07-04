'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, MapPin, User, Calendar, Coins } from 'lucide-react';
import type { EquipementDetail } from '@/lib/equipements-types';
import { LIBELLE_TYPE } from '@/lib/equipements-types';
import { EtatBadge } from '@/components/equipements/badges';
import { EquipementForm } from '@/components/equipements/equipement-form';
import { MaintenancePanel } from '@/components/equipements/maintenance-panel';
import { UtilisationPanel, HistoriqueResume } from '@/components/equipements/utilisation-panel';
import { PhotoGallery } from '@/components/equipements/photo-gallery';

const dateFr = (iso: string | null) => (iso ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso)) : '—');
const devise = (n: number | null) => (n !== null ? `${n.toLocaleString('fr-FR')} HTG` : '—');

/**
 * Page détail d'un équipement : informations, résumé de l'historique (coûts,
 * pannes, heures), maintenance, utilisation et photos. Une clé de version
 * resynchronise le résumé après chaque changement de maintenance/utilisation.
 */
export default function EquipementDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [equipement, setEquipement] = useState<EquipementDetail | null>(null);
  const [chargement, setChargement] = useState(true);
  const [introuvable, setIntrouvable] = useState(false);
  const [editionOuverte, setEditionOuverte] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [version, setVersion] = useState(0);

  async function charger() {
    setChargement(true);
    try {
      const res = await fetch(`/api/equipements/${params.id}`, { cache: 'no-store' });
      if (res.status === 404) { setIntrouvable(true); return; }
      if (res.ok) setEquipement(await res.json());
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function supprimer() {
    if (!confirm('Supprimer définitivement cet équipement ? Cette action effacera aussi son historique de maintenance et d\'utilisation.')) return;
    setSuppression(true);
    const res = await fetch(`/api/equipements/${params.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/equipements');
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.message ?? 'Suppression impossible');
      setSuppression(false);
    }
  }

  if (introuvable) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-950">
        <p className="text-sm text-gray-500 dark:text-gray-400">Cet équipement est introuvable.</p>
        <Link href="/equipements" className="mt-3 inline-block text-sm text-brand-600 hover:underline">Retour à la liste</Link>
      </div>
    );
  }

  if (chargement || !equipement) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-900" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900" />
      </div>
    );
  }

  const infos = [
    { icone: User, label: 'Responsable', valeur: equipement.responsable?.nom ?? '—' },
    { icone: MapPin, label: 'Localisation', valeur: equipement.localisation ?? '—' },
    { icone: Calendar, label: 'Acquisition', valeur: dateFr(equipement.dateAchat) },
    { icone: Coins, label: 'Valeur d\'achat', valeur: devise(equipement.coutAchat) },
  ];

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/equipements" className="mb-2 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="h-4 w-4" />
            Équipements
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{equipement.nom}</h1>
            <EtatBadge etat={equipement.etat} />
          </div>
          <p className="mt-0.5 text-sm text-gray-400">
            {LIBELLE_TYPE[equipement.type]}
            {equipement.marque || equipement.modele ? ` · ${[equipement.marque, equipement.modele].filter(Boolean).join(' ')}` : ''}
            {equipement.numeroSerie ? ` · ${equipement.numeroSerie}` : ''}
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

      {/* Infos clés */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {infos.map((info) => (
          <div key={info.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center gap-1.5 text-gray-400">
              <info.icone className="h-4 w-4" />
              <span className="text-xs">{info.label}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{info.valeur}</p>
          </div>
        ))}
      </div>

      {equipement.notes && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
          {equipement.notes}
        </div>
      )}

      {/* Résumé historique (coûts, pannes, heures) */}
      <HistoriqueResume equipementId={equipement.id} version={version} />

      {/* Maintenance + Utilisation */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <MaintenancePanel equipementId={equipement.id} onChangement={() => setVersion((v) => v + 1)} />
        <UtilisationPanel equipementId={equipement.id} onChangement={() => setVersion((v) => v + 1)} />
      </div>

      {/* Photos */}
      <PhotoGallery equipementId={equipement.id} />

      {editionOuverte && (
        <EquipementForm
          equipement={equipement}
          onFerme={() => setEditionOuverte(false)}
          onEnregistre={() => { setEditionOuverte(false); charger(); }}
        />
      )}
    </div>
  );
}

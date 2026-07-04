'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import type { Photo } from '@/lib/equipements-types';

/** Galerie photos d'un équipement (même pattern que parcelles/cultures). */
export function PhotoGallery({ equipementId }: { equipementId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function charger() {
    try {
      const res = await fetch(`/api/equipements/${equipementId}/photos`, { cache: 'no-store' });
      if (res.ok) setPhotos(await res.json());
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipementId]);

  async function onFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setErreur(null);
    setEnvoi(true);
    const formData = new FormData();
    formData.append('fichier', fichier);
    try {
      const res = await fetch(`/api/equipements/${equipementId}/photos`, { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErreur(data.message ?? "Échec de l'envoi");
      } else {
        await charger();
      }
    } catch {
      setErreur('Impossible de contacter le serveur');
    } finally {
      setEnvoi(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function supprimer(photoId: string) {
    await fetch(`/api/equipements/${equipementId}/photos/${photoId}`, { method: 'DELETE' });
    setPhotos((ps) => ps.filter((p) => p.id !== photoId));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Photos</h3>
        <button onClick={() => inputRef.current?.click()} disabled={envoi} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          <ImagePlus className="h-4 w-4" />
          {envoi ? 'Envoi…' : 'Ajouter'}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFichier} className="hidden" />
      </div>

      {erreur && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{erreur}</p>}

      {chargement ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-100 dark:bg-gray-900" />)}
        </div>
      ) : photos.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">Aucune photo pour cet équipement.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.titre} className="h-full w-full object-cover" />
              <button onClick={() => supprimer(photo.id)} className="absolute right-1.5 top-1.5 rounded bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600" aria-label="Supprimer la photo">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

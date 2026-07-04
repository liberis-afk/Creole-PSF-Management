'use client';

import { useEffect, useRef, useState } from 'react';
import { Paperclip, Trash2, FileText } from 'lucide-react';
import type { PieceJointe } from '@/lib/activites-types';

/** Pièces jointes d'une activité : images affichées en vignette, PDF en ligne. */
export function PiecesJointesPanel({ activiteId }: { activiteId: string }) {
  const [pieces, setPieces] = useState<PieceJointe[]>([]);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function charger() {
    try {
      const res = await fetch(`/api/activites/${activiteId}/pieces-jointes`, { cache: 'no-store' });
      if (res.ok) setPieces(await res.json());
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activiteId]);

  async function onFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setErreur(null);
    setEnvoi(true);
    const formData = new FormData();
    formData.append('fichier', fichier);
    try {
      const res = await fetch(`/api/activites/${activiteId}/pieces-jointes`, { method: 'POST', body: formData });
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

  async function supprimer(id: string) {
    await fetch(`/api/activites/${activiteId}/pieces-jointes/${id}`, { method: 'DELETE' });
    setPieces((ps) => ps.filter((p) => p.id !== id));
  }

  const images = pieces.filter((p) => p.estImage);
  const documents = pieces.filter((p) => !p.estImage);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Paperclip className="h-4 w-4 text-gray-400" />
          Pièces jointes
        </h3>
        <button onClick={() => inputRef.current?.click()} disabled={envoi} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          <Paperclip className="h-4 w-4" />
          {envoi ? 'Envoi…' : 'Ajouter'}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onFichier} className="hidden" />
      </div>

      {erreur && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{erreur}</p>}

      {chargement ? (
        <div className="h-16 animate-pulse rounded-lg bg-gray-50 dark:bg-gray-900" />
      ) : pieces.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">Aucune pièce jointe.</p>
      ) : (
        <div className="space-y-3">
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((p) => (
                <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.titre} className="h-full w-full object-cover" />
                  <button onClick={() => supprimer(p.id)} className="absolute right-1.5 top-1.5 rounded bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600" aria-label="Supprimer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {documents.length > 0 && (
            <ul className="space-y-1.5">
              {documents.map((p) => (
                <li key={p.id} className="group flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-700 dark:text-gray-300 dark:hover:text-brand-200">
                    <FileText className="h-4 w-4 text-gray-400" />
                    {p.titre}
                  </a>
                  <button onClick={() => supprimer(p.id)} className="rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100" aria-label="Supprimer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

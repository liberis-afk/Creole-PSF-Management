'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import type { Commentaire } from '@/lib/activites-types';

const dateHeureFr = (iso: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

/** Fil de commentaires d'une activité : liste chronologique + ajout. */
export function CommentairesPanel({ activiteId }: { activiteId: string }) {
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [contenu, setContenu] = useState('');
  const [envoi, setEnvoi] = useState(false);

  async function charger() {
    try {
      const res = await fetch(`/api/activites/${activiteId}/commentaires`, { cache: 'no-store' });
      if (res.ok) setCommentaires(await res.json());
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activiteId]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!contenu.trim()) return;
    setEnvoi(true);
    try {
      const res = await fetch(`/api/activites/${activiteId}/commentaires`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: contenu.trim() }),
      });
      if (res.ok) {
        setContenu('');
        await charger();
      }
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer(id: string) {
    const res = await fetch(`/api/activites/${activiteId}/commentaires/${id}`, { method: 'DELETE' });
    if (res.ok) setCommentaires((cs) => cs.filter((c) => c.id !== id));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
        <MessageSquare className="h-4 w-4 text-gray-400" />
        Commentaires
        {commentaires.length > 0 && <span className="text-xs font-normal text-gray-400">· {commentaires.length}</span>}
      </h3>

      {chargement ? (
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />)}</div>
      ) : commentaires.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">Aucun commentaire pour l&apos;instant.</p>
      ) : (
        <ul className="mb-4 space-y-3">
          {commentaires.map((c) => (
            <li key={c.id} className="group rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{c.auteur?.nom ?? 'Utilisateur'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{dateHeureFr(c.createdAt)}</span>
                  <button onClick={() => supprimer(c.id)} className="rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100" aria-label="Supprimer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{c.contenu}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={envoyer} className="flex items-end gap-2">
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          rows={1}
          placeholder="Ajouter un commentaire…"
          className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <button type="submit" disabled={envoi || !contenu.trim()} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

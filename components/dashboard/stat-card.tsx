'use client';

import type { LucideIcon } from 'lucide-react';

export type TonCarte = 'neutre' | 'succes' | 'danger' | 'alerte';

interface StatCardProps {
  label: string;
  valeur: string;
  icon: LucideIcon;
  /** Petite précision sous la valeur (ex. "sur 12 employés"). */
  detail?: string;
  /** Colore l'icône/accent selon le sens métier (profit positif vs négatif…). */
  ton?: TonCarte;
  /** Affiche un squelette pendant le chargement initial. */
  chargement?: boolean;
}

const TONS: Record<TonCarte, { fond: string; texte: string }> = {
  neutre: { fond: 'bg-gray-100 dark:bg-gray-800', texte: 'text-gray-600 dark:text-gray-300' },
  succes: { fond: 'bg-brand-50 dark:bg-brand-600/10', texte: 'text-brand-700 dark:text-brand-200' },
  danger: { fond: 'bg-red-50 dark:bg-red-500/10', texte: 'text-red-600 dark:text-red-400' },
  alerte: { fond: 'bg-amber-50 dark:bg-amber-500/10', texte: 'text-amber-600 dark:text-amber-400' },
};

/**
 * Carte statistique unique réutilisée par toutes les sections (Production, RH,
 * Finances…). Centraliser ce composant garantit que les ~15 indicateurs du
 * dashboard partagent exactement la même présentation, et qu'un ajustement de
 * style se fait en un seul endroit.
 */
export function StatCard({ label, valeur, icon: Icon, detail, ton = 'neutre', chargement }: StatCardProps) {
  const couleurs = TONS[ton];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
          {chargement ? (
            <div className="mt-2 h-7 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{valeur}</p>
          )}
          {detail && !chargement && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{detail}</p>
          )}
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${couleurs.fond}`}>
          <Icon className={`h-5 w-5 ${couleurs.texte}`} />
        </span>
      </div>
    </div>
  );
}

interface ChartCardProps {
  titre: string;
  sousTitre?: string;
  children: React.ReactNode;
  chargement?: boolean;
}

/**
 * Conteneur visuel commun à tous les graphiques (même hauteur, même en-tête,
 * même gestion du squelette de chargement). Évite de répéter la structure
 * carte + titre autour de chaque graphe.
 */
export function ChartCard({ titre, sousTitre, children, chargement }: ChartCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{titre}</h3>
        {sousTitre && <p className="text-xs text-gray-400 dark:text-gray-500">{sousTitre}</p>}
      </div>
      {chargement ? (
        <div className="h-56 animate-pulse rounded-lg bg-gray-50 dark:bg-gray-900" />
      ) : (
        <div className="h-56">{children}</div>
      )}
    </div>
  );
}

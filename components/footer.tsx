/**
 * Footer applicatif discret (pas un footer marketing). Dans un dashboard type
 * Stripe, le pied de page reste minimal : version, mentions, statut. Volontaire-
 * ment un composant serveur (aucune interactivité) — l'année est calculée au
 * rendu.
 */
export function Footer() {
  const annee = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500 sm:flex-row">
        <p>© {annee} Creole PSF Manage — Ferme Sociale Altruiste</p>
        <div className="flex items-center gap-4">
          <span>Version 1.0</span>
          <span className="hidden sm:inline">·</span>
          <a href="#" className="transition-colors hover:text-gray-600 dark:hover:text-gray-300">
            Aide
          </a>
          <a href="#" className="transition-colors hover:text-gray-600 dark:hover:text-gray-300">
            Confidentialité
          </a>
        </div>
      </div>
    </footer>
  );
}

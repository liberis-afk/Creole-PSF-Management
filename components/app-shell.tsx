'use client';

import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { useSidebar } from './sidebar-provider';

interface AppShellProps {
  nomComplet: string;
  email: string;
  role: string;
  ferme: string;
  children: React.ReactNode;
}

/**
 * Assemble la coquille. Le décalage horizontal du contenu (`lg:pl-*`) suit la
 * largeur de la sidebar desktop et doit donc réagir à `collapsed` — d'où le
 * besoin que ce composant consomme useSidebar(), ce qui le rend client. Le
 * contenu (children) reste, lui, rendu côté serveur : il est simplement passé
 * en prop et traverse cette coquille sans être « client-ifié ».
 *
 * L'overlay sombre n'apparaît qu'en mobile quand le tiroir est ouvert :
 * cliquer dessus referme le tiroir (pattern drawer standard).
 */
export function AppShell({ nomComplet, email, role, ferme, children }: AppShellProps) {
  const { collapsed, mobileOpen, closeMobile } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Colonne de contenu, décalée de la largeur de la sidebar en desktop */}
      <div className={`flex min-h-screen flex-col transition-all duration-200 ${collapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <Navbar nomComplet={nomComplet} email={email} role={role} ferme={ferme} />
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

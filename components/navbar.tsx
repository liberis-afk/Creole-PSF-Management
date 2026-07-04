'use client';

import { usePathname } from 'next/navigation';
import { Bell, Menu, Moon, PanelLeft, Search, Sun } from 'lucide-react';
import { NAV_ITEMS_FLAT } from '@/lib/navigation';
import { useSidebar } from './sidebar-provider';
import { useTheme } from './theme-provider';
import { UserMenu } from './user-menu';

interface NavbarProps {
  nomComplet: string;
  email: string;
  role: string;
  ferme: string;
}

/**
 * Barre supérieure. Le titre de page est dérivé automatiquement de la route
 * courante via NAV_ITEMS_FLAT — pas besoin que chaque page déclare son titre,
 * la source de navigation unique s'en charge.
 *
 * Deux contrôles de sidebar distincts, selon la taille d'écran :
 *   - hamburger (Menu) -> ouvre le tiroir mobile
 *   - PanelLeft         -> replie/déplie la sidebar desktop
 */
export function Navbar({ nomComplet, email, role, ferme }: NavbarProps) {
  const pathname = usePathname();
  const { openMobile, toggleCollapsed } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  const itemCourant = NAV_ITEMS_FLAT.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const titrePage = itemCourant?.label ?? 'Creole PSF Manage';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-gray-200 bg-white/80 px-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      {/* Ouverture tiroir mobile */}
      <button
        onClick={openMobile}
        className="rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Repli sidebar desktop */}
      <button
        onClick={toggleCollapsed}
        className="hidden rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:block"
        aria-label="Replier ou déplier la barre latérale"
      >
        <PanelLeft className="h-5 w-5" />
      </button>

      <div className="flex flex-col">
        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">{titrePage}</h1>
        <span className="text-xs text-gray-400 dark:text-gray-500">{ferme}</span>
      </div>

      {/* Recherche — placeholder visuel (pas de logique tant que les modules
          ne sont pas là, mais l'emplacement Stripe-like est posé) */}
      <div className="ml-auto hidden items-center md:flex">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Rechercher…"
            className="w-56 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm outline-none placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:focus:bg-gray-900"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1 md:ml-2">
        {/* Bascule de thème rapide (doublon volontaire du menu utilisateur —
            un accès direct est attendu dans une barre pro type Stripe) */}
        <button
          onClick={toggleTheme}
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Basculer le thème"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications — pastille statique tant que le Module 16 n'est pas là */}
        <button
          className="relative rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-600" />
        </button>

        <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-800" />

        <UserMenu nomComplet={nomComplet} email={email} role={role} />
      </div>
    </header>
  );
}

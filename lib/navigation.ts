import {
  LayoutDashboard,
  Map,
  Sprout,
  CalendarDays,
  Users,
  Tractor,
  Boxes,
  Wallet,
  Droplets,
  Wheat,
  ShoppingCart,
  FileText,
  BarChart3,
  MapPinned,
  Bell,
  Settings,
  LineChart,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  /** Libellé affiché. */
  label: string;
  /** Route Next.js. */
  href: string;
  /** Icône Lucide. */
  icon: LucideIcon;
  /**
   * Code de permission requis pour VOIR l'entrée (optionnel).
   * Le masquage ici est purement cosmétique — l'autorisation réelle reste
   * imposée par l'API (PermissionsGuard). On n'affiche pas un lien vers une
   * page à laquelle l'utilisateur n'a de toute façon pas accès.
   */
  permission?: string;
}

export interface NavSection {
  /** Titre de section (null = pas d'en-tête, comme pour le Tableau de bord). */
  title: string | null;
  items: NavItem[];
}

/**
 * Navigation complète, groupée par domaine fonctionnel — à l'image de Stripe
 * qui sépare visuellement ses grandes familles. Ajouter un futur module
 * (Élevage, Capteurs IoT…) = ajouter une ligne ici, rien d'autre : la
 * sidebar, le fil d'Ariane et le titre de page en découlent automatiquement.
 *
 * Les href pointent vers des routes qui n'existent pas encore (sauf
 * /dashboard) : c'est volontaire. Ce livrable ne construit que la coquille ;
 * chaque module remplira sa route en temps voulu.
 */
export const NAVIGATION: NavSection[] = [
  {
    title: null,
    items: [{ label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Exploitation',
    items: [
      { label: 'Parcelles', href: '/parcelles', icon: Map },
      { label: 'Cultures', href: '/cultures', icon: Sprout },
      { label: 'Calendrier', href: '/calendrier', icon: CalendarDays },
      { label: 'Récoltes', href: '/recoltes', icon: Wheat },
      { label: 'Irrigation', href: '/irrigation', icon: Droplets },
      { label: 'Cartographie', href: '/cartographie', icon: MapPinned },
    ],
  },
  {
    title: 'Ressources',
    items: [
      { label: 'Employés', href: '/employes', icon: Users },
      { label: 'Équipements', href: '/equipements', icon: Tractor },
      { label: 'Stocks', href: '/stocks', icon: Boxes },
    ],
  },
  {
    title: 'Commerce & Finances',
    items: [
      { label: 'Ventes', href: '/ventes', icon: ShoppingCart },
      { label: 'Finances', href: '/finances', icon: Wallet, permission: 'finances.consulter' },
    ],
  },
  {
    title: 'Pilotage',
    items: [
      { label: 'Analyses', href: '/analyses', icon: LineChart },
      { label: 'Rapports', href: '/rapports', icon: BarChart3 },
      { label: 'Documents', href: '/documents', icon: FileText },
    ],
  },
  {
    title: 'Système',
    items: [
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Paramètres', href: '/parametres', icon: Settings, permission: 'parametres.gerer' },
    ],
  },
];

/** Aplatit la navigation en liste simple — utile pour le titre de page et le fil d'Ariane. */
export const NAV_ITEMS_FLAT: NavItem[] = NAVIGATION.flatMap((section) => section.items);

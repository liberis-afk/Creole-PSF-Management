import { DashboardContent } from '@/components/dashboard/dashboard-content';

/**
 * Page du Tableau de bord (Module 2). Volontairement mince : elle ne fait que
 * monter le composant client dynamique. Toute la logique de récupération et de
 * rafraîchissement vit dans DashboardContent / useDashboard, et l'agrégation
 * réelle dans le DashboardService côté API.
 *
 * Le profil et la ferme active sont déjà résolus par le layout protégé
 * (couche parente) ; cette page n'a donc pas à les recharger.
 */
export default function DashboardPage() {
  return <DashboardContent />;
}

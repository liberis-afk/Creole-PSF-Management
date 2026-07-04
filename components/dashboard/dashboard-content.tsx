'use client';

import {
  Sprout,
  Ruler,
  Wheat,
  TrendingUp,
  Users,
  UserX,
  Activity,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  AlertTriangle,
  Droplets,
  Gauge,
  RefreshCw,
} from 'lucide-react';
import { useDashboard } from '@/lib/use-dashboard';
import { StatCard } from './stat-card';
import { ChartCard } from './chart-card';
import { GraphiqueFinances, GraphiqueProduction, GraphiqueEau, GraphiqueRentabilite } from './charts';
import { ActivitesRecentes } from './activites-recentes';
import { AlertesStock } from './alertes-stock';
import { BandeauKpi } from './bandeau-kpi';
import { formaterDevise, formaterHeure, formaterNombre } from './format';

/**
 * Orchestrateur du tableau de bord. Consomme useDashboard (chargement +
 * rafraîchissement périodique) et distribue les données aux composants de
 * présentation, qui restent "bêtes" (ils reçoivent des props, ne fetchent
 * rien). Cette séparation permet de tester/réutiliser chaque carte isolément
 * et de brancher plus tard une autre source (WebSocket) sans toucher aux vues.
 */
export function DashboardContent() {
  const { data, chargementInitial, enRafraichissement, erreur, rafraichir } = useDashboard();

  if (erreur && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/20 dark:bg-red-500/10">
        <p className="text-sm text-red-600 dark:text-red-400">{erreur}</p>
        <button
          onClick={rafraichir}
          className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const devise = data?.finances.devise ?? 'HTG';

  return (
    <div className="space-y-6">
      {/* En-tête avec état de rafraîchissement */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Vue d'ensemble</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {data ? `Mis à jour à ${formaterHeure(data.genereLe)}` : 'Chargement…'}
          </p>
        </div>
        <button
          onClick={rafraichir}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
        >
          <RefreshCw className={`h-4 w-4 ${enRafraichissement ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* SECTION PRODUCTION */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Production
        </h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Cultures actives" valeur={formaterNombre(data?.production.culturesActives ?? 0)} icon={Sprout} ton="succes" chargement={chargementInitial} />
          <StatCard label="Superficie cultivée" valeur={`${formaterNombre(data?.production.superficieCultiveeHa ?? 0)} ha`} icon={Ruler} chargement={chargementInitial} />
          <StatCard label="Rendement estimé" valeur={`${formaterNombre(data?.production.rendementEstimeKg ?? 0)} kg`} icon={Wheat} chargement={chargementInitial} />
          <StatCard label="Rendement réel" valeur={`${formaterNombre(data?.production.rendementReelKg ?? 0)} kg`} icon={TrendingUp} ton="succes" chargement={chargementInitial} />
        </div>
      </section>

      {/* SECTION RH + FINANCES sur une trame commune */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Ressources humaines &amp; finances
        </h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Employés présents" valeur={formaterNombre(data?.rh.employesPresents ?? 0)} detail={`sur ${data?.rh.effectifActif ?? 0} actifs`} icon={Users} ton="succes" chargement={chargementInitial} />
          <StatCard label="Employés absents" valeur={formaterNombre(data?.rh.employesAbsents ?? 0)} icon={UserX} ton={(data?.rh.employesAbsents ?? 0) > 0 ? 'alerte' : 'neutre'} chargement={chargementInitial} />
          <StatCard label="Activités en cours" valeur={formaterNombre(data?.rh.activitesEnCours ?? 0)} icon={Activity} chargement={chargementInitial} />
          <StatCard
            label="Profit du mois"
            valeur={formaterDevise(data?.finances.profitMois ?? 0, devise)}
            icon={Wallet}
            ton={(data?.finances.profitMois ?? 0) >= 0 ? 'succes' : 'danger'}
            chargement={chargementInitial}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Revenus du mois" valeur={formaterDevise(data?.finances.revenusMois ?? 0, devise)} icon={ArrowUpCircle} ton="succes" chargement={chargementInitial} />
          <StatCard label="Dépenses du mois" valeur={formaterDevise(data?.finances.depensesMois ?? 0, devise)} icon={ArrowDownCircle} ton="danger" chargement={chargementInitial} />
          <StatCard
            label="Budget restant"
            valeur={data?.finances.budgetRestant === null || data?.finances.budgetRestant === undefined ? '—' : formaterDevise(data.finances.budgetRestant, devise)}
            icon={Wallet}
            ton={(data?.finances.budgetRestant ?? 0) < 0 ? 'danger' : 'neutre'}
            chargement={chargementInitial}
          />
          <StatCard label="Alertes stock" valeur={formaterNombre(data?.stocks.alertesActives ?? 0)} icon={AlertTriangle} ton={(data?.stocks.alertesActives ?? 0) > 0 ? 'alerte' : 'neutre'} chargement={chargementInitial} />
        </div>
      </section>

      {/* SECTION STOCKS + IRRIGATION */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Stocks &amp; irrigation
        </h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Articles en stock" valeur={formaterNombre(data?.stocks.articlesTotal ?? 0)} icon={Boxes} chargement={chargementInitial} />
          <StatCard label="Produits critiques" valeur={formaterNombre(data?.stocks.articlesCritiques ?? 0)} icon={AlertTriangle} ton={(data?.stocks.articlesCritiques ?? 0) > 0 ? 'alerte' : 'neutre'} chargement={chargementInitial} />
          <StatCard label="Pompes actives" valeur={formaterNombre(data?.irrigation.pompesActives ?? 0)} detail={`${data?.irrigation.systemesActifs ?? 0} systèmes`} icon={Gauge} chargement={chargementInitial} />
          <StatCard label="Consommation d'eau" valeur={formaterNombre(data?.irrigation.consommationEau ?? 0)} icon={Droplets} chargement={chargementInitial} />
        </div>
      </section>

      {/* GRAPHIQUES */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard titre="Revenus & dépenses" sousTitre="6 derniers mois" chargement={chargementInitial}>
          {data && <GraphiqueFinances depenses={data.graphiques.depensesMensuelles} revenus={data.graphiques.revenusMensuels} />}
        </ChartCard>
        <ChartCard titre="Rentabilité" sousTitre="Profit mensuel" chargement={chargementInitial}>
          {data && <GraphiqueRentabilite depenses={data.graphiques.depensesMensuelles} revenus={data.graphiques.revenusMensuels} />}
        </ChartCard>
        <ChartCard titre="Production" sousTitre="Récoltes mensuelles (kg)" chargement={chargementInitial}>
          {data && <GraphiqueProduction donnees={data.graphiques.productionMensuelle} />}
        </ChartCard>
        <ChartCard titre="Consommation d'eau" sousTitre="6 derniers mois" chargement={chargementInitial}>
          {data && <GraphiqueEau donnees={data.graphiques.consommationEau} />}
        </ChartCard>
      </section>

      {/* KPI ANALYTIQUES */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Indicateurs de performance
        </h3>
        <BandeauKpi kpis={data?.kpis ?? { rendementParHa: null, coutParHa: null, profitParHa: null, productiviteEmployes: null }} devise={devise} chargement={chargementInitial} />
      </section>

      {/* TABLEAUX / WIDGETS */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ActivitesRecentes activites={data?.activitesRecentes ?? []} chargement={chargementInitial} />
        <AlertesStock alertes={data?.alertesStock ?? []} chargement={chargementInitial} />
      </section>
    </div>
  );
}

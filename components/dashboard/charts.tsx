'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PointSerie } from '@/lib/dashboard-types';
import { formaterMoisCourt, formaterNombre } from './format';

/**
 * Les couleurs sont passées en dur en hex plutôt qu'en variables CSS car
 * recharts rend en SVG et ne lit pas les classes Tailwind. Le vert de marque
 * (#15803d) et les gris sont donc répétés ici — c'est la seule entorse
 * assumée à la centralisation des couleurs, imposée par la librairie.
 *
 * Chaque graphe reçoit ses données déjà agrégées par le backend (6 points
 * mensuels) : aucun calcul lourd côté client.
 */

const VERT = '#15803d';
const BLEU = '#2563eb';
const ROUGE = '#dc2626';
const AMBRE = '#d97706';

const axeStyle = { fontSize: 11, fill: '#9ca3af' };

function fusionnerFinances(depenses: PointSerie[], revenus: PointSerie[]) {
  return depenses.map((d, i) => ({
    periode: formaterMoisCourt(d.periode),
    depenses: d.valeur,
    revenus: revenus[i]?.valeur ?? 0,
  }));
}

export function GraphiqueFinances({ depenses, revenus }: { depenses: PointSerie[]; revenus: PointSerie[] }) {
  const donnees = fusionnerFinances(depenses, revenus);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={donnees} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="periode" tick={axeStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axeStyle} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          formatter={(v: number) => formaterNombre(v)}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="revenus" name="Revenus" fill={VERT} radius={[3, 3, 0, 0]} />
        <Bar dataKey="depenses" name="Dépenses" fill={ROUGE} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GraphiqueProduction({ donnees }: { donnees: PointSerie[] }) {
  const data = donnees.map((d) => ({ periode: formaterMoisCourt(d.periode), valeur: d.valeur }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="periode" tick={axeStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axeStyle} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          formatter={(v: number) => `${formaterNombre(v)} kg`}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Line type="monotone" dataKey="valeur" name="Production" stroke={VERT} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GraphiqueEau({ donnees }: { donnees: PointSerie[] }) {
  const data = donnees.map((d) => ({ periode: formaterMoisCourt(d.periode), valeur: d.valeur }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gradEau" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={BLEU} stopOpacity={0.3} />
            <stop offset="95%" stopColor={BLEU} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="periode" tick={axeStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axeStyle} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          formatter={(v: number) => formaterNombre(v)}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Area type="monotone" dataKey="valeur" name="Consommation d'eau" stroke={BLEU} fill="url(#gradEau)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GraphiqueRentabilite({ depenses, revenus }: { depenses: PointSerie[]; revenus: PointSerie[] }) {
  const data = depenses.map((d, i) => ({
    periode: formaterMoisCourt(d.periode),
    profit: (revenus[i]?.valeur ?? 0) - d.valeur,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="periode" tick={axeStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axeStyle} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          formatter={(v: number) => formaterNombre(v)}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Line type="monotone" dataKey="profit" name="Profit" stroke={AMBRE} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

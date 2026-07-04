import { NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api-server';
import type { DashboardData } from '@/lib/dashboard-types';

/**
 * Le composant client (useDashboard) fetch CETTE route, pas l'API NestJS
 * directement — ainsi le cookie d'accès httpOnly (illisible en JS) est lu
 * côté serveur par apiServerFetch et transformé en Bearer vers l'API. Le
 * navigateur ne manipule jamais le token, cohérent avec le reste du BFF.
 */
export async function GET() {
  const { ok, status, data } = await apiServerFetch<DashboardData>('/dashboard');

  if (!ok || !data) {
    return NextResponse.json({ message: 'Échec du chargement du tableau de bord' }, { status });
  }

  return NextResponse.json(data);
}

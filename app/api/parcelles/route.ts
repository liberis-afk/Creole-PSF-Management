import { NextRequest, NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api-server';

/**
 * Liste paginée. On relaie la query string telle quelle vers l'API (filtres,
 * recherche, pagination, tri) — le navigateur ne parle jamais directement à
 * NestJS, le cookie d'accès est injecté côté serveur.
 */
export async function GET(request: NextRequest) {
  const qs = request.nextUrl.search; // inclut le "?" et tous les paramètres
  const { ok, status, data } = await apiServerFetch(`/parcelles${qs}`);
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 200 : status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { ok, status, data } = await apiServerFetch('/parcelles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 201 : status });
}

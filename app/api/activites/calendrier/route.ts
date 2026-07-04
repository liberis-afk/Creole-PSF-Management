import { NextRequest, NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api-server';
export async function GET(request: NextRequest) {
  const { ok, status, data } = await apiServerFetch(`/activites/calendrier${request.nextUrl.search}`);
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 200 : status });
}

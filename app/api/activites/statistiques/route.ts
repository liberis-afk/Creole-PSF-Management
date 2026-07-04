import { NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api-server';
export async function GET() {
  const { ok, status, data } = await apiServerFetch('/activites/statistiques');
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 200 : status });
}

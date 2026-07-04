import { NextRequest, NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api-server';

export async function GET(_r: NextRequest, { params }: { params: { id: string } }) {
  const { ok, status, data } = await apiServerFetch(`/cultures/${params.id}/rendements`);
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 200 : status });
}

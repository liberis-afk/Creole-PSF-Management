import { NextRequest, NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api-server';
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { ok, status, data } = await apiServerFetch(`/activites/${params.id}/employes`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 200 : status });
}

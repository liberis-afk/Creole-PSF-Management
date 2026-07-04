import { NextRequest, NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api-server';

interface Params {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { ok, status, data } = await apiServerFetch(`/parcelles/${params.id}`);
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 200 : status });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const { ok, status, data } = await apiServerFetch(`/parcelles/${params.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 200 : status });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { ok, status, data } = await apiServerFetch(`/parcelles/${params.id}`, { method: 'DELETE' });
  if (ok) return new NextResponse(null, { status: 204 });
  return NextResponse.json(data ?? { message: 'Erreur' }, { status });
}

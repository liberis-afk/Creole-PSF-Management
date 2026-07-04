import { NextRequest, NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api-server';

interface Params { params: { id: string } }

export async function GET(_r: NextRequest, { params }: Params) {
  const { ok, status, data } = await apiServerFetch(`/cultures/${params.id}`);
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 200 : status });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const { ok, status, data } = await apiServerFetch(`/cultures/${params.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 200 : status });
}

export async function DELETE(_r: NextRequest, { params }: Params) {
  const { ok, status, data } = await apiServerFetch(`/cultures/${params.id}`, { method: 'DELETE' });
  if (ok) return new NextResponse(null, { status: 204 });
  return NextResponse.json(data ?? { message: 'Erreur' }, { status });
}

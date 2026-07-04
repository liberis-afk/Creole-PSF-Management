import { NextRequest, NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api-server';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { ok, status, data } = await apiServerFetch(`/parcelles/${params.id}/analyses-sol`);
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 200 : status });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { ok, status, data } = await apiServerFetch(`/parcelles/${params.id}/analyses-sol`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 201 : status });
}

import { NextRequest, NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api-server';

export async function GET(request: NextRequest) {
  const qs = request.nextUrl.search;
  const { ok, status, data } = await apiServerFetch(`/equipements${qs}`);
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 200 : status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { ok, status, data } = await apiServerFetch('/equipements', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 201 : status });
}

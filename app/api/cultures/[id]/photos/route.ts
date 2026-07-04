import { NextRequest, NextResponse } from 'next/server';
import { apiServerFetch, apiServerRaw } from '@/lib/api-server';

export async function GET(_r: NextRequest, { params }: { params: { id: string } }) {
  const { ok, status, data } = await apiServerFetch(`/cultures/${params.id}/photos`);
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 200 : status });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData();
  const res = await apiServerRaw(`/cultures/${params.id}/photos`, { method: 'POST', body: formData });
  const data = await res.json().catch(() => ({ message: 'Erreur' }));
  return NextResponse.json(data, { status: res.status });
}

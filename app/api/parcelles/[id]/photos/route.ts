import { NextRequest, NextResponse } from 'next/server';
import { apiServerFetch, apiServerRaw } from '@/lib/api-server';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { ok, status, data } = await apiServerFetch(`/parcelles/${params.id}/photos`);
  return NextResponse.json(data ?? { message: 'Erreur' }, { status: ok ? 200 : status });
}

/**
 * Upload multipart : on relaie le FormData tel quel vers l'API (on ne fixe pas
 * le Content-Type manuellement — fetch calcule la boundary multipart lui-même
 * à partir du FormData). apiServerRaw ajoute le Bearer sans toucher au corps.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData();
  const res = await apiServerRaw(`/parcelles/${params.id}/photos`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json().catch(() => ({ message: 'Erreur' }));
  return NextResponse.json(data, { status: res.status });
}

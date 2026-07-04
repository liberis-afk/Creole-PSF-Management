import { NextRequest, NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api-server';
export async function DELETE(_r: NextRequest, { params }: { params: { id: string; pieceId: string } }) {
  const { ok, status, data } = await apiServerFetch(`/activites/${params.id}/pieces-jointes/${params.pieceId}`, { method: 'DELETE' });
  if (ok) return new NextResponse(null, { status: 204 });
  return NextResponse.json(data ?? { message: 'Erreur' }, { status });
}

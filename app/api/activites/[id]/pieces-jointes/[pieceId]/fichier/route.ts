import { NextRequest, NextResponse } from 'next/server';
import { apiServerRaw } from '@/lib/api-server';
export async function GET(_r: NextRequest, { params }: { params: { id: string; pieceId: string } }) {
  const res = await apiServerRaw(`/activites/${params.id}/pieces-jointes/${params.pieceId}/fichier`);
  if (!res.ok || !res.body) return NextResponse.json({ message: 'Pièce introuvable' }, { status: res.status });
  return new NextResponse(res.body, {
    status: 200,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/octet-stream', 'Cache-Control': 'private, max-age=300' },
  });
}

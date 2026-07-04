import { NextRequest, NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api-server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; photoId: string } },
) {
  const { ok, status, data } = await apiServerFetch(
    `/parcelles/${params.id}/photos/${params.photoId}`,
    { method: 'DELETE' },
  );
  if (ok) return new NextResponse(null, { status: 204 });
  return NextResponse.json(data ?? { message: 'Erreur' }, { status });
}

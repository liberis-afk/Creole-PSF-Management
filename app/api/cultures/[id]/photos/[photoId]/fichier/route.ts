import { NextRequest, NextResponse } from 'next/server';
import { apiServerRaw } from '@/lib/api-server';

export async function GET(_r: NextRequest, { params }: { params: { id: string; photoId: string } }) {
  const res = await apiServerRaw(`/cultures/${params.id}/photos/${params.photoId}/fichier`);
  if (!res.ok || !res.body) {
    return NextResponse.json({ message: 'Photo introuvable' }, { status: res.status });
  }
  return new NextResponse(res.body, {
    status: 200,
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=300',
    },
  });
}

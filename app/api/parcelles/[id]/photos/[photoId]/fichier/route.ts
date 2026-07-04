import { NextRequest, NextResponse } from 'next/server';
import { apiServerRaw } from '@/lib/api-server';

/**
 * Relaie le flux binaire de la photo depuis l'API (qui l'a lu sur le disque)
 * vers le navigateur, en conservant le Content-Type. On ne met pas en cache
 * agressivement : les URLs contiennent l'id du document, stable, mais le
 * contrôle d'accès reste vérifié à chaque requête côté API.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; photoId: string } },
) {
  const res = await apiServerRaw(`/parcelles/${params.id}/photos/${params.photoId}/fichier`);

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

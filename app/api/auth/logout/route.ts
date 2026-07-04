import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, COOKIE_ACCESS, COOKIE_REFRESH } from '@/lib/auth-constants';

/**
 * Déconnexion : demande à l'API de révoquer la session (le refresh token
 * devient inutilisable en base), PUIS efface les deux cookies côté
 * navigateur. On efface les cookies même si l'appel API échoue — l'objectif
 * côté utilisateur (ne plus être connecté sur cet appareil) doit toujours
 * être atteint.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(COOKIE_REFRESH)?.value;

  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Révocation côté serveur impossible (API down) : on efface quand même
      // les cookies locaux ci-dessous.
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_ACCESS);
  response.cookies.delete(COOKIE_REFRESH);
  return response;
}

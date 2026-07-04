import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/auth-constants';
import { poserCookiesEtRepondre } from '@/lib/set-auth-cookies';

/**
 * BFF : reçoit email/password du navigateur, appelle l'API NestJS côté
 * serveur, et — selon la réponse — soit pose les cookies httpOnly (compte
 * mono-ferme), soit renvoie au navigateur le preAuthToken + la liste des
 * fermes (compte multi-fermes) SANS poser de cookie encore.
 *
 * Le navigateur ne reçoit jamais l'access/refresh token en clair : ils sont
 * transformés en cookies httpOnly ici, côté serveur.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const apiResponse = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await apiResponse.json();

  if (!apiResponse.ok) {
    return NextResponse.json(data, { status: apiResponse.status });
  }

  // Compte multi-fermes : on transmet tel quel, la sélection se fera ensuite.
  if (data.statut === 'SELECTION_FERME_REQUISE') {
    return NextResponse.json(data);
  }

  return poserCookiesEtRepondre(data);
}

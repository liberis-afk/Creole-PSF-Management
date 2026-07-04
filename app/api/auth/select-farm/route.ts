import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/auth-constants';
import { poserCookiesEtRepondre } from '@/lib/set-auth-cookies';

/**
 * Étape 2 du flux multi-fermes : le navigateur renvoie le preAuthToken + la
 * ferme choisie ; on obtient de l'API les vrais tokens et on les pose en
 * cookies (même logique que login).
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const apiResponse = await fetch(`${API_BASE_URL}/auth/select-farm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await apiResponse.json();

  if (!apiResponse.ok) {
    return NextResponse.json(data, { status: apiResponse.status });
  }

  return poserCookiesEtRepondre(data);
}

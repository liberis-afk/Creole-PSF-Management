import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, COOKIE_REFRESH } from '@/lib/auth-constants';
import { poserCookiesEtRepondre } from '@/lib/set-auth-cookies';

/**
 * Renouvelle les tokens à partir du cookie refresh httpOnly. Appelé par le
 * client quand une requête API renvoie 401, avant de réessayer. Le refresh
 * token n'est jamais manipulé par le JavaScript du navigateur : il est lu
 * ici côté serveur depuis le cookie.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(COOKIE_REFRESH)?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: 'Aucune session' }, { status: 401 });
  }

  const apiResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await apiResponse.json();

  if (!apiResponse.ok) {
    return NextResponse.json(data, { status: apiResponse.status });
  }

  return poserCookiesEtRepondre(data);
}

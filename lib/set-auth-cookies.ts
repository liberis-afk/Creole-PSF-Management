import { NextResponse } from 'next/server';
import { COOKIE_ACCESS, COOKIE_REFRESH, cookieBaseOptions } from './auth-constants';

interface ReponseTokens {
  accessToken: string;
  refreshToken: string;
  [key: string]: unknown;
}

/**
 * Transforme la réponse tokens de l'API en réponse HTTP posant les deux
 * cookies httpOnly, et retire les tokens du corps JSON renvoyé au navigateur
 * (il ne doit jamais les voir en clair).
 *
 * Factorisé ici (et non dans un route handler) parce que trois route
 * handlers l'utilisent — login, select-farm, refresh. Un route handler ne
 * doit exporter que ses fonctions HTTP (GET/POST/…), pas des utilitaires
 * partagés : les placer dans lib/ garde cette règle propre.
 */
export function poserCookiesEtRepondre(data: ReponseTokens): NextResponse {
  const { accessToken, refreshToken, ...safe } = data;

  const response = NextResponse.json(safe);
  response.cookies.set(COOKIE_ACCESS, accessToken, cookieBaseOptions);
  response.cookies.set(COOKIE_REFRESH, refreshToken, cookieBaseOptions);
  return response;
}

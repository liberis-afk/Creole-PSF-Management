import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { COOKIE_ACCESS, COOKIE_REFRESH } from '@/lib/auth-constants';

/**
 * Protection des routes au niveau du edge, AVANT même que la page ne soit
 * rendue. Deux directions :
 *   - Route protégée sans session valide -> redirection vers /login.
 *   - Route /login avec session déjà valide -> redirection vers /dashboard
 *     (évite qu'un utilisateur connecté revoie le formulaire de connexion).
 *
 * Le middleware ne fait qu'une vérification LOCALE de la signature et de
 * l'expiration du token (rapide, pas d'appel réseau). Il ne vérifie PAS les
 * permissions fines : ça reste la responsabilité de l'API (PermissionsGuard),
 * seule source de vérité. Le middleware est un filtre de première ligne, pas
 * le contrôle d'autorisation final.
 */

const CHEMINS_PUBLICS = ['/login'];

const accessSecret = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
);

async function tokenEstValide(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, accessSecret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get(COOKIE_ACCESS)?.value;
  const refreshToken = request.cookies.get(COOKIE_REFRESH)?.value;
  const accesValide = await tokenEstValide(accessToken);

  const estCheminPublic = CHEMINS_PUBLICS.some((chemin) => pathname.startsWith(chemin));

  // Déjà connecté et sur /login -> vers le dashboard.
  if (estCheminPublic) {
    if (accesValide) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Route protégée avec access token valide -> on laisse passer.
  if (accesValide) {
    return NextResponse.next();
  }

  // Access token absent/expiré MAIS refresh token présent : on laisse passer
  // vers la page, qui déclenchera un /api/auth/refresh côté client. Sans ce
  // cas, l'utilisateur serait déconnecté toutes les 15 min à l'expiration de
  // l'access token, ce qui ruinerait l'intérêt du refresh token.
  if (refreshToken) {
    return NextResponse.next();
  }

  // Aucune session : redirection vers login, en mémorisant la destination.
  const urlLogin = new URL('/login', request.url);
  urlLogin.searchParams.set('redirect', pathname);
  return NextResponse.redirect(urlLogin);
}

/**
 * Le matcher exclut les assets statiques et les route handlers /api/auth
 * (qui doivent rester accessibles sans session — c'est par eux qu'on se
 * connecte).
 */
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|globals.css).*)'],
};

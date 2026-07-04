/**
 * Constantes partagées par les route handlers et le middleware.
 * Centralisées ici pour qu'un nom de cookie ne soit jamais écrit "à la main"
 * à deux endroits (source classique de bug où le middleware lit un cookie
 * que personne ne pose).
 */

export const COOKIE_ACCESS = 'psf_access';
export const COOKIE_REFRESH = 'psf_refresh';

/** URL de l'API NestJS, appelée UNIQUEMENT côté serveur (jamais depuis le navigateur). */
export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001/api/v1';

/**
 * Options communes des cookies. httpOnly = le JavaScript du navigateur ne
 * peut pas lire le token (protection contre le vol de token par XSS).
 * secure = uniquement en HTTPS hors développement.
 */
export const cookieBaseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

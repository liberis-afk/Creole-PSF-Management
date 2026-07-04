import { cookies } from 'next/headers';
import { API_BASE_URL, COOKIE_ACCESS } from './auth-constants';

/**
 * Appel authentifié à l'API NestJS depuis un Server Component / une action
 * serveur / un route handler. Lit le cookie d'accès httpOnly et l'envoie en
 * Bearer à l'API.
 */
export async function apiServerFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const accessToken = cookies().get(COOKIE_ACCESS)?.value;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: 'no-store',
  });

  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    data = null;
  }

  return { ok: res.ok, status: res.status, data };
}

/**
 * Variante bas niveau qui renvoie la Response brute (sans parser le JSON).
 * Utile pour proxifier tel quel un flux binaire (photos) ou une réponse
 * multipart vers le navigateur, sans la désérialiser inutilement.
 */
export async function apiServerRaw(path: string, init?: RequestInit): Promise<Response> {
  const accessToken = cookies().get(COOKIE_ACCESS)?.value;
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: 'no-store',
  });
}

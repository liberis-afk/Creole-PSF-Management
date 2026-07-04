import { Request } from 'express';

/**
 * Forme exacte de ce que JwtAccessStrategy.validate() retourne — Passport
 * attache automatiquement cette valeur à `request.user`. Typé explicitement
 * ici pour que @CurrentUser() et PermissionsGuard n'aient jamais besoin de
 * `any`.
 */
export interface AuthenticatedUser {
  userId: string;
  fermeId: string;
  roleId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

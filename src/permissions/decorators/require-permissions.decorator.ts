import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Marque un handler (ou tout un contrôleur) comme exigeant une ou plusieurs
 * permissions. Lu par PermissionsGuard. Volontairement une liste de CODES
 * ("employes.salaires.voir"), jamais un nom de rôle — conformément à la
 * règle d'architecture : aucune permission codée en dur par rôle dans le
 * code (if (role === 'admin') est interdit par convention).
 *
 * Exemple :
 *   @RequirePermissions('auth.sessions.voir')
 *   @Get('sessions')
 *   getSessions() { ... }
 */
export const RequirePermissions = (...permissionCodes: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissionCodes);

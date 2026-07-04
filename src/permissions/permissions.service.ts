import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';

/**
 * Résout la liste des codes de permission ("finances.depenses.creer", ...)
 * effectivement accordés à un rôle. Interrogé à chaque requête protégée par
 * @RequirePermissions() (voir PermissionsGuard) — volontairement PAS mis en
 * cache pour l'instant : une modification de permission par un
 * Administrateur doit prendre effet immédiatement sur tous les utilisateurs
 * de ce rôle, pas seulement à leur prochain refresh de token.
 *
 * Piste d'amélioration notée pour plus tard : si ce aller-retour DB devient
 * un point chaud sous charge, mettre les permissions d'un rôle en cache
 * Redis avec invalidation explicite au moment où RolePermission est modifié
 * — pas de cache "au TTL" qui réintroduirait le même délai de propagation.
 */
@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPermissionCodesForRole(roleId: string): Promise<string[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      select: { permission: { select: { code: true } } },
    });
    return rolePermissions.map((rp) => rp.permission.code);
  }

  async roleHasAllPermissions(roleId: string, requiredCodes: string[]): Promise<boolean> {
    if (requiredCodes.length === 0) return true;
    const granted = await this.getPermissionCodesForRole(roleId);
    return requiredCodes.every((code) => granted.includes(code));
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from './permissions.service';
import { PERMISSIONS_KEY } from './decorators/require-permissions.decorator';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

/**
 * Guard global (enregistré dans AppModule via APP_GUARD), exécuté APRÈS
 * JwtAuthGuard : il suppose que request.user est déjà renseigné.
 *
 * Comportement :
 *   - Aucune permission déclarée sur la route -> accès autorisé (route
 *     protégée par authentification simple, comme /auth/me).
 *   - Permissions déclarées -> vérifie que le rôle courant (issu du JWT
 *     scopé à la ferme active) possède TOUS les codes requis.
 *
 * Ordre des deux guards globaux : voir app.module.ts — JwtAuthGuard doit
 * impérativement passer en premier pour peupler request.user.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      // Ne devrait pas arriver si JwtAuthGuard s'exécute bien avant ce guard.
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    const autorise = await this.permissionsService.roleHasAllPermissions(
      user.roleId,
      requiredPermissions,
    );

    if (!autorise) {
      throw new ForbiddenException('Permissions insuffisantes pour cette action');
    }

    return true;
  }
}

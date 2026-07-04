import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard global (enregistré via APP_GUARD dans AppModule) : PAR DÉFAUT,
 * toute route de l'API exige un token d'accès valide. C'est un choix
 * délibéré ("secure by default") — plutôt que d'exiger @UseGuards(JwtAuthGuard)
 * sur chaque route sensible (et risquer d'oublier une route un jour), on
 * exige explicitement @Public() sur les rares routes qui n'en ont pas besoin.
 * Un oubli va donc dans le sens de la sécurité, pas contre elle.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt-access') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}

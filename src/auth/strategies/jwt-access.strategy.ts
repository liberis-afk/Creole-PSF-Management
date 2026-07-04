import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccessTokenPayload } from '../interfaces/jwt-payload.interface';
import { AuthenticatedUser } from '../interfaces/authenticated-request.interface';

/**
 * Stratégie Passport nommée 'jwt-access' (voir JwtAuthGuard qui l'utilise).
 * Passport appelle validate() automatiquement une fois la signature et
 * l'expiration du token vérifiées ; la valeur retournée ici devient
 * `request.user`.
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret'),
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedUser {
    if (payload.type !== 'access') {
      // Empêche qu'un refresh token ou pre-auth token, signé avec un autre
      // secret de toute façon, soit un jour accepté ici par erreur de config.
      throw new UnauthorizedException('Type de token inattendu');
    }
    return {
      userId: payload.sub,
      fermeId: payload.fermeId,
      roleId: payload.roleId,
    };
  }
}

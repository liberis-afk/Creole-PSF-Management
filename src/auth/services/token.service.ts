import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import {
  AccessTokenPayload,
  PreAuthTokenPayload,
  RefreshTokenPayload,
} from '../interfaces/jwt-payload.interface';

/**
 * Point d'entrée UNIQUE pour toute opération cryptographique liée aux JWT
 * dans l'application. Raison d'être de ce service, distinct d'AuthService :
 * signer/vérifier 3 types de tokens avec 3 secrets différents est un détail
 * d'implémentation, pas de la logique métier d'authentification — les
 * séparer évite qu'AuthService se retrouve à la fois responsable de
 * l'orchestration (qui a le droit de se connecter) ET de la cryptographie
 * (comment un token est signé), deux préoccupations qui changent pour des
 * raisons différentes.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
    });
  }

  signRefreshToken(payload: RefreshTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });
  }

  signPreAuthToken(payload: PreAuthTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.preAuthSecret'),
      expiresIn: this.configService.get<string>('jwt.preAuthExpiresIn'),
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return this.verify<AccessTokenPayload>(token, 'jwt.accessSecret', 'access');
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return this.verify<RefreshTokenPayload>(token, 'jwt.refreshSecret', 'refresh');
  }

  verifyPreAuthToken(token: string): PreAuthTokenPayload {
    return this.verify<PreAuthTokenPayload>(token, 'jwt.preAuthSecret', 'pre_auth');
  }

  /**
   * Empreinte du refresh token stockée en base (SessionConnexion.refreshTokenHash).
   * SHA-256 suffit ici et n'a rien à voir avec Argon2 (réservé aux mots de
   * passe) : le refresh token est déjà une chaîne aléatoire de haute entropie
   * signée par JWT, on a seulement besoin d'une empreinte rapide à comparer,
   * pas d'une protection contre le brute-force (inutile sur une valeur déjà
   * imprévisible).
   */
  hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private verify<T>(token: string, secretConfigKey: string, expectedType: string): T {
    try {
      const payload = this.jwtService.verify<T & { type: string }>(token, {
        secret: this.configService.get<string>(secretConfigKey),
      });
      if (payload.type !== expectedType) {
        throw new Error('Type de token inattendu');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }
}

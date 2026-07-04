import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../core/prisma/prisma.service';
import { SecurityLogService } from '../security-log/security-log.service';
import { Ferme, FermeUtilisateur, Role, Utilisateur } from '@prisma/client';
import { TokenService } from './services/token.service';
import { LoginDto } from './dto/login.dto';
import { SelectFarmDto } from './dto/select-farm.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

type AffectationAvecRelations = FermeUtilisateur & { ferme: Ferme; role: Role };

/** Réponse quand un utilisateur a exactement une ferme : connexion immédiate. */
interface ConnexionReussie {
  statut: 'CONNECTE';
  accessToken: string;
  refreshToken: string;
  utilisateur: { id: string; prenom: string; nom: string; email: string };
  ferme: { id: string; nom: string };
  role: { id: string; nom: string };
}

/** Réponse quand un utilisateur a plusieurs fermes : il doit en choisir une. */
interface SelectionFermeRequise {
  statut: 'SELECTION_FERME_REQUISE';
  preAuthToken: string;
  fermes: Array<{ id: string; nom: string; role: string }>;
}

export type LoginResult = ConnexionReussie | SelectionFermeRequise;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly securityLog: SecurityLogService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });

    // Message d'erreur volontairement identique dans les deux cas
    // (utilisateur inexistant / mot de passe faux) pour ne pas révéler
    // à un attaquant si un email donné existe dans la base.
    if (!utilisateur || utilisateur.statut !== 'ACTIF') {
      await this.securityLog.log({
        typeEvenement: 'CONNEXION_ECHOUEE',
        metadonnees: { emailTente: dto.email },
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    const motDePasseValide = await argon2.verify(utilisateur.motDePasseHash, dto.password);
    if (!motDePasseValide) {
      await this.securityLog.log({
        utilisateurId: utilisateur.id,
        typeEvenement: 'CONNEXION_ECHOUEE',
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    const affectations = await this.prisma.fermeUtilisateur.findMany({
      where: { utilisateurId: utilisateur.id, statut: 'ACCEPTEE' },
      include: { ferme: true, role: true },
    });

    if (affectations.length === 0) {
      await this.securityLog.log({
        utilisateurId: utilisateur.id,
        typeEvenement: 'CONNEXION_ECHOUEE',
        metadonnees: { raison: 'aucune_ferme_associee' },
      });
      throw new ForbiddenException("Ce compte n'a accès à aucune ferme");
    }

    if (affectations.length === 1) {
      return this.emettreSession(utilisateur, affectations[0]);
    }

    // Plusieurs fermes : on ne choisit pas à la place de l'utilisateur.
    const preAuthToken = this.tokenService.signPreAuthToken({
      sub: utilisateur.id,
      type: 'pre_auth',
    });

    return {
      statut: 'SELECTION_FERME_REQUISE',
      preAuthToken,
      fermes: affectations.map((a) => ({
        id: a.ferme.id,
        nom: a.ferme.nom,
        role: a.role.nom,
      })),
    };
  }

  async selectFarm(dto: SelectFarmDto): Promise<ConnexionReussie> {
    const payload = this.tokenService.verifyPreAuthToken(dto.preAuthToken);

    const affectation = await this.prisma.fermeUtilisateur.findFirst({
      where: { utilisateurId: payload.sub, fermeId: dto.fermeId, statut: 'ACCEPTEE' },
      include: { ferme: true, role: true, utilisateur: true },
    });

    if (!affectation) {
      throw new ForbiddenException("Accès non autorisé à cette ferme");
    }

    return this.emettreSession(affectation.utilisateur, affectation);
  }

  async refresh(dto: RefreshTokenDto): Promise<ConnexionReussie> {
    const payload = this.tokenService.verifyRefreshToken(dto.refreshToken);

    const session = await this.prisma.sessionConnexion.findUnique({
      where: { id: payload.sid },
    });

    const empreinteRecue = this.tokenService.hashOpaqueToken(dto.refreshToken);
    const sessionValide =
      session &&
      !session.revoqueeLe &&
      session.expireLe > new Date() &&
      session.refreshTokenHash === empreinteRecue;

    if (!sessionValide) {
      throw new UnauthorizedException('Session invalide ou expirée');
    }

    // Rotation : la session courante est révoquée immédiatement, une
    // nouvelle est créée. Si un refresh token volé est rejoué après coup,
    // il sera déjà invalide (revoqueeLe non nul) — ce qui, combiné à une
    // détection applicative future (deux utilisations du même token),
    // permettrait aussi d'alerter sur un vol de session.
    await this.prisma.sessionConnexion.update({
      where: { id: session.id },
      data: { revoqueeLe: new Date() },
    });

    const [utilisateur, affectation] = await Promise.all([
      this.prisma.utilisateur.findUniqueOrThrow({ where: { id: payload.sub } }),
      this.prisma.fermeUtilisateur.findFirstOrThrow({
        where: { utilisateurId: payload.sub, fermeId: payload.fermeId, statut: 'ACCEPTEE' },
        include: { ferme: true, role: true },
      }),
    ]);

    return this.emettreSession(utilisateur, affectation);
  }

  async logout(dto: RefreshTokenDto): Promise<void> {
    // La déconnexion est idempotente : un refresh token déjà expiré/invalide
    // ne doit jamais faire échouer un logout côté client.
    try {
      const payload = this.tokenService.verifyRefreshToken(dto.refreshToken);
      await this.prisma.sessionConnexion.updateMany({
        where: { id: payload.sid, revoqueeLe: null },
        data: { revoqueeLe: new Date() },
      });
      await this.securityLog.log({
        utilisateurId: payload.sub,
        fermeId: payload.fermeId,
        typeEvenement: 'DECONNEXION',
      });
    } catch {
      // Token déjà invalide : rien à révoquer, on ne remonte pas d'erreur.
    }
  }

  async getSessionsActives(utilisateurId: string) {
    return this.prisma.sessionConnexion.findMany({
      where: {
        utilisateurId,
        revoqueeLe: null,
        expireLe: { gt: new Date() },
      },
      select: {
        id: true,
        userAgent: true,
        adresseIp: true,
        createdAt: true,
        expireLe: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMe(utilisateurId: string, fermeId: string) {
    const affectation = await this.prisma.fermeUtilisateur.findFirstOrThrow({
      where: { utilisateurId, fermeId },
      include: {
        utilisateur: true,
        ferme: true,
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    return {
      utilisateur: {
        id: affectation.utilisateur.id,
        prenom: affectation.utilisateur.prenom,
        nom: affectation.utilisateur.nom,
        email: affectation.utilisateur.email,
      },
      ferme: { id: affectation.ferme.id, nom: affectation.ferme.nom },
      role: { id: affectation.role.id, nom: affectation.role.nom },
      permissions: affectation.role.permissions.map((rp) => rp.permission.code),
    };
  }

  /**
   * Point unique de création d'une session authentifiée : crée la ligne
   * SessionConnexion, signe access + refresh token, journalise la connexion
   * et met à jour derniereConnexionA. Appelé par login (cas 1 ferme),
   * selectFarm et refresh — évite de dupliquer cette logique trois fois.
   */
  private async emettreSession(
    utilisateur: Utilisateur,
    affectation: AffectationAvecRelations,
  ): Promise<ConnexionReussie> {
    const sessionId = randomUUID();

    const refreshToken = this.tokenService.signRefreshToken({
      sub: utilisateur.id,
      fermeId: affectation.fermeId,
      sid: sessionId,
      type: 'refresh',
    });

    const refreshExpiresInMs = this.configService.get<number>('jwt.refreshExpiresInMs')!;

    await this.prisma.sessionConnexion.create({
      data: {
        id: sessionId,
        utilisateurId: utilisateur.id,
        refreshTokenHash: this.tokenService.hashOpaqueToken(refreshToken),
        expireLe: new Date(Date.now() + refreshExpiresInMs),
      },
    });

    const accessToken = this.tokenService.signAccessToken({
      sub: utilisateur.id,
      fermeId: affectation.fermeId,
      roleId: affectation.roleId,
      type: 'access',
    });

    await Promise.all([
      this.prisma.utilisateur.update({
        where: { id: utilisateur.id },
        data: { derniereConnexionA: new Date() },
      }),
      this.securityLog.log({
        utilisateurId: utilisateur.id,
        fermeId: affectation.fermeId,
        typeEvenement: 'CONNEXION_REUSSIE',
      }),
    ]);

    return {
      statut: 'CONNECTE',
      accessToken,
      refreshToken,
      utilisateur: {
        id: utilisateur.id,
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        email: utilisateur.email,
      },
      ferme: { id: affectation.ferme.id, nom: affectation.ferme.nom },
      role: { id: affectation.role.id, nom: affectation.role.nom },
    };
  }
}

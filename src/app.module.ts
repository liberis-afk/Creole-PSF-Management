import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './core/config/configuration';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { PrismaModule } from './core/prisma/prisma.module';
import { SecurityLogModule } from './security-log/security-log.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PermissionsGuard } from './permissions/permissions.guard';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ParcellesModule } from './modules/parcelles/parcelles.module';
import { CulturesModule } from './modules/cultures/cultures.module';
import { EquipementsModule } from './modules/equipements/equipements.module';
import { ActivitesModule } from './modules/activites/activites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    // Limite globale anti-abus (protège notamment /auth/login du brute-force) :
    // 100 requêtes / minute / IP par défaut. Un module pourra durcir localement
    // via @Throttle sur des routes sensibles.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    SecurityLogModule,
    PermissionsModule,
    AuthModule,
    DashboardModule,
    ParcellesModule,
    CulturesModule,
    EquipementsModule,
    ActivitesModule,
  ],
  providers: [
    // Filet de sécurité global : mappe les erreurs Prisma connues en réponses
    // HTTP propres (409/404…) au lieu de laisser fuiter un 500 avec l'interne.
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    // ThrottlerGuard en PREMIER : on plafonne le débit avant même de vérifier
    // le token (un flot de requêtes non authentifiées est stoppé tôt).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Ordre déterminant : JwtAuthGuard peuple request.user, PermissionsGuard
    // en dépend. NestJS applique les guards globaux dans l'ordre où ils
    // sont fournis ici.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}

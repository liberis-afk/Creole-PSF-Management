import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Wrapper du PrismaClient en service injectable NestJS.
 *
 * Une seule instance pour toute l'application (voir PrismaModule, @Global),
 * avec connexion/déconnexion propre alignée sur le cycle de vie de Nest —
 * évite les fuites de connexions PostgreSQL en développement (hot-reload)
 * comme en production (arrêt propre du conteneur).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

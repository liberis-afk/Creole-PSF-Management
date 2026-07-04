import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Module @Global : PrismaService est disponible partout dans l'application
 * sans avoir à réimporter PrismaModule dans chaque module métier. C'est le
 * seul module de l'architecture qui utilise @Global — justifié parce que
 * l'accès à la base de données est une dépendance transverse à absolument
 * tous les modules, contrairement à AuthModule ou PermissionsModule qui
 * restent importés explicitement là où ils sont nécessaires.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './services/token.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { SecurityLogModule } from '../security-log/security-log.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    // Pas de secret par défaut ici : chaque signature/vérification (voir
    // TokenService) passe explicitement son propre secret selon le type de
    // token (access / refresh / pre_auth). register({}) sert uniquement à
    // rendre JwtService injectable.
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    SecurityLogModule,
    PermissionsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtAccessStrategy],
  exports: [AuthService, TokenService],
})
export class AuthModule {}

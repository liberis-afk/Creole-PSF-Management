import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SelectFarmDto } from './dto/select-farm.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './interfaces/authenticated-request.interface';
import { RequirePermissions } from '../permissions/decorators/require-permissions.decorator';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connexion',
    description:
      "Retourne des tokens directement si l'utilisateur n'a qu'une ferme, " +
      'sinon un preAuthToken + la liste des fermes (voir POST /auth/select-farm).',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('select-farm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Choix de la ferme active (comptes multi-fermes uniquement)',
  })
  selectFarm(@Body() dto: SelectFarmDto) {
    return this.authService.selectFarm(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rafraîchissement du token d'accès (rotation)" })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Déconnexion — révoque la session correspondante' })
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Profil, ferme active et permissions de l'utilisateur connecté" })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.userId, user.fermeId);
  }

  @Get('sessions')
  @ApiBearerAuth()
  @RequirePermissions('auth.sessions.voir')
  @ApiOperation({ summary: "Sessions actives de l'utilisateur connecté" })
  getSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getSessionsActives(user.userId);
  }
}

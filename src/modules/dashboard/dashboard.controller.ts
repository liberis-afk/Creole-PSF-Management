import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-request.interface';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@ApiTags('Tableau de bord')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Un seul endpoint retournant tout le payload du tableau de bord. Le
   * fermeId vient du token (via @CurrentUser) — jamais d'un paramètre client,
   * ce qui garantit qu'un utilisateur ne peut demander que le dashboard de la
   * ferme pour laquelle son token a été émis.
   *
   * Pas de @RequirePermissions ici : tout utilisateur authentifié voit le
   * dashboard de sa ferme. Le filtrage fin (masquer la section Finances à un
   * rôle sans droit financier) sera ajouté quand la granularité des
   * permissions par section sera définie avec toi.
   */
  @Get()
  @ApiOperation({ summary: 'Agrégats temps réel du tableau de bord de la ferme active' })
  getDashboard(@CurrentUser() user: AuthenticatedUser): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboard(user.fermeId);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { EquipementsService } from './equipements.service';
import { EquipementsMaintenanceService } from './equipements-maintenance.service';
import { EquipementsAlertesService } from './equipements-alertes.service';
import { EquipementsExportService } from './equipements-export.service';
import { EquipementsPhotosService } from './equipements-photos.service';
import { CreateEquipementDto } from './dto/create-equipement.dto';
import { UpdateEquipementDto } from './dto/update-equipement.dto';
import { QueryEquipementDto } from './dto/query-equipement.dto';
import { CreateEntretienDto, UpdateEntretienDto, CreateUtilisationDto } from './dto/entretien.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-request.interface';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';

@ApiTags('Équipements')
@ApiBearerAuth()
@Controller('equipements')
export class EquipementsController {
  constructor(
    private readonly equipementsService: EquipementsService,
    private readonly maintenanceService: EquipementsMaintenanceService,
    private readonly alertesService: EquipementsAlertesService,
    private readonly exportService: EquipementsExportService,
    private readonly photosService: EquipementsPhotosService,
  ) {}

  // --- Lecture liste / analytics (routes littérales AVANT ':id') ---

  @Get()
  @RequirePermissions('equipements.consulter')
  @ApiOperation({ summary: 'Liste paginée des équipements (recherche + filtres)' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryEquipementDto) {
    return this.equipementsService.findAll(user.fermeId, query);
  }

  @Get('statistiques')
  @RequirePermissions('equipements.consulter')
  @ApiOperation({ summary: 'Statistiques agrégées des équipements' })
  getStatistiques(@CurrentUser() user: AuthenticatedUser) {
    return this.alertesService.getStatistiques(user.fermeId);
  }

  @Get('alertes')
  @RequirePermissions('equipements.consulter')
  @ApiOperation({ summary: 'Alertes calculées (maintenance, panne, coût élevé, inutilisé)' })
  getAlertes(@CurrentUser() user: AuthenticatedUser) {
    return this.alertesService.getAlertes(user.fermeId);
  }

  @Get('export')
  @RequirePermissions('equipements.consulter')
  @ApiQuery({ name: 'format', enum: ['csv', 'xlsx', 'pdf'] })
  @ApiOperation({ summary: 'Exporter la liste des équipements (CSV, Excel, PDF)' })
  async export(
    @CurrentUser() user: AuthenticatedUser,
    @Query('format') format: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, contentType, nomFichier } = await this.exportService.exporter(user.fermeId, format ?? 'csv');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}"`);
    res.send(buffer);
  }

  // --- CRUD ---

  @Post()
  @RequirePermissions('equipements.creer')
  @ApiOperation({ summary: 'Créer un équipement' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEquipementDto) {
    return this.equipementsService.create(user.fermeId, dto);
  }

  @Get(':id')
  @RequirePermissions('equipements.consulter')
  @ApiOperation({ summary: "Détail d'un équipement" })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.equipementsService.findOne(user.fermeId, id);
  }

  @Patch(':id')
  @RequirePermissions('equipements.modifier')
  @ApiOperation({ summary: 'Modifier un équipement' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateEquipementDto) {
    return this.equipementsService.update(user.fermeId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('equipements.supprimer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un équipement' })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.equipementsService.remove(user.fermeId, id);
  }

  // --- Historique ---

  @Get(':id/historique')
  @RequirePermissions('equipements.consulter')
  @ApiOperation({ summary: 'Historique consolidé (maintenances, coûts, utilisations)' })
  getHistorique(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.maintenanceService.getHistorique(user.fermeId, id);
  }

  // --- Maintenance ---

  @Get(':id/entretiens')
  @RequirePermissions('equipements.consulter')
  @ApiOperation({ summary: 'Lister les entretiens/maintenances' })
  listEntretiens(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.maintenanceService.listEntretiens(user.fermeId, id);
  }

  @Post(':id/entretiens')
  @RequirePermissions('equipements.modifier')
  @ApiOperation({ summary: 'Ajouter un entretien/maintenance' })
  addEntretien(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateEntretienDto) {
    return this.maintenanceService.addEntretien(user.fermeId, id, dto);
  }

  @Patch(':id/entretiens/:entretienId')
  @RequirePermissions('equipements.modifier')
  @ApiOperation({ summary: 'Modifier un entretien (ex. faire évoluer son statut)' })
  updateEntretien(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('entretienId') entretienId: string,
    @Body() dto: UpdateEntretienDto,
  ) {
    return this.maintenanceService.updateEntretien(user.fermeId, id, entretienId, dto);
  }

  @Delete(':id/entretiens/:entretienId')
  @RequirePermissions('equipements.modifier')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un entretien' })
  async removeEntretien(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('entretienId') entretienId: string,
  ): Promise<void> {
    await this.maintenanceService.removeEntretien(user.fermeId, id, entretienId);
  }

  // --- Utilisation ---

  @Get(':id/utilisations')
  @RequirePermissions('equipements.consulter')
  @ApiOperation({ summary: "Lister les utilisations (heures d'usage)" })
  listUtilisations(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.maintenanceService.listUtilisations(user.fermeId, id);
  }

  @Post(':id/utilisations')
  @RequirePermissions('equipements.modifier')
  @ApiOperation({ summary: 'Enregistrer une utilisation' })
  addUtilisation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateUtilisationDto) {
    return this.maintenanceService.addUtilisation(user.fermeId, id, dto);
  }

  // --- Photos ---

  @Get(':id/photos')
  @RequirePermissions('equipements.consulter')
  @ApiOperation({ summary: "Lister les photos de l'équipement" })
  listPhotos(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.photosService.list(user.fermeId, id);
  }

  @Post(':id/photos')
  @RequirePermissions('equipements.modifier')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('fichier'))
  @ApiOperation({ summary: 'Téléverser une photo (multipart, champ "fichier")' })
  uploadPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile() fichier: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @Body() body: { titre?: string },
  ) {
    return this.photosService.upload(user.fermeId, id, user.userId, fichier, body.titre);
  }

  @Get(':id/photos/:photoId/fichier')
  @RequirePermissions('equipements.consulter')
  @ApiOperation({ summary: 'Télécharger/afficher le fichier binaire de la photo' })
  async getFichierPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { flux, typeMime } = await this.photosService.getFichier(user.fermeId, id, photoId);
    res.setHeader('Content-Type', typeMime);
    flux.pipe(res);
  }

  @Delete(':id/photos/:photoId')
  @RequirePermissions('equipements.modifier')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une photo' })
  async removePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ): Promise<void> {
    await this.photosService.remove(user.fermeId, id, photoId);
  }
}

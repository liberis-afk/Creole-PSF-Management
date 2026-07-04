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
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ActivitesService } from './activites.service';
import { ActivitesCalendrierService } from './activites-calendrier.service';
import { ActivitesCommentairesService } from './activites-commentaires.service';
import { ActivitesPhotosService } from './activites-photos.service';
import { CreateActiviteDto } from './dto/create-activite.dto';
import { UpdateActiviteDto } from './dto/update-activite.dto';
import { QueryActiviteDto } from './dto/query-activite.dto';
import { QueryCalendrierDto } from './dto/query-calendrier.dto';
import { CreateCommentaireDto, SetEmployesDto } from './dto/commentaire.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-request.interface';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';

@ApiTags('Activités')
@ApiBearerAuth()
@Controller('activites')
export class ActivitesController {
  constructor(
    private readonly activitesService: ActivitesService,
    private readonly calendrierService: ActivitesCalendrierService,
    private readonly commentairesService: ActivitesCommentairesService,
    private readonly photosService: ActivitesPhotosService,
  ) {}

  // --- Routes littérales AVANT ':id' ---

  @Get()
  @RequirePermissions('activites.consulter')
  @ApiOperation({ summary: 'Liste paginée des activités (recherche + filtres)' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryActiviteDto) {
    return this.activitesService.findAll(user.fermeId, query);
  }

  @Get('calendrier')
  @RequirePermissions('activites.consulter')
  @ApiOperation({ summary: 'Activités sur une plage de dates (vue calendrier)' })
  getCalendrier(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryCalendrierDto) {
    return this.calendrierService.getCalendrier(user.fermeId, query.debut, query.fin);
  }

  @Get('statistiques')
  @RequirePermissions('activites.consulter')
  @ApiOperation({ summary: 'Statistiques des activités (par statut/type, à venir, en retard)' })
  getStatistiques(@CurrentUser() user: AuthenticatedUser) {
    return this.calendrierService.getStatistiques(user.fermeId);
  }

  // --- CRUD ---

  @Post()
  @RequirePermissions('activites.creer')
  @ApiOperation({ summary: 'Créer une activité' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateActiviteDto) {
    return this.activitesService.create(user.fermeId, dto);
  }

  @Get(':id')
  @RequirePermissions('activites.consulter')
  @ApiOperation({ summary: "Détail d'une activité" })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.activitesService.findOne(user.fermeId, id);
  }

  @Patch(':id')
  @RequirePermissions('activites.modifier')
  @ApiOperation({ summary: 'Modifier une activité (statut, dates, coût…)' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateActiviteDto) {
    return this.activitesService.update(user.fermeId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('activites.supprimer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une activité' })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.activitesService.remove(user.fermeId, id);
  }

  // --- Employés affectés ---

  @Put(':id/employes')
  @RequirePermissions('activites.modifier')
  @ApiOperation({ summary: 'Définir la liste des employés affectés' })
  setEmployes(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: SetEmployesDto) {
    return this.activitesService.setEmployes(user.fermeId, id, dto.employeIds);
  }

  // --- Commentaires (fil) ---

  @Get(':id/commentaires')
  @RequirePermissions('activites.consulter')
  @ApiOperation({ summary: "Fil de commentaires de l'activité" })
  listCommentaires(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commentairesService.list(user.fermeId, id);
  }

  @Post(':id/commentaires')
  @RequirePermissions('activites.modifier')
  @ApiOperation({ summary: 'Ajouter un commentaire' })
  addCommentaire(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateCommentaireDto) {
    return this.commentairesService.add(user.fermeId, id, user.userId, dto);
  }

  @Delete(':id/commentaires/:commentaireId')
  @RequirePermissions('activites.modifier')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un commentaire (le sien)' })
  async removeCommentaire(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('commentaireId') commentaireId: string,
  ): Promise<void> {
    await this.commentairesService.remove(user.fermeId, id, commentaireId, user.userId);
  }

  // --- Pièces jointes ---

  @Get(':id/pieces-jointes')
  @RequirePermissions('activites.consulter')
  @ApiOperation({ summary: "Lister les pièces jointes de l'activité" })
  listPieces(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.photosService.list(user.fermeId, id);
  }

  @Post(':id/pieces-jointes')
  @RequirePermissions('activites.modifier')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('fichier'))
  @ApiOperation({ summary: 'Téléverser une pièce jointe (image ou PDF, champ "fichier")' })
  uploadPiece(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile() fichier: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @Body() body: { titre?: string },
  ) {
    return this.photosService.upload(user.fermeId, id, user.userId, fichier, body.titre);
  }

  @Get(':id/pieces-jointes/:pieceId/fichier')
  @RequirePermissions('activites.consulter')
  @ApiOperation({ summary: 'Télécharger/afficher une pièce jointe' })
  async getFichierPiece(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('pieceId') pieceId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { flux, typeMime } = await this.photosService.getFichier(user.fermeId, id, pieceId);
    res.setHeader('Content-Type', typeMime);
    flux.pipe(res);
  }

  @Delete(':id/pieces-jointes/:pieceId')
  @RequirePermissions('activites.modifier')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une pièce jointe' })
  async removePiece(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('pieceId') pieceId: string,
  ): Promise<void> {
    await this.photosService.remove(user.fermeId, id, pieceId);
  }
}

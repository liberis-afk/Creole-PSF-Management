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
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ParcellesService } from './parcelles.service';
import { ParcellesHistoriqueService } from './parcelles-historique.service';
import { ParcellesPhotosService } from './parcelles-photos.service';
import { CreateParcelleDto } from './dto/create-parcelle.dto';
import { UpdateParcelleDto } from './dto/update-parcelle.dto';
import { QueryParcelleDto } from './dto/query-parcelle.dto';
import { CreateAnalyseSolDto } from './dto/create-analyse-sol.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-request.interface';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';

@ApiTags('Parcelles')
@ApiBearerAuth()
@Controller('parcelles')
export class ParcellesController {
  constructor(
    private readonly parcellesService: ParcellesService,
    private readonly historiqueService: ParcellesHistoriqueService,
    private readonly photosService: ParcellesPhotosService,
  ) {}

  // --- Lecture ---

  @Get()
  @RequirePermissions('parcelles.consulter')
  @ApiOperation({ summary: 'Liste paginée des parcelles (filtres + recherche)' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryParcelleDto) {
    return this.parcellesService.findAll(user.fermeId, query);
  }

  // IMPORTANT : cette route DOIT être déclarée avant `:id`, sinon "carte"
  // serait interprété comme un identifiant de parcelle.
  @Get('carte')
  @RequirePermissions('parcelles.consulter')
  @ApiOperation({ summary: 'Géométries GeoJSON de toutes les parcelles (pour la carte)' })
  findAllForMap(@CurrentUser() user: AuthenticatedUser) {
    return this.parcellesService.findAllForMap(user.fermeId);
  }

  @Get(':id')
  @RequirePermissions('parcelles.consulter')
  @ApiOperation({ summary: "Détail d'une parcelle (avec géométrie)" })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.parcellesService.findOne(user.fermeId, id);
  }

  @Get(':id/historique')
  @RequirePermissions('parcelles.consulter')
  @ApiOperation({ summary: 'Historique de la parcelle (cultures, rendements, santé, analyses)' })
  getHistorique(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.historiqueService.getHistorique(user.fermeId, id);
  }

  // --- Écriture parcelle ---

  @Post()
  @RequirePermissions('parcelles.creer')
  @ApiOperation({ summary: 'Créer une parcelle (superficie auto-calculée si contour fourni)' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateParcelleDto) {
    return this.parcellesService.create(user.fermeId, dto);
  }

  @Patch(':id')
  @RequirePermissions('parcelles.modifier')
  @ApiOperation({ summary: 'Modifier une parcelle' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateParcelleDto,
  ) {
    return this.parcellesService.update(user.fermeId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('parcelles.supprimer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une parcelle' })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.parcellesService.remove(user.fermeId, id);
  }

  // --- Analyses de sol ---

  @Get(':id/analyses-sol')
  @RequirePermissions('parcelles.consulter')
  @ApiOperation({ summary: 'Lister les analyses de sol de la parcelle' })
  listAnalyses(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.historiqueService.listAnalysesSol(user.fermeId, id);
  }

  @Post(':id/analyses-sol')
  @RequirePermissions('parcelles.modifier')
  @ApiOperation({ summary: 'Ajouter une analyse de sol' })
  addAnalyse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateAnalyseSolDto,
  ) {
    return this.historiqueService.addAnalyseSol(user.fermeId, id, dto);
  }

  // --- Photos ---

  @Get(':id/photos')
  @RequirePermissions('parcelles.consulter')
  @ApiOperation({ summary: 'Lister les photos de la parcelle' })
  listPhotos(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.photosService.list(user.fermeId, id);
  }

  @Post(':id/photos')
  @RequirePermissions('parcelles.modifier')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('fichier'))
  @ApiOperation({ summary: 'Téléverser une photo (multipart, champ "fichier")' })
  uploadPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile() fichier: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @Body() body: { latitude?: string; longitude?: string; titre?: string },
  ) {
    return this.photosService.upload(user.fermeId, id, user.userId, fichier, {
      latitude: body.latitude ? Number(body.latitude) : undefined,
      longitude: body.longitude ? Number(body.longitude) : undefined,
      titre: body.titre,
    });
  }

  @Get(':id/photos/:photoId/fichier')
  @RequirePermissions('parcelles.consulter')
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
  @RequirePermissions('parcelles.modifier')
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

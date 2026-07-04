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
import { CulturesService } from './cultures.service';
import { CulturesSuiviService } from './cultures-suivi.service';
import { CulturesPhotosService } from './cultures-photos.service';
import { CreateCultureDto } from './dto/create-culture.dto';
import { UpdateCultureDto } from './dto/update-culture.dto';
import { QueryCultureDto } from './dto/query-culture.dto';
import { CreateSuiviDto, CreateTraitementDto } from './dto/create-suivi.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-request.interface';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';

@ApiTags('Cultures')
@ApiBearerAuth()
@Controller('cultures')
export class CulturesController {
  constructor(
    private readonly culturesService: CulturesService,
    private readonly suiviService: CulturesSuiviService,
    private readonly photosService: CulturesPhotosService,
  ) {}

  // --- Lecture ---

  @Get()
  @RequirePermissions('cultures.consulter')
  @ApiOperation({ summary: 'Liste paginée des cultures (filtres + recherche)' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryCultureDto) {
    return this.culturesService.findAll(user.fermeId, query);
  }

  // Déclarée AVANT `:id` pour ne pas être capturée comme un identifiant.
  @Get('statistiques')
  @RequirePermissions('cultures.consulter')
  @ApiOperation({ summary: 'Statistiques agrégées des cultures' })
  getStatistiques(@CurrentUser() user: AuthenticatedUser) {
    return this.culturesService.getStatistiques(user.fermeId);
  }

  @Get(':id')
  @RequirePermissions('cultures.consulter')
  @ApiOperation({ summary: "Détail d'une culture" })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.culturesService.findOne(user.fermeId, id);
  }

  @Get(':id/calendrier')
  @RequirePermissions('cultures.consulter')
  @ApiOperation({ summary: 'Calendrier cultural (frise de vie calculée + activités liées)' })
  getCalendrier(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.suiviService.getCalendrier(user.fermeId, id);
  }

  @Get(':id/suivis')
  @RequirePermissions('cultures.consulter')
  @ApiOperation({ summary: 'Liste des suivis (observations stade/santé)' })
  listSuivis(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.suiviService.listSuivis(user.fermeId, id);
  }

  @Get(':id/traitements')
  @RequirePermissions('cultures.consulter')
  @ApiOperation({ summary: 'Liste des traitements appliqués' })
  listTraitements(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.suiviService.listTraitements(user.fermeId, id);
  }

  @Get(':id/rendements')
  @RequirePermissions('cultures.consulter')
  @ApiOperation({ summary: 'Rendements/récoltes de la culture (lecture seule)' })
  listRendements(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.suiviService.listRendements(user.fermeId, id);
  }

  // --- Écriture culture ---

  @Post()
  @RequirePermissions('cultures.creer')
  @ApiOperation({ summary: 'Créer une culture' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCultureDto) {
    return this.culturesService.create(user.fermeId, dto);
  }

  @Patch(':id')
  @RequirePermissions('cultures.modifier')
  @ApiOperation({ summary: 'Modifier une culture' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCultureDto) {
    return this.culturesService.update(user.fermeId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('cultures.supprimer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une culture (refusé si récoltes liées)' })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.culturesService.remove(user.fermeId, id);
  }

  // --- Suivi & traitements ---

  @Post(':id/suivis')
  @RequirePermissions('cultures.modifier')
  @ApiOperation({ summary: 'Ajouter un suivi (observation)' })
  addSuivi(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateSuiviDto) {
    return this.suiviService.addSuivi(user.fermeId, id, user.userId, dto);
  }

  @Post(':id/traitements')
  @RequirePermissions('cultures.modifier')
  @ApiOperation({ summary: 'Ajouter un traitement' })
  addTraitement(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateTraitementDto) {
    return this.suiviService.addTraitement(user.fermeId, id, dto);
  }

  // --- Photos ---

  @Get(':id/photos')
  @RequirePermissions('cultures.consulter')
  @ApiOperation({ summary: 'Lister les photos de la culture' })
  listPhotos(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.photosService.list(user.fermeId, id);
  }

  @Post(':id/photos')
  @RequirePermissions('cultures.modifier')
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
  @RequirePermissions('cultures.consulter')
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
  @RequirePermissions('cultures.modifier')
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

import { Module } from '@nestjs/common';
import { ActivitesController } from './activites.controller';
import { ActivitesService } from './activites.service';
import { ActivitesCalendrierService } from './activites-calendrier.service';
import { ActivitesCommentairesService } from './activites-commentaires.service';
import { ActivitesPhotosService } from './activites-photos.service';

@Module({
  controllers: [ActivitesController],
  providers: [ActivitesService, ActivitesCalendrierService, ActivitesCommentairesService, ActivitesPhotosService],
})
export class ActivitesModule {}

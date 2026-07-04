import { Module } from '@nestjs/common';
import { CulturesController } from './cultures.controller';
import { CulturesService } from './cultures.service';
import { CulturesSuiviService } from './cultures-suivi.service';
import { CulturesPhotosService } from './cultures-photos.service';

@Module({
  controllers: [CulturesController],
  providers: [CulturesService, CulturesSuiviService, CulturesPhotosService],
})
export class CulturesModule {}

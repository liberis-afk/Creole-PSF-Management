import { Module } from '@nestjs/common';
import { ParcellesController } from './parcelles.controller';
import { ParcellesService } from './parcelles.service';
import { ParcellesHistoriqueService } from './parcelles-historique.service';
import { ParcellesPhotosService } from './parcelles-photos.service';

@Module({
  controllers: [ParcellesController],
  providers: [ParcellesService, ParcellesHistoriqueService, ParcellesPhotosService],
})
export class ParcellesModule {}

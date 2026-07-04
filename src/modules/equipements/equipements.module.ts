import { Module } from '@nestjs/common';
import { EquipementsController } from './equipements.controller';
import { EquipementsService } from './equipements.service';
import { EquipementsMaintenanceService } from './equipements-maintenance.service';
import { EquipementsAlertesService } from './equipements-alertes.service';
import { EquipementsExportService } from './equipements-export.service';
import { EquipementsPhotosService } from './equipements-photos.service';

@Module({
  controllers: [EquipementsController],
  providers: [
    EquipementsService,
    EquipementsMaintenanceService,
    EquipementsAlertesService,
    EquipementsExportService,
    EquipementsPhotosService,
  ],
})
export class EquipementsModule {}

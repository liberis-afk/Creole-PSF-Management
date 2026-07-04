import { PartialType } from '@nestjs/swagger';
import { CreateParcelleDto } from './create-parcelle.dto';

/**
 * PartialType rend tous les champs de création optionnels : une mise à jour
 * partielle (PATCH) ne renvoie que les champs modifiés. La logique de
 * recalcul de superficie/centroïde en cas de nouveau contour est gérée dans
 * le service.
 */
export class UpdateParcelleDto extends PartialType(CreateParcelleDto) {}

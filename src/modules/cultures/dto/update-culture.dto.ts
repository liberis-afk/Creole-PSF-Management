import { PartialType } from '@nestjs/swagger';
import { CreateCultureDto } from './create-culture.dto';

/**
 * Mise à jour partielle. Changer la parcelle est autorisé (une culture peut
 * être re-rattachée) ; la nouvelle parcelle est revalidée côté service.
 */
export class UpdateCultureDto extends PartialType(CreateCultureDto) {}

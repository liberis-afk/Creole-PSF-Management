import { PartialType } from '@nestjs/swagger';
import { CreateActiviteDto } from './create-activite.dto';

export class UpdateActiviteDto extends PartialType(CreateActiviteDto) {}

import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

/** Plage de dates pour la vue calendrier (grille mensuelle/hebdomadaire). */
export class QueryCalendrierDto {
  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  debut!: string;

  @ApiProperty({ example: '2026-07-31' })
  @IsDateString()
  fin!: string;
}

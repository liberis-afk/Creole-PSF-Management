import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString, MaxLength } from 'class-validator';

/** Ajout d'un commentaire au fil d'une activité. */
export class CreateCommentaireDto {
  @ApiProperty({ example: 'Semis reporté à cause de la pluie.' })
  @IsString()
  @MaxLength(2000)
  contenu!: string;
}

/** Définition (remplacement) de la liste des employés affectés. */
export class SetEmployesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  employeIds!: string[];
}

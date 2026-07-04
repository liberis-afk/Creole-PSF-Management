import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PrioriteActivite, StatutActivite, TypeActivite } from '@prisma/client';

/**
 * Création d'une activité du calendrier agricole. Titre, type et date de début
 * (dateProgrammee) sont obligatoires. Le responsable est un utilisateur ; les
 * employés affectés sont des fiches employé (liste d'identifiants). Parcelle et
 * culture sont des liens optionnels qui alimentent le calendrier cultural.
 */
export class CreateActiviteDto {
  @ApiProperty({ example: 'Semis maïs parcelle Nord' })
  @IsString()
  @MaxLength(160)
  titre!: string;

  @ApiProperty({ enum: TypeActivite })
  @IsEnum(TypeActivite)
  type!: TypeActivite;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Date (et début) programmée', example: '2026-07-15' })
  @IsDateString()
  dateProgrammee!: string;

  @ApiPropertyOptional({ description: 'Date de fin (activité sur plusieurs jours)' })
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiPropertyOptional({ description: 'Heure programmée (HH:mm)', example: '07:30' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  heureProgrammee?: string;

  @ApiPropertyOptional({ enum: PrioriteActivite, default: PrioriteActivite.NORMALE })
  @IsOptional()
  @IsEnum(PrioriteActivite)
  priorite?: PrioriteActivite;

  @ApiPropertyOptional({ enum: StatutActivite, default: StatutActivite.PLANIFIEE })
  @IsOptional()
  @IsEnum(StatutActivite)
  statut?: StatutActivite;

  @ApiPropertyOptional({ description: "Coût de l'activité", minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cout?: number;

  @ApiPropertyOptional({ description: 'Utilisateur responsable' })
  @IsOptional()
  @IsString()
  responsableId?: string;

  @ApiPropertyOptional({ description: 'Parcelle liée' })
  @IsOptional()
  @IsString()
  parcelleId?: string;

  @ApiPropertyOptional({ description: 'Culture liée' })
  @IsOptional()
  @IsString()
  cultureId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Identifiants des employés affectés' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeIds?: string[];
}

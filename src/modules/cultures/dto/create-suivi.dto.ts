import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EtatSante, StadeVegetatif, TypeTraitement } from '@prisma/client';

/**
 * Enregistrement d'un suivi (observation à une date donnée) : stade végétatif,
 * état de santé, et éventuellement maladies/ravageurs observés. C'est la
 * matière première du suivi sanitaire de la culture.
 */
export class CreateSuiviDto {
  @ApiPropertyOptional({ description: 'Date du suivi (par défaut : maintenant)' })
  @IsOptional()
  @IsDateString()
  dateSuivi?: string;

  @ApiProperty({ enum: StadeVegetatif })
  @IsEnum(StadeVegetatif)
  stade!: StadeVegetatif;

  @ApiProperty({ enum: EtatSante })
  @IsEnum(EtatSante)
  etatSante!: EtatSante;

  @ApiPropertyOptional({ type: [String], description: 'Maladies observées' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  maladies?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Ravageurs observés' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ravageurs?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

/**
 * Enregistrement d'un traitement appliqué (herbicide, insecticide, etc.).
 */
export class CreateTraitementDto {
  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  dateTraitement!: string;

  @ApiProperty({ enum: TypeTraitement })
  @IsEnum(TypeTraitement)
  type!: TypeTraitement;

  @ApiProperty({ example: 'Glyphosate 480' })
  @IsString()
  @MaxLength(120)
  produit!: string;

  @ApiPropertyOptional({ description: 'Dose appliquée' })
  @IsOptional()
  @IsNumber()
  dose?: number;

  @ApiPropertyOptional({ example: 'L/ha' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unite?: string;

  @ApiPropertyOptional({ description: 'Personne ayant appliqué le traitement' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  appliquePar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

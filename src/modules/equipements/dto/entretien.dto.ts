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
import { StatutEntretien, TypeEntretien } from '@prisma/client';

/**
 * Création d'un entretien (maintenance) rattaché à un équipement : type
 * (préventif/correctif), date, description du problème, coût, pièces
 * utilisées, technicien (effectuePar), statut et prochaine échéance.
 */
export class CreateEntretienDto {
  @ApiProperty({ enum: TypeEntretien })
  @IsEnum(TypeEntretien)
  type!: TypeEntretien;

  @ApiProperty({ example: '2026-04-10' })
  @IsDateString()
  dateEntretien!: string;

  @ApiPropertyOptional({ description: 'Description du problème / de l\'intervention' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Coût de l\'intervention' })
  @IsOptional()
  @IsNumber()
  cout?: number;

  @ApiPropertyOptional({ type: [String], description: 'Pièces utilisées' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  piecesUtilisees?: string[];

  @ApiPropertyOptional({ description: 'Technicien ayant effectué l\'intervention' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  effectuePar?: string;

  @ApiPropertyOptional({ enum: StatutEntretien, default: StatutEntretien.PLANIFIE })
  @IsOptional()
  @IsEnum(StatutEntretien)
  statut?: StatutEntretien;

  @ApiPropertyOptional({ description: 'Date de la prochaine échéance (maintenance préventive)' })
  @IsOptional()
  @IsDateString()
  prochaineEcheance?: string;
}

/** Mise à jour d'un entretien (souvent pour faire évoluer son statut). */
export class UpdateEntretienDto {
  @ApiPropertyOptional({ enum: TypeEntretien })
  @IsOptional()
  @IsEnum(TypeEntretien)
  type?: TypeEntretien;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateEntretien?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cout?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  piecesUtilisees?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  effectuePar?: string;

  @ApiPropertyOptional({ enum: StatutEntretien })
  @IsOptional()
  @IsEnum(StatutEntretien)
  statut?: StatutEntretien;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  prochaineEcheance?: string;
}

/**
 * Enregistrement d'une utilisation (heures d'usage). Le lien vers une activité
 * du calendrier est optionnel : l'usage peut être saisi directement ici, ce
 * qui rend les statistiques d'utilisation réelles sans dépendre du Module 5.
 */
export class CreateUtilisationDto {
  @ApiProperty({ example: '2026-04-12' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Nombre d\'heures d\'utilisation', example: 6.5 })
  @IsNumber()
  heuresUtilisation!: number;

  @ApiPropertyOptional({ description: 'Employé opérateur' })
  @IsOptional()
  @IsString()
  operateurId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

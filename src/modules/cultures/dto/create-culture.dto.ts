import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { StatutCulture } from '@prisma/client';

/**
 * Création d'une culture. La parcelle est obligatoire (une culture pousse
 * forcément quelque part) ; son appartenance à la ferme est vérifiée côté
 * service. Les paramètres techniques sont tous optionnels : on peut créer une
 * culture avec le minimum (nom + parcelle + date de plantation) et compléter
 * ensuite.
 */
export class CreateCultureDto {
  @ApiProperty({ description: 'Parcelle sur laquelle la culture est implantée' })
  @IsString()
  parcelleId!: string;

  @ApiProperty({ example: 'Maïs saison 1' })
  @IsString()
  @MaxLength(120)
  nom!: string;

  @ApiPropertyOptional({ example: 'Hugo' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  variete?: string;

  @ApiPropertyOptional({ example: 'Zea mays' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  espece?: string;

  @ApiPropertyOptional({ example: 120, description: 'Durée du cycle en jours' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  cycleJours?: number;

  @ApiProperty({ example: '2026-02-01' })
  @IsDateString()
  datePlantation!: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  dateRecoltePrevue?: string;

  @ApiPropertyOptional({ example: '2026-06-05' })
  @IsOptional()
  @IsDateString()
  dateRecolteReelle?: string;

  @ApiPropertyOptional({ description: 'Espacement en cm' })
  @IsOptional()
  @IsNumber()
  espacementCm?: number;

  @ApiPropertyOptional({ description: 'Densité (plants/ha)' })
  @IsOptional()
  @IsNumber()
  densite?: number;

  @ApiPropertyOptional({ description: 'Population totale (nombre de plants)' })
  @IsOptional()
  @IsInt()
  population?: number;

  @ApiPropertyOptional({ description: 'Quantité de semences' })
  @IsOptional()
  @IsNumber()
  quantiteSemences?: number;

  @ApiPropertyOptional({ example: 'kg' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  uniteSemences?: string;

  @ApiPropertyOptional({ description: 'Rendement attendu en kg' })
  @IsOptional()
  @IsNumber()
  rendementAttenduKg?: number;

  @ApiPropertyOptional({ enum: StatutCulture, default: StatutCulture.PLANIFIEE })
  @IsOptional()
  @IsEnum(StatutCulture)
  statut?: StatutCulture;
}

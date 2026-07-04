import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutCulture } from '@prisma/client';

/**
 * Filtres de listing des cultures. Recherche libre sur nom/variété/espèce,
 * filtres par statut, parcelle et espèce. Pagination bornée, tri en liste
 * blanche (cohérent avec le module Parcelles).
 */
export class QueryCultureDto {
  @ApiPropertyOptional({ description: 'Recherche sur nom, variété, espèce' })
  @IsOptional()
  @IsString()
  recherche?: string;

  @ApiPropertyOptional({ enum: StatutCulture })
  @IsOptional()
  @IsEnum(StatutCulture)
  statut?: StatutCulture;

  @ApiPropertyOptional({ description: 'Filtrer par parcelle' })
  @IsOptional()
  @IsString()
  parcelleId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par espèce (valeur exacte)' })
  @IsOptional()
  @IsString()
  espece?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['nom', 'datePlantation', 'dateRecoltePrevue', 'createdAt', 'statut'], default: 'datePlantation' })
  @IsOptional()
  @IsIn(['nom', 'datePlantation', 'dateRecoltePrevue', 'createdAt', 'statut'])
  tri?: string = 'datePlantation';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  ordre?: 'asc' | 'desc' = 'desc';
}

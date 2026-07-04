import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PrioriteActivite, StatutActivite, TypeActivite } from '@prisma/client';

/**
 * Filtres de listing des activités : recherche (titre/description), type,
 * statut, priorité, responsable, parcelle, culture, et un raccourci "en retard"
 * (calculé). Tri par date programmée par défaut.
 */
export class QueryActiviteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recherche?: string;

  @ApiPropertyOptional({ enum: TypeActivite })
  @IsOptional()
  @IsEnum(TypeActivite)
  type?: TypeActivite;

  @ApiPropertyOptional({ enum: StatutActivite })
  @IsOptional()
  @IsEnum(StatutActivite)
  statut?: StatutActivite;

  @ApiPropertyOptional({ enum: PrioriteActivite })
  @IsOptional()
  @IsEnum(PrioriteActivite)
  priorite?: PrioriteActivite;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsableId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parcelleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cultureId?: string;

  @ApiPropertyOptional({ description: 'Ne garder que les activités en retard (calculé)' })
  @IsOptional()
  @IsBooleanString()
  enRetard?: string;

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

  @ApiPropertyOptional({ enum: ['dateProgrammee', 'priorite', 'statut', 'titre', 'createdAt'], default: 'dateProgrammee' })
  @IsOptional()
  @IsIn(['dateProgrammee', 'priorite', 'statut', 'titre', 'createdAt'])
  tri?: string = 'dateProgrammee';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  ordre?: 'asc' | 'desc' = 'asc';
}

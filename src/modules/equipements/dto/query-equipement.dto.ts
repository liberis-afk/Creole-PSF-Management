import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EtatEquipement, TypeEquipement } from '@prisma/client';

/**
 * Filtres de listing des équipements, conformes à la spec : recherche par nom,
 * filtres type/état/responsable, tri par date d'acquisition (entre autres).
 * Pagination bornée, tri en liste blanche.
 */
export class QueryEquipementDto {
  @ApiPropertyOptional({ description: 'Recherche sur nom, marque, modèle, numéro de série' })
  @IsOptional()
  @IsString()
  recherche?: string;

  @ApiPropertyOptional({ enum: TypeEquipement })
  @IsOptional()
  @IsEnum(TypeEquipement)
  type?: TypeEquipement;

  @ApiPropertyOptional({ enum: EtatEquipement })
  @IsOptional()
  @IsEnum(EtatEquipement)
  etat?: EtatEquipement;

  @ApiPropertyOptional({ description: 'Filtrer par employé responsable' })
  @IsOptional()
  @IsString()
  responsableId?: string;

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

  @ApiPropertyOptional({ enum: ['nom', 'type', 'etat', 'dateAchat', 'createdAt'], default: 'dateAchat' })
  @IsOptional()
  @IsIn(['nom', 'type', 'etat', 'dateAchat', 'createdAt'])
  tri?: string = 'dateAchat';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  ordre?: 'asc' | 'desc' = 'desc';
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutParcelle, TypeDrainage } from '@prisma/client';

/**
 * Paramètres de listing. Tous optionnels. La pagination est bornée (limit max
 * 100) pour éviter qu'un client demande 10 000 lignes d'un coup. Le tri est
 * restreint à une liste blanche de colonnes — on ne laisse jamais le client
 * trier sur une colonne arbitraire (risque d'injection / de tri sur un champ
 * non indexé).
 */
export class QueryParcelleDto {
  @ApiPropertyOptional({ description: 'Recherche libre sur nom, code, adresse' })
  @IsOptional()
  @IsString()
  recherche?: string;

  @ApiPropertyOptional({ enum: StatutParcelle })
  @IsOptional()
  @IsEnum(StatutParcelle)
  statut?: StatutParcelle;

  @ApiPropertyOptional({ enum: TypeDrainage })
  @IsOptional()
  @IsEnum(TypeDrainage)
  drainage?: TypeDrainage;

  @ApiPropertyOptional({ description: 'Filtre exact sur le type de sol' })
  @IsOptional()
  @IsString()
  typeSol?: string;

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

  @ApiPropertyOptional({ enum: ['nom', 'code', 'superficieHa', 'createdAt', 'statut'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['nom', 'code', 'superficieHa', 'createdAt', 'statut'])
  tri?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  ordre?: 'asc' | 'desc' = 'desc';
}

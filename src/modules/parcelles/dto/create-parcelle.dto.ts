import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutParcelle, TypeDrainage } from '@prisma/client';
import { GeometrieDto } from './geometrie.dto';

/**
 * Données de création. `superficieHa` est optionnelle ICI : si un contour
 * GeoJSON est fourni, la superficie est calculée par PostGIS. Le service
 * refuse la création si NI superficie NI contour ne sont donnés (on ne peut
 * pas enregistrer une parcelle sans surface — le champ est non-null en base).
 */
export class CreateParcelleDto {
  @ApiProperty({ example: 'Parcelle Nord A1' })
  @IsString()
  @MaxLength(120)
  nom!: string;

  @ApiProperty({ example: 'PARC-A1', description: 'Code unique au sein de la ferme' })
  @IsString()
  @MaxLength(40)
  code!: string;

  @ApiPropertyOptional({ example: 2.5, description: 'Superficie en hectares (auto-calculée si contour fourni)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  superficieHa?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  adresse?: string;

  @ApiPropertyOptional({ example: 180.5, description: 'Altitude en mètres' })
  @IsOptional()
  @IsNumber()
  altitude?: number;

  @ApiPropertyOptional({ example: 'Argilo-limoneux' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  typeSol?: string;

  @ApiPropertyOptional({ example: 6.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(14)
  ph?: number;

  @ApiPropertyOptional({ example: 3.2, description: 'Matière organique en %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  matiereOrganique?: number;

  @ApiPropertyOptional({ example: 'Limoneuse' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  texture?: string;

  @ApiPropertyOptional({ enum: TypeDrainage })
  @IsOptional()
  @IsEnum(TypeDrainage)
  drainage?: TypeDrainage;

  @ApiPropertyOptional({ enum: StatutParcelle, default: StatutParcelle.ACTIVE })
  @IsOptional()
  @IsEnum(StatutParcelle)
  statut?: StatutParcelle;

  @ApiPropertyOptional({ type: GeometrieDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeometrieDto)
  geometrie?: GeometrieDto;
}

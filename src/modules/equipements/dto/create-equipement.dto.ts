import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { EtatEquipement, TypeEquipement } from '@prisma/client';

/**
 * Création d'un équipement. Seuls le nom et le type sont obligatoires ; tout le
 * reste (numéro de série, date/valeur d'achat, localisation, responsable…) est
 * optionnel et complétable ensuite. L'unicité du numéro de série au sein de la
 * ferme est garantie par la base (contrainte @@unique) et gérée proprement par
 * le service (409).
 */
export class CreateEquipementDto {
  @ApiProperty({ example: 'Tracteur John Deere 5075E' })
  @IsString()
  @MaxLength(120)
  nom!: string;

  @ApiProperty({ enum: TypeEquipement })
  @IsEnum(TypeEquipement)
  type!: TypeEquipement;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  marque?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  modele?: string;

  @ApiPropertyOptional({ description: "Numéro d'identification unique dans la ferme" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  numeroSerie?: string;

  @ApiPropertyOptional({ enum: EtatEquipement, default: EtatEquipement.BON })
  @IsOptional()
  @IsEnum(EtatEquipement)
  etat?: EtatEquipement;

  @ApiPropertyOptional({ example: '2024-03-15' })
  @IsOptional()
  @IsDateString()
  dateAchat?: string;

  @ApiPropertyOptional({ description: "Valeur d'achat" })
  @IsOptional()
  @IsNumber()
  coutAchat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  localisation?: string;

  @ApiPropertyOptional({ description: 'Employé responsable' })
  @IsOptional()
  @IsString()
  responsableId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

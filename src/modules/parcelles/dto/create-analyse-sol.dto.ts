import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

export class CreateAnalyseSolDto {
  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  dateAnalyse!: string;

  @ApiPropertyOptional({ example: 6.4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(14)
  ph?: number;

  @ApiPropertyOptional({ description: 'Matière organique en %' })
  @IsOptional()
  @IsNumber()
  matiereOrganique?: number;

  @ApiPropertyOptional({ description: 'Azote (N)' })
  @IsOptional()
  @IsNumber()
  azote?: number;

  @ApiPropertyOptional({ description: 'Phosphore (P)' })
  @IsOptional()
  @IsNumber()
  phosphore?: number;

  @ApiPropertyOptional({ description: 'Potassium (K)' })
  @IsOptional()
  @IsNumber()
  potassium?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  texture?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  laboratoire?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

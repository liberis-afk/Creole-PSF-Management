import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Géométrie d'une parcelle. On accepte deux formes, toutes deux optionnelles :
 *   - `contour` : un polygone GeoJSON (le tracé dessiné sur la carte). Quand
 *     il est fourni, PostGIS calcule automatiquement la superficie et le
 *     centroïde côté serveur.
 *   - `pointGps` : un simple point lat/lng, pour une parcelle localisée mais
 *     pas encore délimitée.
 *
 * La validation ici reste structurelle (types, bornes) ; la validité
 * géométrique fine (polygone fermé, non auto-sécant) est déléguée à PostGIS
 * qui rejette une géométrie invalide à l'insertion.
 */
export class PointGpsDto {
  @ApiProperty({ example: 18.5944, description: 'Latitude (WGS84)' })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: -72.3074, description: 'Longitude (WGS84)' })
  @IsNumber()
  lng!: number;
}

export class GeometrieDto {
  @ApiPropertyOptional({
    description: 'Polygone GeoJSON du contour de la parcelle',
    example: {
      type: 'Polygon',
      coordinates: [[[-72.30, 18.59], [-72.29, 18.59], [-72.29, 18.60], [-72.30, 18.60], [-72.30, 18.59]]],
    },
  })
  @IsOptional()
  contour?: GeoJsonPolygon;

  @ApiPropertyOptional({ type: PointGpsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PointGpsDto)
  pointGps?: PointGpsDto;
}

/** Forme minimale d'un polygone GeoJSON, validée en surface. */
export class GeoJsonPolygon {
  @ApiProperty({ enum: ['Polygon'] })
  @IsIn(['Polygon'])
  type!: 'Polygon';

  @ApiProperty({ description: 'Anneaux de coordonnées [ [ [lng,lat], ... ] ]' })
  @IsArray()
  coordinates!: number[][][];
}

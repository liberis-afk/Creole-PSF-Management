import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SelectFarmDto {
  @ApiProperty({ description: "Token intermédiaire reçu de POST /auth/login" })
  @IsString()
  preAuthToken!: string;

  @ApiProperty({ description: 'Identifiant de la ferme choisie' })
  @IsString()
  fermeId!: string;
}

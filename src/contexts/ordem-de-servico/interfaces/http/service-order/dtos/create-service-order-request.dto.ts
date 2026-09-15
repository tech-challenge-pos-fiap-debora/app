import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateServiceOrderRequestDto {
  @ApiProperty({
    description: 'Identificador do cliente (UUID)',
    example: '87042d7c-6942-4a9e-ba88-2615f5923265',
  })
  @IsString()
  @IsNotEmpty()
  declare clientId: string;

  @ApiProperty({
    description: 'Identificador do veículo (UUID)',
    example: '979614bc-5331-433b-b400-c5663db9055f',
  })
  @IsString()
  @IsNotEmpty()
  declare vehicleId: string;

  @ApiPropertyOptional({
    description: 'Descrição livre dos serviços solicitados pelo cliente',
    example: 'Cliente reclama de barulho na suspensão',
  })
  @IsString()
  @IsOptional()
  declare requestedServicesDescription?: string;
}

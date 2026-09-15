import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import type { Vehicle } from '../../../../domain/entities/vehicle';
import { IsPlate } from '../../../../../shared/interfaces/http/validators/is-plate.validator';

export class VehicleResponseDto {
  @ApiProperty({
    description: 'Identificador do veículo (UUID)',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Placa do veículo',
    example: 'NBK-6334',
  })
  @IsString()
  @IsNotEmpty()
  @IsPlate()
  plate: string;

  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'HR-V',
  })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({
    description: 'Marca do veículo',
    example: 'Honda',
  })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({
    description: 'Ano de fabricação do veículo',
    example: '2026',
  })
  @IsNumber()
  @IsNotEmpty()
  year: number;

  constructor(partial: Partial<VehicleResponseDto>) {
    Object.assign(this, partial);
  }

  static toDto(vehicle: Vehicle): VehicleResponseDto {
    return new VehicleResponseDto({
      id: vehicle.id,
      plate: vehicle.plate,
      model: vehicle.model,
      brand: vehicle.brand,
      year: vehicle.year,
    });
  }
}

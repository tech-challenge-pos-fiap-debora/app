import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ClientStatus } from '../../../../domain/entities/client-status';

export class UpdateClientDto {
  @ApiProperty({
    description: 'Nome do cliente',
    example: 'João Silva',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao@email.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Situação do cliente',
    enum: ClientStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}

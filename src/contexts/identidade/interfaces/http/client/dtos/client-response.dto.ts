import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import type { Client } from '../../../../domain/entities/client';
import { ClientStatus } from '../../../../domain/entities/client-status';

export class ClientResponseDto {
  @ApiProperty({
    description: 'Identificador do cliente (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Nome do cliente',
    example: 'João Silva',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao@email.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'CPF ou CNPJ do cliente',
    example: '12345678909 ou 12345678000199',
  })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({
    description: 'Situação do cliente',
    enum: ClientStatus,
    example: ClientStatus.ACTIVE,
  })
  status: ClientStatus;

  constructor(partial: Partial<ClientResponseDto>) {
    Object.assign(this, partial);
  }

  static toDto(client: Client): ClientResponseDto {
    return new ClientResponseDto({
      id: client.id,
      name: client.name,
      email: client.email,
      document: client.document,
      status: client.status,
    });
  }
}

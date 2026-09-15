import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ClientStatus } from '../../../../domain/entities/client-status';
import { IsCPFOrCNPJ } from '../../../../../shared/interfaces/http/validators/is-cpf-or-cnpj.validator';

export class CreateClientDto {
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
  @IsCPFOrCNPJ()
  document: string;

  @ApiProperty({
    description: 'Situação do cliente. Inativo não recebe JWT nem abre OS.',
    enum: ClientStatus,
    required: false,
    default: ClientStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}

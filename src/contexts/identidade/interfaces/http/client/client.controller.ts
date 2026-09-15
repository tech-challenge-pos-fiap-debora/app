import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  CreateClientUseCase,
  DeleteClientUseCase,
  GetAllClientsUseCase,
  GetClientUseCase,
  UpdateClientUseCase,
} from '../../../application/use-case/client';
import { UserRole } from '../../../domain/entities/user-role';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { ClientResponseDto } from './dtos/client-response.dto';
import { CreateClientDto } from './dtos/create-client-request.dto';
import { UpdateClientDto } from './dtos/update-client-request.dto';

@ApiTags('Identidade / Clientes')
@ApiBearerAuth()
@Controller('clients')
export class ClientController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly getAllClientsUseCase: GetAllClientsUseCase,
    private readonly getClientUseCase: GetClientUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly deleteClientUseCase: DeleteClientUseCase,
  ) {}

  @Post()
  @AuthRoles(UserRole.ADMIN, UserRole.ATENDENTE)
  async create(@Body() dto: CreateClientDto): Promise<ClientResponseDto> {
    const client = await this.createClientUseCase.execute({
      name: dto.name,
      document: dto.document,
      email: dto.email,
      status: dto.status,
    });
    return ClientResponseDto.toDto(client);
  }

  @Get()
  @AuthRoles(UserRole.ADMIN, UserRole.ATENDENTE)
  async findAll(): Promise<ClientResponseDto[]> {
    const list = await this.getAllClientsUseCase.execute();
    return list.map((c) => ClientResponseDto.toDto(c));
  }

  @Get(':document')
  @AuthRoles(UserRole.ADMIN, UserRole.ATENDENTE)
  async findOne(
    @Param('document') document: string,
  ): Promise<ClientResponseDto> {
    const client = await this.getClientUseCase.execute(document);
    return ClientResponseDto.toDto(client);
  }

  @Patch(':document')
  @AuthRoles(UserRole.ADMIN, UserRole.ATENDENTE)
  async update(
    @Param('document') document: string,
    @Body() data: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    const client = await this.updateClientUseCase.execute(document, {
      name: data.name,
      email: data.email,
      status: data.status,
    });
    return ClientResponseDto.toDto(client);
  }

  @Delete(':document')
  @AuthRoles(UserRole.ADMIN)
  remove(@Param('document') document: string) {
    return this.deleteClientUseCase.execute(document);
  }
}

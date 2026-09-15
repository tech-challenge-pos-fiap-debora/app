import { Inject, Injectable } from '@nestjs/common';
import { Client } from '../../../domain/entities/client';
import type { ClientRepositoryInterface } from '../../../domain/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../../domain/repositories/tokens';
import type { CreateClientInput } from './client.inputs';

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepositoryInterface,
  ) {}

  async execute(input: CreateClientInput): Promise<Client> {
    const user = Client.create({
      document: input.document,
      name: input.name,
      email: input.email,
      status: input.status,
    });

    return this.clientRepo.create(user);
  }
}

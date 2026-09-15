import { Inject, Injectable } from '@nestjs/common';
import {
  BusinessRuleViolationError,
  EntityNotFoundError,
} from '../../../shared/domain/errors';
import { Client } from '../../../identidade/domain/entities/client';
import type { ClientRepositoryInterface } from '../../../identidade/domain/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../../identidade/domain/repositories/tokens';
import { CreateClientUseCase } from '../../../identidade/application/use-case/client/create-client';
import type {
  ClientLookupPort,
  ClientSnapshot,
} from '../../domain/ports/client-lookup.port';
import type {
  ClientProvisioningPort,
  ProvisionClientInput,
} from '../../domain/ports/client-provisioning.port';

@Injectable()
export class IdentidadeClientAdapter
  implements ClientLookupPort, ClientProvisioningPort
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: ClientRepositoryInterface,
    private readonly createClient: CreateClientUseCase,
  ) {}

  async findById(id: string): Promise<ClientSnapshot | null> {
    const client = await this.clientRepo.findById(id);
    return client ? this.toSnapshot(client) : null;
  }

  async getOrCreate(input: ProvisionClientInput): Promise<ClientSnapshot> {
    try {
      const existing = await this.clientRepo.findByDocument(input.document);
      if (!existing.active) {
        throw new BusinessRuleViolationError('Cliente inativo');
      }
      return this.toSnapshot(existing);
    } catch (error) {
      if (!(error instanceof EntityNotFoundError)) {
        throw error;
      }
      const created = await this.createClient.execute(input);
      return this.toSnapshot(created);
    }
  }

  private toSnapshot(client: Client): ClientSnapshot {
    return {
      id: client.id,
      document: client.document,
      name: client.name,
      email: client.email,
    };
  }
}

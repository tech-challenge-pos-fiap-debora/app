import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../../../../identidade/domain/entities/client';
import { ClientStatus } from '../../../../../identidade/domain/entities/client-status';
import { ClientRepositoryInterface } from '../../../../../identidade/domain/repositories/client.repository';
import { EmailVO } from '../../../../../identidade/domain/value-objects/email.vo';
import { EntityNotFoundError } from '../../../../domain/errors';
import { DocumentVO } from '../../../../domain/value-objects/document.vo';
import { ClientEntity } from '../entities/client.entity';

@Injectable()
export class TypeormClientRepository implements ClientRepositoryInterface {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly repo: Repository<ClientEntity>,
  ) {}

  private toDomain(row: ClientEntity): Client {
    return Client.create(
      {
        name: row.name,
        email: row.email,
        document: row.document,
        status:
          row.status === ClientStatus.INACTIVE
            ? ClientStatus.INACTIVE
            : ClientStatus.ACTIVE,
      },
      row.id,
    );
  }

  async create(data: Client): Promise<Client> {
    const row = this.repo.create({
      id: data.id,
      name: data.name,
      email: data.email,
      document: data.document,
      status: data.status,
    });
    const saved = await this.repo.save(row);
    return this.toDomain(saved);
  }

  async find(): Promise<Client[]> {
    const rows = await this.repo.find();
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<Client | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByDocument(document: string): Promise<Client> {
    const docKey = DocumentVO.parse(document).value;
    const row = await this.repo.findOne({ where: { document: docKey } });
    if (!row) {
      throw new EntityNotFoundError('Client not found');
    }
    return this.toDomain(row);
  }

  async updateByDocument(
    document: string,
    dataUpdate: Partial<{ name: string; email: string; status: string }>,
  ): Promise<Client> {
    const docKey = DocumentVO.parse(document).value;
    const row = await this.repo.findOne({ where: { document: docKey } });
    if (!row) {
      throw new EntityNotFoundError('Client not found');
    }
    if (dataUpdate.name !== undefined) row.name = dataUpdate.name;
    if (dataUpdate.email !== undefined) {
      row.email = EmailVO.parse(dataUpdate.email).value;
    }
    if (dataUpdate.status !== undefined) row.status = dataUpdate.status;
    const saved = await this.repo.save(row);
    return this.toDomain(saved);
  }

  async remove(document: string): Promise<void> {
    const docKey = DocumentVO.parse(document).value;
    await this.repo.delete({ document: docKey });
  }
}

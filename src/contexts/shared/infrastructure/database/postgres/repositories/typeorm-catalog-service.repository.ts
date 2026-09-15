import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogService } from '../../../../../ordem-de-servico/domain/entities/catalog-service';
import type { CatalogServiceUpdateInput } from '../../../../../ordem-de-servico/domain/repositories/catalog-service.repository';
import { CatalogServiceRepositoryInterface } from '../../../../../ordem-de-servico/domain/repositories/catalog-service.repository';
import { CatalogServiceEntity } from '../entities/catalog-service.entity';

@Injectable()
export class TypeormCatalogServiceRepository implements CatalogServiceRepositoryInterface {
  constructor(
    @InjectRepository(CatalogServiceEntity)
    private readonly repo: Repository<CatalogServiceEntity>,
  ) {}

  private toDomain(row: CatalogServiceEntity): CatalogService {
    return CatalogService.create(
      {
        name: row.name,
        description: row.description,
        basePrice: Number(row.basePrice),
        active: row.active,
        defaultParts: row.defaultParts ?? [],
      },
      row.id,
    );
  }

  async create(data: CatalogService): Promise<CatalogService> {
    const row = this.repo.create({
      id: data.id,
      name: data.name,
      description: data.description,
      basePrice: data.basePrice,
      active: data.active,
      defaultParts: data.defaultParts,
    });
    const saved = await this.repo.save(row);
    return this.toDomain(saved);
  }

  async find(): Promise<CatalogService[]> {
    const rows = await this.repo.find();
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<CatalogService | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async updateById(
    id: string,
    data: CatalogServiceUpdateInput,
  ): Promise<CatalogService | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) return null;
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    ) as CatalogServiceUpdateInput;
    Object.assign(row, payload);
    const saved = await this.repo.save(row);
    return this.toDomain(saved);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}

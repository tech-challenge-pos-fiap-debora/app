import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import {
  ProductBatch,
  type ProductBatchProps,
} from '../../../../../estoque/domain/entities/product-batch';
import { ProductBatchRepositoryInterface } from '../../../../../estoque/domain/repositories/product-batch.repository';
import { EntityNotFoundError } from '../../../../domain/errors';
import { ProductBatchEntity } from '../entities/product-batch.entity';

@Injectable()
export class TypeormProductBatchRepository implements ProductBatchRepositoryInterface {
  constructor(
    @InjectRepository(ProductBatchEntity)
    private readonly repo: Repository<ProductBatchEntity>,
  ) {}

  private toDomain(row: ProductBatchEntity): ProductBatch {
    return ProductBatch.restore(
      {
        productCode: row.productCode,
        quantity: Number(row.quantity),
        costPrice: Number(row.costPrice),
        salePrice: Number(row.salePrice),
      },
      row.id,
    );
  }

  async create(data: ProductBatch): Promise<ProductBatch> {
    const row = this.repo.create({
      id: data.id,
      productCode: data.productCode,
      quantity: data.quantity,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
    });
    const saved = await this.repo.save(row);
    return this.toDomain(saved);
  }

  async find(): Promise<ProductBatch[]> {
    const rows = await this.repo.find();
    return rows.map((r) => this.toDomain(r));
  }

  async findByCodeProduct(productCode: string): Promise<ProductBatch[]> {
    const rows = await this.repo.find({ where: { productCode } });
    if (!rows.length) {
      throw new EntityNotFoundError('Product Batch not found');
    }
    return rows.map((r) => this.toDomain(r));
  }

  async findAvailableByCode(productCode: string): Promise<ProductBatch[]> {
    const rows = await this.repo.find({
      where: { productCode, quantity: MoreThan(0) },
      order: { createdAt: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async updateById(
    id: string,
    dataUpdate: Partial<ProductBatchProps>,
  ): Promise<ProductBatch> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new EntityNotFoundError('ProductBatch not found');
    }
    if (dataUpdate.quantity !== undefined) row.quantity = dataUpdate.quantity;
    if (dataUpdate.costPrice !== undefined) row.costPrice = dataUpdate.costPrice;
    if (dataUpdate.salePrice !== undefined) row.salePrice = dataUpdate.salePrice;
    const saved = await this.repo.save(row);
    return this.toDomain(saved);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Product,
  type ProductProps,
} from '../../../../../estoque/domain/entities/product';
import { ProductRepositoryInterface } from '../../../../../estoque/domain/repositories/product.repository';
import { EntityNotFoundError } from '../../../../domain/errors';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class TypeormProductRepository implements ProductRepositoryInterface {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
  ) {}

  private toDomain(row: ProductEntity): Product {
    return Product.create(
      {
        code: row.code,
        name: row.name,
        description: row.description,
      },
      row.id,
    );
  }

  async create(data: Product): Promise<Product> {
    const row = this.repo.create({
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
    });
    const saved = await this.repo.save(row);
    return this.toDomain(saved);
  }

  async find(): Promise<Product[]> {
    const rows = await this.repo.find();
    return rows.map((r) => this.toDomain(r));
  }

  async findByCodeOrNull(code: string): Promise<Product | null> {
    const row = await this.repo.findOne({ where: { code } });
    return row ? this.toDomain(row) : null;
  }

  async findByCode(code: string): Promise<Product> {
    const row = await this.repo.findOne({ where: { code } });
    if (!row) {
      throw new EntityNotFoundError('Product not found');
    }
    return this.toDomain(row);
  }

  async updateByCode(
    code: string,
    dataUpdate: Partial<Pick<ProductProps, 'name' | 'description'>>,
  ): Promise<Product> {
    const row = await this.repo.findOne({ where: { code } });
    if (!row) {
      throw new EntityNotFoundError('Product not found');
    }
    Object.assign(row, dataUpdate);
    const saved = await this.repo.save(row);
    return this.toDomain(saved);
  }

  async remove(code: string): Promise<void> {
    await this.repo.delete({ code });
  }
}

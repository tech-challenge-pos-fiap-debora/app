import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ProductBatchEntity,
  ProductEntity,
} from '../../../shared/infrastructure/database/postgres/entities';
import { TypeormProductBatchRepository } from '../../../shared/infrastructure/database/postgres/repositories/typeorm-product-batch.repository';
import { TypeormProductRepository } from '../../../shared/infrastructure/database/postgres/repositories/typeorm-product.repository';
import {
  PRODUCT_BATCH_REPOSITORY,
  PRODUCT_REPOSITORY,
} from '../../domain/repositories/tokens';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity, ProductBatchEntity])],
  providers: [
    {
      provide: PRODUCT_REPOSITORY,
      useClass: TypeormProductRepository,
    },
    {
      provide: PRODUCT_BATCH_REPOSITORY,
      useClass: TypeormProductBatchRepository,
    },
  ],
  exports: [PRODUCT_REPOSITORY, PRODUCT_BATCH_REPOSITORY],
})
export class EstoqueDatabaseModule {}

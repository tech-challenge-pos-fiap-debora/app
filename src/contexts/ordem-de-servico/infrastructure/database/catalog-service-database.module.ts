import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogServiceEntity } from '../../../shared/infrastructure/database/postgres/entities';
import { TypeormCatalogServiceRepository } from '../../../shared/infrastructure/database/postgres/repositories/typeorm-catalog-service.repository';
import { CATALOG_SERVICE_REPOSITORY } from '../../domain/repositories/catalog-service-repository.token';

@Module({
  imports: [TypeOrmModule.forFeature([CatalogServiceEntity])],
  providers: [
    {
      provide: CATALOG_SERVICE_REPOSITORY,
      useClass: TypeormCatalogServiceRepository,
    },
  ],
  exports: [CATALOG_SERVICE_REPOSITORY],
})
export class CatalogServiceDatabaseModule {}

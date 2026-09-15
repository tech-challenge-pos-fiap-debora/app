import { CatalogServiceEntity } from './catalog-service.entity';
import { ClientEntity } from './client.entity';
import { ProductBatchEntity } from './product-batch.entity';
import { ProductEntity } from './product.entity';
import { ServiceOrderEntity } from './service-order.entity';
import { UserEntity } from './user.entity';
import { VehicleEntity } from './vehicle.entity';

export const POSTGRES_ENTITIES = [
  ClientEntity,
  UserEntity,
  VehicleEntity,
  ProductEntity,
  ProductBatchEntity,
  CatalogServiceEntity,
  ServiceOrderEntity,
];

export {
  CatalogServiceEntity,
  ClientEntity,
  ProductBatchEntity,
  ProductEntity,
  ServiceOrderEntity,
  UserEntity,
  VehicleEntity,
};

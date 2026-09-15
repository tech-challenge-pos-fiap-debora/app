import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrderEntity } from '../../../shared/infrastructure/database/postgres/entities';
import { TypeormServiceOrderRepository } from '../../../shared/infrastructure/database/postgres/repositories/typeorm-service-order.repository';
import { SERVICE_ORDER_REPOSITORY } from '../../domain/repositories/tokens';
import {
  SERVICE_ORDER_PERSISTENCE,
  TelemetryServiceOrderRepository,
} from '../observability/telemetry-service-order.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrderEntity])],
  providers: [
    {
      provide: SERVICE_ORDER_PERSISTENCE,
      useClass: TypeormServiceOrderRepository,
    },
    {
      provide: SERVICE_ORDER_REPOSITORY,
      useClass: TelemetryServiceOrderRepository,
    },
  ],
  exports: [SERVICE_ORDER_REPOSITORY],
})
export class OrdemDeServicoDatabaseModule {}

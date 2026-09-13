import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '../../../shared/infrastructure/database/mongodb/mongodb.module';
import {
  ServiceOrderModel,
  ServiceOrderSchema,
} from './mongodb/models/service-order/service-order.model';
import { MongodbServiceOrderRepository } from './mongodb/repositories/mongodb-service-order-repository';
import { SERVICE_ORDER_REPOSITORY } from '../../domain/repositories/tokens';
import {
  SERVICE_ORDER_PERSISTENCE,
  TelemetryServiceOrderRepository,
} from '../observability/telemetry-service-order.repository';

@Module({
  imports: [
    MongodbModule,
    MongooseModule.forFeature([
      {
        name: ServiceOrderModel.name,
        schema: ServiceOrderSchema,
      },
    ]),
  ],
  providers: [
    {
      provide: SERVICE_ORDER_PERSISTENCE,
      useClass: MongodbServiceOrderRepository,
    },
    {
      provide: SERVICE_ORDER_REPOSITORY,
      useClass: TelemetryServiceOrderRepository,
    },
  ],
  exports: [SERVICE_ORDER_REPOSITORY],
})
export class OrdemDeServicoDatabaseModule {}

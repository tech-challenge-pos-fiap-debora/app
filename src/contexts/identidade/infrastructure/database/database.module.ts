import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ClientEntity,
  UserEntity,
  VehicleEntity,
} from '../../../shared/infrastructure/database/postgres/entities';
import { TypeormClientRepository } from '../../../shared/infrastructure/database/postgres/repositories/typeorm-client.repository';
import { TypeormUserRepository } from '../../../shared/infrastructure/database/postgres/repositories/typeorm-user.repository';
import { TypeormVehicleRepository } from '../../../shared/infrastructure/database/postgres/repositories/typeorm-vehicle.repository';
import {
  CLIENT_REPOSITORY,
  USER_REPOSITORY,
  VEHICLE_REPOSITORY,
} from '../../domain/repositories/tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientEntity, VehicleEntity, UserEntity]),
  ],
  providers: [
    {
      provide: CLIENT_REPOSITORY,
      useClass: TypeormClientRepository,
    },
    {
      provide: VEHICLE_REPOSITORY,
      useClass: TypeormVehicleRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: TypeormUserRepository,
    },
  ],
  exports: [CLIENT_REPOSITORY, VEHICLE_REPOSITORY, USER_REPOSITORY],
})
export class IdentidadeDatabaseModule {}

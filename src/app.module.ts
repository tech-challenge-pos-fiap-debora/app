import { Module } from '@nestjs/common';
import { ConfigureModule } from './contexts/shared/infrastructure/configure/configure.module';
import { ObservabilityModule } from './contexts/shared/infrastructure/observability/observability.module';
import { EstoqueModule } from './contexts/shared/infrastructure/ioc/estoque.module';
import { HealthModule } from './contexts/shared/infrastructure/ioc/health.module';
import { IdentidadeModule } from './contexts/shared/infrastructure/ioc/identidade.module';
import { OrdemDeServicoModule } from './contexts/shared/infrastructure/ioc/ordem-de-servico.module';

@Module({
  imports: [
    ConfigureModule,
    ObservabilityModule,
    HealthModule,
    IdentidadeModule,
    EstoqueModule,
    OrdemDeServicoModule,
  ],
})
export class AppModule {}

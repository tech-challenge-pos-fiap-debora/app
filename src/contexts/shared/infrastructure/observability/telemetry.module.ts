import { Global, Module, type Type } from '@nestjs/common';
import {
  TELEMETRY,
  type TelemetryPort,
} from '../../domain/ports/telemetry.port';
import { NoopTelemetryAdapter } from './noop-telemetry.adapter';

export function isTelemetryEnabled(): boolean {
  return (
    Boolean(process.env.NEW_RELIC_LICENSE_KEY) &&
    process.env.NEW_RELIC_ENABLED !== 'false'
  );
}

function resolveTelemetryAdapter(): Type<TelemetryPort> {
  if (!isTelemetryEnabled()) {
    return NoopTelemetryAdapter;
  }

  // O pacote `newrelic` sobe o agente (e addons nativos) no import. O Jest
  // recarrega o módulo a cada spec e isso termina em segfault no CI.
  const { NewRelicTelemetryAdapter } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./new-relic-telemetry.adapter') as typeof import('./new-relic-telemetry.adapter');

  return NewRelicTelemetryAdapter;
}

@Global()
@Module({
  providers: [
    {
      provide: TELEMETRY,
      useClass: resolveTelemetryAdapter(),
    },
  ],
  exports: [TELEMETRY],
})
export class TelemetryModule {}

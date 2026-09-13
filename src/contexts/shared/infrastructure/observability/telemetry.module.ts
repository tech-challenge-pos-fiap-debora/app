import { Global, Module } from '@nestjs/common';
import { TELEMETRY } from '../../domain/ports/telemetry.port';
import { NewRelicTelemetryAdapter } from './new-relic-telemetry.adapter';
import { NoopTelemetryAdapter } from './noop-telemetry.adapter';

export function isTelemetryEnabled(): boolean {
  return (
    Boolean(process.env.NEW_RELIC_LICENSE_KEY) &&
    process.env.NEW_RELIC_ENABLED !== 'false'
  );
}

@Global()
@Module({
  providers: [
    {
      provide: TELEMETRY,
      useClass: isTelemetryEnabled()
        ? NewRelicTelemetryAdapter
        : NoopTelemetryAdapter,
    },
  ],
  exports: [TELEMETRY],
})
export class TelemetryModule {}

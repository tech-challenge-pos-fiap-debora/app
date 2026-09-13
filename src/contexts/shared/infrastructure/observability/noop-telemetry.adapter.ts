import { Injectable } from '@nestjs/common';
import type { TelemetryPort } from '../../domain/ports/telemetry.port';

/**
 * Usado quando não há license key configurada (desenvolvimento local e testes),
 * para que a aplicação suba sem depender de conectividade com o New Relic.
 */
@Injectable()
export class NoopTelemetryAdapter implements TelemetryPort {
  recordEvent(): void {}

  recordError(): void {}

  addTransactionAttribute(): void {}
}

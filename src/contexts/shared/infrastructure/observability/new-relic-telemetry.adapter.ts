import { Injectable } from '@nestjs/common';
import newrelic from 'newrelic';
import type {
  BusinessEventType,
  TelemetryAttributes,
  TelemetryPort,
} from '../../domain/ports/telemetry.port';

/**
 * Telemetria sobre o agente APM. O agente já é carregado por `-r newrelic`,
 * então este import apenas recupera a API pública dele.
 */
@Injectable()
export class NewRelicTelemetryAdapter implements TelemetryPort {
  recordEvent(type: BusinessEventType, attributes: TelemetryAttributes): void {
    // Eventos customizados não herdam o contexto da transação; sem o traceId
    // não é possível saltar do evento de negócio para o trace que o originou.
    const { traceId } = newrelic.getTraceMetadata();

    newrelic.recordCustomEvent(
      type,
      traceId ? { ...attributes, traceId } : attributes,
    );
  }

  recordError(error: Error, attributes: TelemetryAttributes = {}): void {
    newrelic.noticeError(error, attributes);
  }

  addTransactionAttribute(key: string, value: string | number | boolean): void {
    newrelic.addCustomAttribute(key, value);
  }
}

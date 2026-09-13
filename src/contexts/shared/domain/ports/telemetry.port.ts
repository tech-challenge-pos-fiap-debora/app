export const TELEMETRY = Symbol('TELEMETRY');

export type TelemetryAttributes = Record<string, string | number | boolean>;

/**
 * Tipos de evento consultados pelos dashboards de negócio.
 * O nome é usado literalmente como event type nas consultas NRQL.
 */
export type BusinessEventType = 'ServiceOrderEvent' | 'IntegrationFailureEvent';

export interface TelemetryPort {
  /** Registra um evento de negócio consultável por NRQL. */
  recordEvent(type: BusinessEventType, attributes: TelemetryAttributes): void;

  /** Registra um erro capturado, associado à transação em curso. */
  recordError(error: Error, attributes?: TelemetryAttributes): void;

  /** Anexa um atributo à transação em curso (ex.: correlation id). */
  addTransactionAttribute(key: string, value: string | number | boolean): void;
}

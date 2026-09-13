import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  TELEMETRY,
  type TelemetryAttributes,
  type TelemetryPort,
} from '../../../shared/domain/ports/telemetry.port';
import type { ServiceOrder } from '../../domain/entities/service-order';
import type { ServiceOrderRepositoryInterface } from '../../domain/repositories/service-order.repository';

export const SERVICE_ORDER_PERSISTENCE = Symbol('SERVICE_ORDER_PERSISTENCE');

/**
 * Decora o repositório de persistência publicando os eventos de domínio da
 * ordem de serviço. Fica na borda da persistência para que só transições
 * efetivamente gravadas virem métrica de negócio.
 */
@Injectable()
export class TelemetryServiceOrderRepository implements ServiceOrderRepositoryInterface {
  private readonly logger = new Logger(TelemetryServiceOrderRepository.name);

  constructor(
    @Inject(SERVICE_ORDER_PERSISTENCE)
    private readonly inner: ServiceOrderRepositoryInterface,
    @Inject(TELEMETRY)
    private readonly telemetry: TelemetryPort,
  ) {}

  async create(order: ServiceOrder): Promise<ServiceOrder> {
    const created = await this.inner.create(order);
    this.publishEvents(order);
    return created;
  }

  async save(order: ServiceOrder): Promise<ServiceOrder | null> {
    const saved = await this.inner.save(order);
    if (saved) this.publishEvents(order);
    return saved;
  }

  find(): Promise<ServiceOrder[]> {
    return this.inner.find();
  }

  findById(id: string): Promise<ServiceOrder | null> {
    return this.inner.findById(id);
  }

  findOpenByDocument(
    document: string,
    plate?: string,
  ): Promise<ServiceOrder[]> {
    return this.inner.findOpenByDocument(document, plate);
  }

  findFinished(): Promise<ServiceOrder[]> {
    return this.inner.findFinished();
  }

  private publishEvents(order: ServiceOrder): void {
    for (const event of order.pullDomainEvents()) {
      const attributes: TelemetryAttributes = {
        event: event.type,
        serviceOrderId: event.serviceOrderId,
        status: event.status,
        occurredAt: event.occurredAt.toISOString(),
      };

      if (event.previousStatus) {
        attributes.previousStatus = event.previousStatus;
      }
      if (event.previousStatusDurationMs !== null) {
        attributes.previousStatusDurationMs = event.previousStatusDurationMs;
      }

      this.telemetry.recordEvent('ServiceOrderEvent', attributes);
      this.logger.log(
        `${event.type} serviceOrderId=${event.serviceOrderId} status=${event.status}`,
      );
    }
  }
}

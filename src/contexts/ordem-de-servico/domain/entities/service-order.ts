import { randomUUID } from 'crypto';
import { DocumentVO } from '../../../shared/domain/value-objects/document.vo';
import { PlateVO } from '../../../shared/domain/value-objects/plate.vo';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { EDITABLE_STATUSES, ServiceOrderStatus } from './service-order-status';

export type ServiceLineDefaultPart = {
  productCode: string;
  name: string;
  quantity: number;
};

export type ServiceOrderServiceLine = {
  id: string;
  catalogServiceId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  defaultParts: ServiceLineDefaultPart[];
};

type ServiceOrderServiceLineStored = Omit<
  ServiceOrderServiceLine,
  'unitPrice'
> & {
  unitPrice: Money;
};

export type ServiceOrderPartLine = {
  id: string;
  productCode: string;
  name: string;
  quantity: number;
};

export type BudgetItemType = 'SERVICE' | 'PART';

export type BudgetItem = {
  type: BudgetItemType;
  referenceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Budget = {
  items: BudgetItem[];
  servicesTotal: number;
  partsTotal: number;
  total: number;
  approved: boolean;
  approvedAt?: Date;
};

export type StatusHistoryEntry = {
  from: ServiceOrderStatus | null;
  to: ServiceOrderStatus;
  at: Date;
};

export type ServiceOrderDomainEvent = {
  type: 'ServiceOrderOpened' | 'ServiceOrderStatusChanged';
  serviceOrderId: string;
  status: ServiceOrderStatus;
  previousStatus: ServiceOrderStatus | null;
  /** Quanto tempo a ordem permaneceu no status anterior, em milissegundos. */
  previousStatusDurationMs: number | null;
  occurredAt: Date;
};

export type ServiceOrderClientSnapshot = {
  id: string;
  document: DocumentVO;
  name: string;
};

export type ServiceOrderVehicleSnapshot = {
  id: string;
  plate: PlateVO;
  brand: string;
  model: string;
  year: number;
};

export type ServiceOrderProps = {
  status: ServiceOrderStatus;
  client: ServiceOrderClientSnapshot;
  vehicle: ServiceOrderVehicleSnapshot;
  requestedServicesDescription?: string;
  diagnosis?: string;
  serviceLines: ServiceOrderServiceLineStored[];
  partLines: ServiceOrderPartLine[];
  budget?: Budget;
  statusHistory: StatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  deliveredAt?: Date;
  cancellationReason?: string;
};

export type CreateServiceOrderInput = {
  client: {
    id: string;
    document: string;
    name: string;
  };
  vehicle: {
    id: string;
    plate: string;
    brand: string;
    model: string;
    year: number;
  };
  requestedServicesDescription?: string;
  serviceLines?: Omit<ServiceOrderServiceLine, 'id'>[];
  partLines?: Omit<ServiceOrderPartLine, 'id'>[];
};

export class ServiceOrder {
  public readonly id: string;
  private props: ServiceOrderProps;
  private pendingEvents: ServiceOrderDomainEvent[] = [];

  private constructor(props: ServiceOrderProps, id?: string) {
    this.id = id || randomUUID();
    this.props = props;
  }

  /**
   * Devolve e limpa os eventos acumulados desde a última leitura. Consumido na
   * persistência, para que a telemetria só registre transições efetivadas.
   */
  pullDomainEvents(): ServiceOrderDomainEvent[] {
    const events = this.pendingEvents;
    this.pendingEvents = [];
    return events;
  }

  static create(input: CreateServiceOrderInput, id?: string): ServiceOrder {
    const now = new Date();
    const order = new ServiceOrder(
      {
        status: ServiceOrderStatus.RECEIVED,
        client: {
          id: input.client.id,
          document: DocumentVO.parse(input.client.document),
          name: input.client.name,
        },
        vehicle: {
          id: input.vehicle.id,
          plate: PlateVO.parse(input.vehicle.plate),
          brand: input.vehicle.brand,
          model: input.vehicle.model,
          year: input.vehicle.year,
        },
        requestedServicesDescription: input.requestedServicesDescription,
        serviceLines: (input.serviceLines ?? []).map((line) =>
          ServiceOrder.buildServiceLine(line),
        ),
        partLines: (input.partLines ?? []).map((line) =>
          ServiceOrder.buildPartLine(line),
        ),
        statusHistory: [
          { from: null, to: ServiceOrderStatus.RECEIVED, at: now },
        ],
        createdAt: now,
        updatedAt: now,
      },
      id,
    );

    order.pendingEvents.push({
      type: 'ServiceOrderOpened',
      serviceOrderId: order.id,
      status: ServiceOrderStatus.RECEIVED,
      previousStatus: null,
      previousStatusDurationMs: null,
      occurredAt: now,
    });

    return order;
  }

  static restore(props: ServiceOrderProps, id: string): ServiceOrder {
    return new ServiceOrder(props, id);
  }

  get status() {
    return this.props.status;
  }
  get clientId() {
    return this.props.client.id;
  }
  get clientDocument() {
    return this.props.client.document.value;
  }
  get clientName() {
    return this.props.client.name;
  }
  get vehicleId() {
    return this.props.vehicle.id;
  }
  get vehiclePlate() {
    return this.props.vehicle.plate.value;
  }
  get vehicleBrand() {
    return this.props.vehicle.brand;
  }
  get vehicleModel() {
    return this.props.vehicle.model;
  }
  get vehicleYear() {
    return this.props.vehicle.year;
  }
  get requestedServicesDescription() {
    return this.props.requestedServicesDescription;
  }
  get diagnosis() {
    return this.props.diagnosis;
  }
  get serviceLines(): ServiceOrderServiceLine[] {
    return this.props.serviceLines.map((l) => ({
      id: l.id,
      catalogServiceId: l.catalogServiceId,
      name: l.name,
      unitPrice: l.unitPrice.value,
      quantity: l.quantity,
      defaultParts: [...l.defaultParts],
    }));
  }
  get partLines(): ServiceOrderPartLine[] {
    return [...this.props.partLines];
  }
  get budget() {
    return this.props.budget
      ? { ...this.props.budget, items: [...this.props.budget.items] }
      : undefined;
  }
  get statusHistory() {
    return [...this.props.statusHistory];
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
  get startedAt() {
    return this.props.startedAt;
  }
  get finishedAt() {
    return this.props.finishedAt;
  }
  get deliveredAt() {
    return this.props.deliveredAt;
  }
  get cancellationReason() {
    return this.props.cancellationReason;
  }

  isInExecution(): boolean {
    return this.props.status === ServiceOrderStatus.IN_EXECUTION;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private transitionTo(next: ServiceOrderStatus): void {
    const at = new Date();
    const previous = this.props.status;
    const enteredPreviousAt = this.props.statusHistory.at(-1)?.at;

    this.props.statusHistory.push({ from: previous, to: next, at });
    this.props.status = next;
    this.props.updatedAt = at;

    this.pendingEvents.push({
      type: 'ServiceOrderStatusChanged',
      serviceOrderId: this.id,
      status: next,
      previousStatus: previous,
      previousStatusDurationMs: enteredPreviousAt
        ? at.getTime() - enteredPreviousAt.getTime()
        : null,
      occurredAt: at,
    });
  }

  private assertEditable(): void {
    if (!EDITABLE_STATUSES.includes(this.props.status)) {
      throw new Error(`Cannot edit lines while status is ${this.props.status}`);
    }
  }

  private autoTransitionToDiagnosisIfReceived(): void {
    if (this.props.status === ServiceOrderStatus.RECEIVED) {
      this.transitionTo(ServiceOrderStatus.IN_DIAGNOSIS);
    }
  }

  registerDiagnosis(diagnosis: string): void {
    if (
      this.props.status !== ServiceOrderStatus.RECEIVED &&
      this.props.status !== ServiceOrderStatus.IN_DIAGNOSIS
    ) {
      throw new Error(
        `Cannot register diagnosis when status is ${this.props.status}`,
      );
    }
    const trimmed = diagnosis?.trim();
    if (!trimmed) {
      throw new Error('Diagnosis must not be empty');
    }
    this.props.diagnosis = trimmed;
    if (this.props.status !== ServiceOrderStatus.IN_DIAGNOSIS) {
      this.transitionTo(ServiceOrderStatus.IN_DIAGNOSIS);
    } else {
      this.touch();
    }
  }

  private static buildServiceLine(
    line: Omit<ServiceOrderServiceLine, 'id'>,
    id: string = randomUUID(),
  ): ServiceOrderServiceLineStored {
    if (!line.name?.trim()) {
      throw new Error('Service line name is required');
    }
    const unitMoney = Money.parse(line.unitPrice);
    if (line.quantity <= 0) {
      throw new Error('Service line quantity must be > 0');
    }
    return {
      id,
      catalogServiceId: line.catalogServiceId,
      name: line.name.trim(),
      unitPrice: unitMoney,
      quantity: line.quantity,
      defaultParts: line.defaultParts.map((p) => ({
        productCode: p.productCode.toUpperCase(),
        name: p.name,
        quantity: p.quantity,
      })),
    };
  }

  private static buildPartLine(
    line: Omit<ServiceOrderPartLine, 'id'>,
    id: string = randomUUID(),
  ): ServiceOrderPartLine {
    if (line.quantity <= 0) {
      throw new Error('Part line quantity must be > 0');
    }
    if (!line.productCode?.trim()) {
      throw new Error('Part line productCode is required');
    }
    return {
      id,
      productCode: line.productCode.toUpperCase(),
      name: line.name,
      quantity: line.quantity,
    };
  }

  addServiceLine(
    line: Omit<ServiceOrderServiceLine, 'id'>,
    id: string = randomUUID(),
  ): ServiceOrderServiceLine {
    this.assertEditable();
    const created = ServiceOrder.buildServiceLine(line, id);
    this.props.serviceLines.push(created);
    this.invalidateBudget();
    this.autoTransitionToDiagnosisIfReceived();
    this.touch();
    return {
      id: created.id,
      catalogServiceId: created.catalogServiceId,
      name: created.name,
      unitPrice: created.unitPrice.value,
      quantity: created.quantity,
      defaultParts: [...created.defaultParts],
    };
  }

  addPartLine(
    line: Omit<ServiceOrderPartLine, 'id'>,
    id: string = randomUUID(),
  ): ServiceOrderPartLine {
    this.assertEditable();
    const created = ServiceOrder.buildPartLine(line, id);
    this.props.partLines.push(created);
    this.invalidateBudget();
    this.autoTransitionToDiagnosisIfReceived();
    this.touch();
    return created;
  }

  private invalidateBudget(): void {
    if (this.props.budget) {
      this.props.budget = undefined;
      if (this.props.status === ServiceOrderStatus.WAITING_APPROVAL) {
        this.transitionTo(ServiceOrderStatus.IN_DIAGNOSIS);
      }
    }
  }

  applyBudget(budget: Budget): void {
    this.assertEditable();
    if (this.props.serviceLines.length + this.props.partLines.length === 0) {
      throw new Error('Cannot generate budget without lines');
    }
    this.props.budget = {
      ...budget,
      approved: false,
      approvedAt: undefined,
      items: [...budget.items],
    };
    if (this.props.status !== ServiceOrderStatus.WAITING_APPROVAL) {
      this.transitionTo(ServiceOrderStatus.WAITING_APPROVAL);
    } else {
      this.touch();
    }
  }

  approveBudget(): void {
    if (this.props.status !== ServiceOrderStatus.WAITING_APPROVAL) {
      throw new Error(
        `Cannot approve budget when status is ${this.props.status}`,
      );
    }
    if (!this.props.budget) {
      throw new Error('Cannot approve budget that was not generated');
    }
    if (this.props.budget.approved) {
      this.touch();
      return;
    }
    this.props.budget.approved = true;
    this.props.budget.approvedAt = new Date();
    this.touch();
  }

  rejectBudget(reason?: string): void {
    if (this.props.status !== ServiceOrderStatus.WAITING_APPROVAL) {
      throw new Error(
        `Cannot reject budget when status is ${this.props.status}`,
      );
    }
    if (!this.props.budget) {
      throw new Error('Cannot reject without a generated budget');
    }
    if (this.props.budget.approved) {
      throw new Error('Cannot reject an approved budget');
    }
    const trimmed = reason?.trim();
    this.props.cancellationReason =
      trimmed ?? 'Orçamento reprovado pelo cliente';
    this.props.budget = undefined;
    this.transitionTo(ServiceOrderStatus.CANCELLED);
  }

  startExecution(): void {
    if (this.props.status !== ServiceOrderStatus.WAITING_APPROVAL) {
      throw new Error(
        `Cannot start execution when status is ${this.props.status}`,
      );
    }
    if (!this.props.budget?.approved) {
      throw new Error('Cannot start execution without an approved budget');
    }
    this.props.startedAt = new Date();
    this.transitionTo(ServiceOrderStatus.IN_EXECUTION);
  }

  finish(): void {
    if (this.props.status !== ServiceOrderStatus.IN_EXECUTION) {
      throw new Error(
        `Cannot finish service order when status is ${this.props.status}`,
      );
    }
    this.props.finishedAt = new Date();
    this.transitionTo(ServiceOrderStatus.FINISHED);
  }

  deliver(): void {
    if (this.props.status !== ServiceOrderStatus.FINISHED) {
      throw new Error(
        `Cannot deliver service order when status is ${this.props.status}`,
      );
    }
    this.props.deliveredAt = new Date();
    this.transitionTo(ServiceOrderStatus.DELIVERED);
  }

  toJSON() {
    return {
      id: this.id,
      status: this.props.status,
      client: {
        id: this.props.client.id,
        document: this.props.client.document.value,
        name: this.props.client.name,
      },
      vehicle: {
        id: this.props.vehicle.id,
        plate: this.props.vehicle.plate.value,
        brand: this.props.vehicle.brand,
        model: this.props.vehicle.model,
        year: this.props.vehicle.year,
      },
      requestedServicesDescription: this.props.requestedServicesDescription,
      diagnosis: this.props.diagnosis,
      serviceLines: this.serviceLines,
      partLines: this.partLines,
      budget: this.budget,
      statusHistory: this.statusHistory,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      startedAt: this.props.startedAt,
      finishedAt: this.props.finishedAt,
      deliveredAt: this.props.deliveredAt,
      cancellationReason: this.props.cancellationReason,
    };
  }

  aggregatePartDemand(): Map<string, number> {
    const map = new Map<string, number>();
    for (const line of this.props.serviceLines) {
      for (const p of line.defaultParts) {
        const need = p.quantity * line.quantity;
        map.set(p.productCode, (map.get(p.productCode) ?? 0) + need);
      }
    }
    for (const part of this.props.partLines) {
      map.set(
        part.productCode,
        (map.get(part.productCode) ?? 0) + part.quantity,
      );
    }
    return map;
  }
}

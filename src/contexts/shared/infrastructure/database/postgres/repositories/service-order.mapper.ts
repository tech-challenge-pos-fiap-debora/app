import {
  ServiceOrder,
  type BudgetItem,
  type ServiceOrderProps,
} from '../../../../../ordem-de-servico/domain/entities/service-order';
import { DocumentVO } from '../../../../domain/value-objects/document.vo';
import { Money } from '../../../../domain/value-objects/money.vo';
import { PlateVO } from '../../../../domain/value-objects/plate.vo';
import { ServiceOrderEntity } from '../entities/service-order.entity';

function mapBudgetItem(raw: {
  type: string;
  referenceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}): BudgetItem {
  return {
    type: raw.type as BudgetItem['type'],
    referenceId: raw.referenceId,
    description: raw.description,
    quantity: raw.quantity,
    unitPrice: raw.unitPrice,
    total: raw.total,
  };
}

export function entityToServiceOrder(row: ServiceOrderEntity): ServiceOrder {
  const props: ServiceOrderProps = {
    status: row.status as ServiceOrderProps['status'],
    client: {
      id: row.clientId,
      document: DocumentVO.parse(row.clientDocument),
      name: row.clientName,
    },
    vehicle: {
      id: row.vehicleId,
      plate: PlateVO.parse(row.vehiclePlate),
      brand: row.vehicleBrand,
      model: row.vehicleModel,
      year: row.vehicleYear,
    },
    requestedServicesDescription: row.requestedServicesDescription,
    diagnosis: row.diagnosis,
    serviceLines: (row.serviceLines ?? []).map((l) => ({
      id: String(l.id),
      catalogServiceId: String(l.catalogServiceId),
      name: String(l.name),
      unitPrice: Money.parse(Number(l.unitPrice)),
      quantity: Number(l.quantity),
      defaultParts: ((l.defaultParts as unknown[]) ?? []).map((p) => {
        const part = p as Record<string, unknown>;
        return {
          productCode: String(part.productCode),
          name: String(part.name ?? ''),
          quantity: Number(part.quantity),
        };
      }),
    })),
    partLines: (row.partLines ?? []).map((p) => ({
      id: String(p.id),
      productCode: String(p.productCode),
      name: String(p.name),
      quantity: Number(p.quantity),
    })),
    budget: row.budget
      ? {
          items: ((row.budget.items as unknown[]) ?? []).map((i) =>
            mapBudgetItem(i as Parameters<typeof mapBudgetItem>[0]),
          ),
          servicesTotal: Number(row.budget.servicesTotal),
          partsTotal: Number(row.budget.partsTotal),
          total: Number(row.budget.total),
          approved: Boolean(row.budget.approved),
          approvedAt: row.budget.approvedAt
            ? new Date(String(row.budget.approvedAt))
            : undefined,
        }
      : undefined,
    statusHistory: (row.statusHistory ?? []).map((h) => ({
      from: (h.from as ServiceOrderProps['status']) ?? null,
      to: h.to as ServiceOrderProps['status'],
      at: new Date(String(h.at)),
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    deliveredAt: row.deliveredAt,
    cancellationReason: row.cancellationReason,
  };
  return ServiceOrder.restore(props, row.id);
}

export function serviceOrderToEntity(order: ServiceOrder): ServiceOrderEntity {
  return {
    id: order.id,
    status: order.status,
    clientId: order.clientId,
    vehicleId: order.vehicleId,
    clientDocument: order.clientDocument,
    clientName: order.clientName,
    vehiclePlate: order.vehiclePlate,
    vehicleBrand: order.vehicleBrand,
    vehicleModel: order.vehicleModel,
    vehicleYear: order.vehicleYear,
    requestedServicesDescription: order.requestedServicesDescription,
    diagnosis: order.diagnosis,
    serviceLines: order.serviceLines as unknown as Record<string, unknown>[],
    partLines: order.partLines as unknown as Record<string, unknown>[],
    budget: order.budget as unknown as Record<string, unknown> | undefined,
    statusHistory: order.statusHistory as unknown as Record<string, unknown>[],
    startedAt: order.startedAt,
    finishedAt: order.finishedAt,
    deliveredAt: order.deliveredAt,
    cancellationReason: order.cancellationReason,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

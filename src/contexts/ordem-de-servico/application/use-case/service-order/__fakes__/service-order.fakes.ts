import { CatalogService } from '../../../../domain/entities/catalog-service';
import {
  ServiceOrder,
  type Budget,
  type ServiceOrderProps,
} from '../../../../domain/entities/service-order';
import { ServiceOrderStatus } from '../../../../domain/entities/service-order-status';
import type { CatalogServiceRepositoryInterface } from '../../../../domain/repositories/catalog-service.repository';
import type { ServiceOrderRepositoryInterface } from '../../../../domain/repositories/service-order.repository';
import type {
  ClientLookupPort,
  ClientSnapshot,
} from '../../../../domain/ports/client-lookup.port';
import type {
  ClientProvisioningPort,
  ProvisionClientInput,
} from '../../../../domain/ports/client-provisioning.port';
import type {
  BudgetDeliveryNotifier,
  BudgetDeliveryPayload,
} from '../../../../domain/ports/budget-delivery-notifier.port';
import type {
  ProductLookupPort,
  ProductSnapshot,
} from '../../../../domain/ports/product-lookup.port';
import type {
  VehicleLookupPort,
  VehicleSnapshot,
} from '../../../../domain/ports/vehicle-lookup.port';
import type {
  ProvisionVehicleInput,
  VehicleProvisioningPort,
} from '../../../../domain/ports/vehicle-provisioning.port';
import type {
  StockAvailabilityItem,
  StockDemandItem,
  StockQuoteItem,
  StockServicePort,
} from '../../../../../shared/domain/ports/stock-service.port';
import { DocumentVO } from '../../../../../shared/domain/value-objects/document.vo';
import { Money } from '../../../../../shared/domain/value-objects/money.vo';
import { PlateVO } from '../../../../../shared/domain/value-objects/plate.vo';

const EXCLUDED_FROM_LISTING: ServiceOrderStatus[] = [
  ServiceOrderStatus.DELIVERED,
  ServiceOrderStatus.FINISHED,
  ServiceOrderStatus.CANCELLED,
];

export const TEST_CLIENT_ID = 'client-1';
export const TEST_VEHICLE_ID = 'vehicle-1';
export const TEST_DOCUMENT = '87075443089';
export const TEST_PLATE = 'MVO9884';
export const TEST_CATALOG_ID = 'catalog-1';
export const TEST_PRODUCT_CODE = 'OIL001';

export class InMemoryServiceOrderRepository implements ServiceOrderRepositoryInterface {
  private readonly orders = new Map<string, ServiceOrder>();

  create(order: ServiceOrder): Promise<ServiceOrder> {
    this.orders.set(order.id, order);
    return Promise.resolve(order);
  }

  find(): Promise<ServiceOrder[]> {
    return Promise.resolve(
      [...this.orders.values()].filter(
        (order) => !EXCLUDED_FROM_LISTING.includes(order.status),
      ),
    );
  }

  findById(id: string): Promise<ServiceOrder | null> {
    return Promise.resolve(this.orders.get(id) ?? null);
  }

  findOpenByDocument(
    document: string,
    plate?: string,
  ): Promise<ServiceOrder[]> {
    const normalizedDocument = document.replace(/\D/g, '');
    const normalizedPlate = plate?.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    return Promise.resolve(
      [...this.orders.values()].filter((order) => {
        if (order.clientDocument.replace(/\D/g, '') !== normalizedDocument) {
          return false;
        }
        if (normalizedPlate && order.vehiclePlate !== normalizedPlate) {
          return false;
        }
        return !EXCLUDED_FROM_LISTING.includes(order.status);
      }),
    );
  }

  findFinished(): Promise<ServiceOrder[]> {
    return Promise.resolve(
      [...this.orders.values()].filter(
        (order) =>
          order.status === ServiceOrderStatus.FINISHED ||
          order.status === ServiceOrderStatus.DELIVERED,
      ),
    );
  }

  save(order: ServiceOrder): Promise<ServiceOrder | null> {
    if (!this.orders.has(order.id)) {
      return Promise.resolve(null);
    }
    this.orders.set(order.id, order);
    return Promise.resolve(order);
  }

  seed(...orders: ServiceOrder[]): this {
    for (const order of orders) {
      this.orders.set(order.id, order);
    }
    return this;
  }
}

export class InMemoryCatalogServiceRepository implements CatalogServiceRepositoryInterface {
  private readonly catalog = new Map<string, CatalogService>();

  create(data: CatalogService): Promise<CatalogService> {
    this.catalog.set(data.id, data);
    return Promise.resolve(data);
  }

  find(): Promise<CatalogService[]> {
    return Promise.resolve([...this.catalog.values()]);
  }

  findById(id: string): Promise<CatalogService | null> {
    return Promise.resolve(this.catalog.get(id) ?? null);
  }

  updateById(): Promise<CatalogService | null> {
    throw new Error('not used');
  }

  remove(): Promise<void> {
    throw new Error('not used');
  }

  seed(...items: CatalogService[]): this {
    for (const item of items) {
      this.catalog.set(item.id, item);
    }
    return this;
  }
}

export class InMemoryClientLookup implements ClientLookupPort {
  constructor(private readonly clients = new Map<string, ClientSnapshot>()) {}

  findById(id: string): Promise<ClientSnapshot | null> {
    return Promise.resolve(this.clients.get(id) ?? null);
  }

  seed(client: ClientSnapshot): this {
    this.clients.set(client.id, client);
    return this;
  }
}

export class InMemoryVehicleLookup implements VehicleLookupPort {
  constructor(private readonly vehicles = new Map<string, VehicleSnapshot>()) {}

  findById(id: string): Promise<VehicleSnapshot | null> {
    return Promise.resolve(this.vehicles.get(id) ?? null);
  }

  seed(vehicle: VehicleSnapshot): this {
    this.vehicles.set(vehicle.id, vehicle);
    return this;
  }
}

export class InMemoryClientProvisioning implements ClientProvisioningPort {
  private readonly clients = new Map<string, ClientSnapshot>();

  getOrCreate(input: ProvisionClientInput): Promise<ClientSnapshot> {
    const document = input.document.replace(/\D/g, '');
    const existing = [...this.clients.values()].find(
      (client) => client.document.replace(/\D/g, '') === document,
    );
    if (existing) {
      return Promise.resolve(existing);
    }

    const created: ClientSnapshot = {
      id: `client-${this.clients.size + 1}`,
      document: input.document,
      name: input.name,
      email: input.email,
    };
    this.clients.set(created.id, created);
    return Promise.resolve(created);
  }
}

export class InMemoryVehicleProvisioning implements VehicleProvisioningPort {
  private readonly vehicles = new Map<string, VehicleSnapshot>();

  getOrCreate(input: ProvisionVehicleInput): Promise<VehicleSnapshot> {
    const plate = input.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const existing = [...this.vehicles.values()].find(
      (vehicle) => vehicle.plate === plate,
    );
    if (existing) {
      return Promise.resolve(existing);
    }

    const created: VehicleSnapshot = {
      id: `vehicle-${this.vehicles.size + 1}`,
      plate,
      brand: input.brand,
      model: input.model,
      year: input.year,
    };
    this.vehicles.set(created.id, created);
    return Promise.resolve(created);
  }
}

export class InMemoryProductLookup implements ProductLookupPort {
  constructor(private readonly products = new Map<string, ProductSnapshot>()) {}

  findByCode(code: string): Promise<ProductSnapshot> {
    const product = this.products.get(code.toUpperCase());
    if (!product) {
      throw new Error(`Product "${code}" not found`);
    }
    return Promise.resolve(product);
  }

  findByCodeOrNull(code: string): Promise<ProductSnapshot | null> {
    return Promise.resolve(this.products.get(code.toUpperCase()) ?? null);
  }

  seed(product: ProductSnapshot): this {
    this.products.set(product.code.toUpperCase(), {
      ...product,
      code: product.code.toUpperCase(),
    });
    return this;
  }
}

export class SpyBudgetDeliveryNotifier implements BudgetDeliveryNotifier {
  readonly calls: BudgetDeliveryPayload[] = [];

  notifyBudgetReady(payload: BudgetDeliveryPayload): Promise<void> {
    this.calls.push(payload);
    return Promise.resolve();
  }
}

export class InMemoryStockService implements StockServicePort {
  readonly decreased: { productCode: string; quantity: number }[] = [];

  constructor(
    private readonly availability: StockAvailabilityItem[] = [],
    private readonly quotes: StockQuoteItem[] = [],
  ) {}

  getAvailability(demand: StockDemandItem[]): Promise<StockAvailabilityItem[]> {
    const byCode = new Map(
      this.availability.map((item) => [item.productCode, item]),
    );
    return Promise.resolve(
      demand.map((item) => {
        const configured = byCode.get(item.productCode);
        return (
          configured ?? {
            productCode: item.productCode,
            required: item.required,
            available: item.required,
          }
        );
      }),
    );
  }

  quoteFifoCost(demand: StockDemandItem[]): Promise<StockQuoteItem[]> {
    const byCode = new Map(this.quotes.map((item) => [item.productCode, item]));
    return Promise.resolve(
      demand.map((item) => {
        const configured = byCode.get(item.productCode);
        return (
          configured ?? {
            productCode: item.productCode,
            required: item.required,
            totalCost: 0,
            unitPrice: 0,
          }
        );
      }),
    );
  }

  decreaseStock(productCode: string, quantity: number): Promise<void> {
    this.decreased.push({ productCode, quantity });
    return Promise.resolve();
  }
}

export const defaultClientSnapshot = (): ClientSnapshot => ({
  id: TEST_CLIENT_ID,
  document: TEST_DOCUMENT,
  name: 'Maria',
  email: 'maria@example.com',
});

export const defaultVehicleSnapshot = (): VehicleSnapshot => ({
  id: TEST_VEHICLE_ID,
  plate: TEST_PLATE,
  brand: 'Fiat',
  model: 'Uno',
  year: 2015,
});

export const defaultCatalogService = (): CatalogService =>
  CatalogService.create(
    {
      name: 'Troca de óleo',
      description: 'Serviço completo',
      basePrice: 120,
      active: true,
      defaultParts: [{ productCode: TEST_PRODUCT_CODE, quantity: 1 }],
    },
    TEST_CATALOG_ID,
  );

export const defaultProductSnapshot = (): ProductSnapshot => ({
  code: TEST_PRODUCT_CODE,
  name: 'Óleo 5W30',
});

const baseOrderProps = (
  overrides: Partial<ServiceOrderProps> = {},
): ServiceOrderProps => {
  const now = overrides.createdAt ?? new Date('2026-05-01T10:00:00.000Z');
  return {
    status: ServiceOrderStatus.RECEIVED,
    client: {
      id: TEST_CLIENT_ID,
      document: DocumentVO.parse(TEST_DOCUMENT),
      name: 'Maria',
    },
    vehicle: {
      id: TEST_VEHICLE_ID,
      plate: PlateVO.parse(TEST_PLATE),
      brand: 'Fiat',
      model: 'Uno',
      year: 2015,
    },
    serviceLines: [],
    partLines: [],
    statusHistory: [{ from: null, to: ServiceOrderStatus.RECEIVED, at: now }],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

export const restoreOrder = (
  id: string,
  overrides: Partial<ServiceOrderProps> = {},
): ServiceOrder => ServiceOrder.restore(baseOrderProps(overrides), id);

export const createReceivedOrder = (id = 'os-received'): ServiceOrder =>
  ServiceOrder.create(
    {
      client: {
        id: TEST_CLIENT_ID,
        document: TEST_DOCUMENT,
        name: 'Maria',
      },
      vehicle: {
        id: TEST_VEHICLE_ID,
        plate: TEST_PLATE,
        brand: 'Fiat',
        model: 'Uno',
        year: 2015,
      },
      requestedServicesDescription: 'Barulho no motor',
    },
    id,
  );

export const createDiagnosedOrderWithService = (
  id = 'os-diagnosed',
): ServiceOrder => {
  const order = createReceivedOrder(id);
  order.registerDiagnosis('Correia desgastada');
  order.addServiceLine({
    catalogServiceId: TEST_CATALOG_ID,
    name: 'Troca de correia',
    unitPrice: 150,
    quantity: 1,
    defaultParts: [
      {
        productCode: TEST_PRODUCT_CODE,
        name: 'Correia',
        quantity: 1,
      },
    ],
  });
  return order;
};

export const createWaitingApprovalOrder = (id = 'os-waiting'): ServiceOrder => {
  const order = createDiagnosedOrderWithService(id);
  const budget: Budget = {
    items: [
      {
        type: 'SERVICE',
        referenceId: TEST_CATALOG_ID,
        description: 'Troca de correia',
        quantity: 1,
        unitPrice: 150,
        total: 150,
      },
      {
        type: 'PART',
        referenceId: TEST_PRODUCT_CODE,
        description: 'Correia',
        quantity: 1,
        unitPrice: 50,
        total: 50,
      },
    ],
    servicesTotal: 150,
    partsTotal: 50,
    total: 200,
    approved: false,
  };
  order.applyBudget(budget);
  return order;
};

export const createInExecutionOrder = (id = 'os-execution'): ServiceOrder => {
  const order = createWaitingApprovalOrder(id);
  order.approveBudget();
  order.startExecution();
  return order;
};

export const createFinishedOrder = (id = 'os-finished'): ServiceOrder => {
  const order = createInExecutionOrder(id);
  order.finish();
  return order;
};

export const serviceLineStored = () => ({
  id: 'line-1',
  catalogServiceId: TEST_CATALOG_ID,
  name: 'Troca de correia',
  unitPrice: Money.parse(150),
  quantity: 1,
  defaultParts: [
    {
      productCode: TEST_PRODUCT_CODE,
      name: 'Correia',
      quantity: 1,
    },
  ],
});

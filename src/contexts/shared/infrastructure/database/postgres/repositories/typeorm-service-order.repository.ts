import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { ServiceOrder } from '../../../../../ordem-de-servico/domain/entities/service-order';
import { ServiceOrderStatus } from '../../../../../ordem-de-servico/domain/entities/service-order-status';
import { ServiceOrderRepositoryInterface } from '../../../../../ordem-de-servico/domain/repositories/service-order.repository';
import { DocumentVO } from '../../../../domain/value-objects/document.vo';
import { PlateVO } from '../../../../domain/value-objects/plate.vo';
import { ServiceOrderEntity } from '../entities/service-order.entity';
import {
  entityToServiceOrder,
  serviceOrderToEntity,
} from './service-order.mapper';

@Injectable()
export class TypeormServiceOrderRepository implements ServiceOrderRepositoryInterface {
  constructor(
    @InjectRepository(ServiceOrderEntity)
    private readonly repo: Repository<ServiceOrderEntity>,
  ) {}

  async create(order: ServiceOrder): Promise<ServiceOrder> {
    const row = this.repo.create(serviceOrderToEntity(order));
    const saved = await this.repo.save(row);
    return entityToServiceOrder(saved);
  }

  async find(): Promise<ServiceOrder[]> {
    const rows = await this.repo.find({
      where: {
        status: Not(
          In([
            ServiceOrderStatus.DELIVERED,
            ServiceOrderStatus.FINISHED,
            ServiceOrderStatus.CANCELLED,
          ]),
        ),
      },
      order: { createdAt: 'ASC' },
    });
    return rows.map(entityToServiceOrder);
  }

  async findById(id: string): Promise<ServiceOrder | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? entityToServiceOrder(row) : null;
  }

  async findOpenByDocument(
    document: string,
    plate?: string,
  ): Promise<ServiceOrder[]> {
    const docKey = DocumentVO.parse(document).value;
    const qb = this.repo
      .createQueryBuilder('so')
      .where('so.client_document = :docKey', { docKey })
      .andWhere('so.status NOT IN (:...closed)', {
        closed: [ServiceOrderStatus.DELIVERED, ServiceOrderStatus.CANCELLED],
      })
      .orderBy('so.created_at', 'DESC');

    if (plate) {
      qb.andWhere('so.vehicle_plate = :plate', {
        plate: PlateVO.parse(plate).value,
      });
    }

    const rows = await qb.getMany();
    return rows.map(entityToServiceOrder);
  }

  async findFinished(): Promise<ServiceOrder[]> {
    const rows = await this.repo
      .createQueryBuilder('so')
      .where('so.started_at IS NOT NULL')
      .andWhere('so.finished_at IS NOT NULL')
      .getMany();
    return rows.map(entityToServiceOrder);
  }

  async save(order: ServiceOrder): Promise<ServiceOrder | null> {
    const existing = await this.repo.findOne({ where: { id: order.id } });
    if (!existing) return null;
    const merged = this.repo.merge(existing, serviceOrderToEntity(order));
    const saved = await this.repo.save(merged);
    return entityToServiceOrder(saved);
  }
}

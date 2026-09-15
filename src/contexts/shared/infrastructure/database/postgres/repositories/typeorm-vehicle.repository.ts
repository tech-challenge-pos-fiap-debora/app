import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../../../../identidade/domain/entities/vehicle';
import { VehicleRepositoryInterface } from '../../../../../identidade/domain/repositories/vehicle.repository';
import { EntityNotFoundError } from '../../../../domain/errors';
import { PlateVO } from '../../../../domain/value-objects/plate.vo';
import { VehicleEntity } from '../entities/vehicle.entity';

@Injectable()
export class TypeormVehicleRepository implements VehicleRepositoryInterface {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly repo: Repository<VehicleEntity>,
  ) {}

  private toDomain(row: VehicleEntity): Vehicle {
    return Vehicle.create(
      {
        plate: row.plate,
        model: row.model,
        brand: row.brand,
        year: row.year,
      },
      row.id,
    );
  }

  async create(data: Vehicle): Promise<Vehicle> {
    const row = this.repo.create({
      id: data.id,
      plate: data.plate,
      model: data.model,
      brand: data.brand,
      year: data.year,
    });
    const saved = await this.repo.save(row);
    return this.toDomain(saved);
  }

  async find(): Promise<Vehicle[]> {
    const rows = await this.repo.find({ order: { createdAt: 'DESC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<Vehicle | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByPlate(plate: string): Promise<Vehicle> {
    const plateKey = PlateVO.parse(plate).value;
    const row = await this.repo.findOne({ where: { plate: plateKey } });
    if (!row) {
      throw new EntityNotFoundError('Vehicle not found');
    }
    return this.toDomain(row);
  }

  async updateByPlate(
    plate: string,
    dataUpdate: Partial<{ model: string; brand: string; year: number }>,
  ): Promise<Vehicle> {
    const plateKey = PlateVO.parse(plate).value;
    const row = await this.repo.findOne({ where: { plate: plateKey } });
    if (!row) {
      throw new EntityNotFoundError('Vehicle not found');
    }
    Object.assign(row, dataUpdate);
    const saved = await this.repo.save(row);
    return this.toDomain(saved);
  }

  async remove(plate: string): Promise<void> {
    const plateKey = PlateVO.parse(plate).value;
    await this.repo.delete({ plate: plateKey });
  }
}

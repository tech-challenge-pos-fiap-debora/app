import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity('service_order')
export class ServiceOrderEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  status!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId!: string;

  @Column({ name: 'client_document' })
  clientDocument!: string;

  @Column({ name: 'client_name' })
  clientName!: string;

  @Column({ name: 'vehicle_plate' })
  vehiclePlate!: string;

  @Column({ name: 'vehicle_brand' })
  vehicleBrand!: string;

  @Column({ name: 'vehicle_model' })
  vehicleModel!: string;

  @Column({ name: 'vehicle_year', type: 'int' })
  vehicleYear!: number;

  @Column({ name: 'requested_services_description', type: 'text', nullable: true })
  requestedServicesDescription?: string;

  @Column({ type: 'text', nullable: true })
  diagnosis?: string;

  @Column({ name: 'service_lines', type: 'jsonb', default: [] })
  serviceLines!: Record<string, unknown>[];

  @Column({ name: 'part_lines', type: 'jsonb', default: [] })
  partLines!: Record<string, unknown>[];

  @Column({ type: 'jsonb', nullable: true })
  budget?: Record<string, unknown> | null;

  @Column({ name: 'status_history', type: 'jsonb', default: [] })
  statusHistory!: Record<string, unknown>[];

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt?: Date;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

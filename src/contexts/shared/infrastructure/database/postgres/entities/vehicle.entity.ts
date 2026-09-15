import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vehicle')
export class VehicleEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ unique: true })
  plate!: string;

  @Column()
  model!: string;

  @Column()
  brand!: string;

  @Column('int')
  year!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

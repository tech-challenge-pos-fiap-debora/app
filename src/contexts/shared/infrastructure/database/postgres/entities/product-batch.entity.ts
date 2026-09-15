import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('product_batch')
export class ProductBatchEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'product_code' })
  productCode!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  quantity!: number;

  @Column({ name: 'cost_price', type: 'decimal', precision: 12, scale: 2 })
  costPrice!: number;

  @Column({ name: 'sale_price', type: 'decimal', precision: 12, scale: 2 })
  salePrice!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

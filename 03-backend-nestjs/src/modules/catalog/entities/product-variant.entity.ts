import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { decimalTransformer } from '../../../shared/utils/decimal.transformer';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ type: 'citext' })
  sku: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  price: number;

  @Column({ name: 'currency_code', type: 'char', length: 3, default: 'USD' })
  currencyCode: string;

  // Denormalized flattening of this variant's option values, rebuilt
  // whenever variant<->option-value links change (DATABASE.md §4).
  @Column({ name: 'option_summary', type: 'jsonb', default: () => "'{}'" })
  optionSummary: Record<string, string>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Maintained by the set_updated_at() Postgres trigger, not the ORM.
  @Column({
    name: 'updated_at',
    type: 'timestamptz',
    insert: false,
    update: false,
  })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}

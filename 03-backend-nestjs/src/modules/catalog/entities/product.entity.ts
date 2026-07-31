import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { decimalTransformer } from '../../../shared/utils/decimal.transformer';
import { ProductStatus } from '../types/product-status.enum';

@Entity('products')
export class Product {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'brand_id', type: 'uuid', nullable: true })
  brandId: string | null;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'citext' })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enumName: 'product_status',
    default: ProductStatus.Draft,
  })
  status: ProductStatus;

  @Column({
    name: 'base_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  basePrice: number;

  @Column({ name: 'currency_code', type: 'char', length: 3, default: 'USD' })
  currencyCode: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  attributes: Record<string, unknown>;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  tags: string[];

  @Column({ name: 'rating_avg', type: 'real', default: 0 })
  ratingAvg: number;

  @Column({ name: 'rating_count', type: 'integer', default: 0 })
  ratingCount: number;

  @Column({ name: 'total_sold', type: 'integer', default: 0 })
  totalSold: number;

  // Generated column (to_tsvector) — never written by the ORM.
  @Column({
    name: 'search_vector',
    type: 'tsvector',
    select: false,
    insert: false,
    update: false,
  })
  searchVector: string;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

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

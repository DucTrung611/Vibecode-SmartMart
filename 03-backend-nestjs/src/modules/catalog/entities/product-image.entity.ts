import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('product_images')
export class ProductImage {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId: string | null;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'text', nullable: true })
  checksum: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

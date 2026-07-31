import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('product_options')
export class ProductOption {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ type: 'text' })
  name: string;
}

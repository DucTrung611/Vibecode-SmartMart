import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('product_categories')
export class ProductCategory {
  @PrimaryColumn('uuid', { name: 'product_id' })
  productId: string;

  @PrimaryColumn('uuid', { name: 'category_id' })
  categoryId: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;
}

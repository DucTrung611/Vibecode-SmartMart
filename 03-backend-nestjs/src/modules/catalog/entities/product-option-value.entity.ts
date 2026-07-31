import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('product_option_values')
export class ProductOptionValue {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'option_id', type: 'uuid' })
  optionId: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;
}

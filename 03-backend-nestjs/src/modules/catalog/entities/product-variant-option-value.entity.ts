import { Entity, PrimaryColumn } from 'typeorm';

@Entity('product_variant_option_values')
export class ProductVariantOptionValue {
  @PrimaryColumn('uuid', { name: 'variant_id' })
  variantId: string;

  @PrimaryColumn('uuid', { name: 'option_value_id' })
  optionValueId: string;
}

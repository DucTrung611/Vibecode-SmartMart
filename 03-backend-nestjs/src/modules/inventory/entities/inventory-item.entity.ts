import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryColumn({ name: 'variant_id', type: 'uuid' })
  variantId: string;

  @Column({ name: 'quantity_on_hand', type: 'integer', default: 0 })
  quantityOnHand: number;

  @Column({ name: 'quantity_reserved', type: 'integer', default: 0 })
  quantityReserved: number;

  // Generated column (quantity_on_hand - quantity_reserved), DATABASE.md §2.
  @Column({
    name: 'quantity_available',
    type: 'integer',
    select: true,
    insert: false,
    update: false,
  })
  quantityAvailable: number;

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
}

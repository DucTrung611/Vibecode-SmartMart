import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { MovementType } from '../types/movement-type.enum';

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryColumn({
    name: 'id',
    type: 'bigint',
    generated: 'increment',
  })
  id: string;

  @Column({ name: 'variant_id', type: 'uuid' })
  variantId: string;

  @Column({ type: 'text' })
  type: MovementType;

  @Column({ name: 'quantity_delta', type: 'integer' })
  quantityDelta: number;

  @Column({ name: 'reference_type', type: 'text', nullable: true })
  referenceType: string | null;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

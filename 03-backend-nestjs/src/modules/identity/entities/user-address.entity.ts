import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_addresses')
export class UserAddress {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'recipient_name' })
  recipientName: string;

  @Column()
  line1: string;

  @Column()
  city: string;

  @Column({ name: 'country_code', type: 'char', length: 2 })
  countryCode: string;

  @Column({ name: 'is_default_shipping', type: 'boolean', default: false })
  isDefaultShipping: boolean;

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

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { UserStatus } from '../types/user-status.enum';

@Entity('users')
export class User {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'citext' })
  email: string;

  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash: string | null;

  @Column({
    type: 'enum',
    enumName: 'user_status',
    default: UserStatus.Active,
  })
  status: UserStatus;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  preferences: Record<string, unknown>;

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

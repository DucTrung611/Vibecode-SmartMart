import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('brands')
export class Brand {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'citext' })
  slug: string;

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

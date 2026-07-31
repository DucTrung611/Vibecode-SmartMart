import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ unique: true })
  code: string;
}

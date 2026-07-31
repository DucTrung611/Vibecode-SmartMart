import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(Role) private readonly repo: Repository<Role>,
  ) {}

  findByCode(code: string): Promise<Role | null> {
    return this.repo.findOneBy({ code });
  }
}

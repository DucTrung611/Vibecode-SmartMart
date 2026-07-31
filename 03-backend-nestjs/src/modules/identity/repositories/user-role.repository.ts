import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserRole } from '../entities/user-role.entity';

@Injectable()
export class UserRoleRepository {
  constructor(
    @InjectRepository(UserRole)
    private readonly repo: Repository<UserRole>,
  ) {}

  assignRole(
    userId: string,
    roleId: string,
    manager?: EntityManager,
  ): Promise<UserRole> {
    const repo = manager ? manager.getRepository(UserRole) : this.repo;
    return repo.save(repo.create({ userId, roleId }));
  }
}

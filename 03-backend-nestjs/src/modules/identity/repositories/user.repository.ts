import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  // find*/findOneBy already exclude soft-deleted rows via @DeleteDateColumn.
  // Only raw QueryBuilder calls on `users` need an explicit
  // `deletedAt IS NULL` filter — none exist in this repository today.
  findByEmail(email: string, manager?: EntityManager): Promise<User | null> {
    return this.scopedRepo(manager).findOneBy({ email });
  }

  findById(id: string, manager?: EntityManager): Promise<User | null> {
    return this.scopedRepo(manager).findOneBy({ id });
  }

  save(user: User, manager?: EntityManager): Promise<User> {
    return this.scopedRepo(manager).save(user);
  }

  create(data: Partial<User>): User {
    return this.repo.create(data);
  }

  private scopedRepo(manager?: EntityManager): Repository<User> {
    return manager ? manager.getRepository(User) : this.repo;
  }
}

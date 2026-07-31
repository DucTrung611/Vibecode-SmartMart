import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserAddress } from '../entities/user-address.entity';

@Injectable()
export class UserAddressRepository {
  constructor(
    @InjectRepository(UserAddress)
    private readonly repo: Repository<UserAddress>,
  ) {}

  findAllByUser(userId: string): Promise<UserAddress[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  findOne(userId: string, id: string): Promise<UserAddress | null> {
    return this.repo.findOneBy({ userId, id });
  }

  create(data: Partial<UserAddress>): UserAddress {
    return this.repo.create(data);
  }

  save(address: UserAddress, manager?: EntityManager): Promise<UserAddress> {
    return this.scopedRepo(manager).save(address);
  }

  delete(userId: string, id: string): Promise<unknown> {
    return this.repo.delete({ userId, id });
  }

  // Called inside a transaction before writing a new default address —
  // the partial unique index only allows one is_default_shipping=true row
  // per user, so the previous default must be cleared first.
  unsetDefaultForUser(userId: string, manager: EntityManager): Promise<void> {
    return manager
      .getRepository(UserAddress)
      .createQueryBuilder()
      .update(UserAddress)
      .set({ isDefaultShipping: false })
      .where('user_id = :userId', { userId })
      .andWhere('is_default_shipping = true')
      .execute()
      .then(() => undefined);
  }

  private scopedRepo(manager?: EntityManager): Repository<UserAddress> {
    return manager ? manager.getRepository(UserAddress) : this.repo;
  }
}

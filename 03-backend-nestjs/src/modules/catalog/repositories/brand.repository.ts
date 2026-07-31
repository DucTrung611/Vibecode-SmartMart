import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity';

@Injectable()
export class BrandRepository {
  constructor(
    @InjectRepository(Brand) private readonly repo: Repository<Brand>,
  ) {}

  findAll(): Promise<Brand[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findBySlug(slug: string): Promise<Brand | null> {
    return this.repo.findOneBy({ slug });
  }

  findById(id: string): Promise<Brand | null> {
    return this.repo.findOneBy({ id });
  }

  findByIds(ids: string[]): Promise<Brand[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.repo
      .createQueryBuilder('brand')
      .where('brand.id IN (:...ids)', { ids })
      .getMany();
  }
}

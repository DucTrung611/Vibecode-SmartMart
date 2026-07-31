import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category) private readonly repo: Repository<Category>,
  ) {}

  findAllActive(): Promise<Category[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { path: 'ASC' },
    });
  }

  findBySlug(slug: string): Promise<Category | null> {
    return this.repo.findOneBy({ slug });
  }

  findById(id: string): Promise<Category | null> {
    return this.repo.findOneBy({ id });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from '../entities/product-category.entity';

@Injectable()
export class ProductCategoryRepository {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly repo: Repository<ProductCategory>,
  ) {}

  create(data: Partial<ProductCategory>): ProductCategory {
    return this.repo.create(data);
  }

  save(link: ProductCategory): Promise<ProductCategory> {
    return this.repo.save(link);
  }

  findByProductId(productId: string): Promise<ProductCategory[]> {
    return this.repo.findBy({ productId });
  }
}

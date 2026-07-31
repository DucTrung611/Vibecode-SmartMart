import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../entities/product-variant.entity';

@Injectable()
export class ProductVariantRepository {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly repo: Repository<ProductVariant>,
  ) {}

  // option_summary is denormalized onto the variant row (DATABASE.md §4),
  // so listing a product's variants needs no join to the option-value tables.
  findActiveByProductId(productId: string): Promise<ProductVariant[]> {
    return this.repo.find({
      where: { productId, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }
}

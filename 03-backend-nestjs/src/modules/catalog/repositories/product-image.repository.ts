import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '../entities/product-image.entity';

@Injectable()
export class ProductImageRepository {
  constructor(
    @InjectRepository(ProductImage)
    private readonly repo: Repository<ProductImage>,
  ) {}

  findByProductId(productId: string): Promise<ProductImage[]> {
    return this.repo.find({
      where: { productId },
      order: { position: 'ASC' },
    });
  }

  findPrimaryByProductIds(productIds: string[]): Promise<ProductImage[]> {
    if (productIds.length === 0) return Promise.resolve([]);
    return this.repo
      .createQueryBuilder('image')
      .where('image.productId IN (:...productIds)', { productIds })
      .andWhere('image.isPrimary')
      .getMany();
  }

  create(data: Partial<ProductImage>): ProductImage {
    return this.repo.create(data);
  }

  save(image: ProductImage): Promise<ProductImage> {
    return this.repo.save(image);
  }

  async unsetPrimaryForProduct(productId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(ProductImage)
      .set({ isPrimary: false })
      .where('product_id = :productId', { productId })
      .execute();
  }
}

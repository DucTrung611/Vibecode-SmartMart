import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductStatus } from '../types/product-status.enum';
import { PRODUCT_SORT_COLUMNS, ProductListQuery } from '../types/catalog.types';
import { decodeCursor } from '../../../shared/utils/cursor.util';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
  ) {}

  // find*/findOneBy already exclude soft-deleted rows via @DeleteDateColumn;
  // this QueryBuilder needs the explicit deletedAt filter itself
  // (DATABASE.md §4 — the #1 bug source on soft-deletable tables).
  async findList(
    query: ProductListQuery,
  ): Promise<{ items: Product[]; hasMore: boolean }> {
    const column = PRODUCT_SORT_COLUMNS[query.sort.field];
    const dir = query.sort.direction === 'asc' ? 'ASC' : 'DESC';
    const op = query.sort.direction === 'asc' ? '>' : '<';

    const qb = this.repo
      .createQueryBuilder('product')
      .where('product.deletedAt IS NULL')
      .andWhere('product.status = :status', {
        status: ProductStatus.Published,
      });

    if (query.filters.brand) {
      qb.innerJoin(
        'brands',
        'brand',
        'brand.id = product.brandId AND brand.slug = :brandSlug',
        { brandSlug: query.filters.brand },
      );
    }
    if (query.filters.category) {
      qb.innerJoin(
        'product_categories',
        'pc',
        'pc.product_id = product.id',
      ).innerJoin(
        'categories',
        'category',
        'category.id = pc.category_id AND category.slug = :categorySlug',
        { categorySlug: query.filters.category },
      );
    }
    if (query.filters.minPrice !== undefined) {
      qb.andWhere('product.basePrice >= :minPrice', {
        minPrice: query.filters.minPrice,
      });
    }
    if (query.filters.maxPrice !== undefined) {
      qb.andWhere('product.basePrice <= :maxPrice', {
        maxPrice: query.filters.maxPrice,
      });
    }
    if (query.filters.tags && query.filters.tags.length > 0) {
      qb.andWhere('product.tags && :tags', { tags: query.filters.tags });
    }
    if (query.filters.q) {
      qb.andWhere("product.searchVector @@ plainto_tsquery('english', :q)", {
        q: query.filters.q,
      });
    }

    if (query.cursor) {
      const decoded = decodeCursor(query.cursor);
      qb.andWhere(
        `(product.${column} ${op} :cursorValue OR (product.${column} = :cursorValue AND product.id ${op} :cursorId))`,
        { cursorValue: decoded.sortValue, cursorId: decoded.id },
      );
    }

    qb.orderBy(`product.${column}`, dir)
      .addOrderBy('product.id', dir)
      .take(query.limit + 1);

    const rows = await qb.getMany();
    const hasMore = rows.length > query.limit;
    return { items: hasMore ? rows.slice(0, query.limit) : rows, hasMore };
  }

  findBySlug(slug: string): Promise<Product | null> {
    return this.repo.findOneBy({ slug });
  }

  findById(id: string): Promise<Product | null> {
    return this.repo.findOneBy({ id });
  }

  create(data: Partial<Product>): Product {
    return this.repo.create(data);
  }

  save(product: Product): Promise<Product> {
    return this.repo.save(product);
  }
}

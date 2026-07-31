import { randomUUID, createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../../shared/exceptions/app.exception';
import { PaginatedResult } from '../../../shared/types/paginated-result.type';
import { encodeCursor } from '../../../shared/utils/cursor.util';
import { ProductRepository } from '../repositories/product.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { ProductImageRepository } from '../repositories/product-image.repository';
import { ProductCategoryRepository } from '../repositories/product-category.repository';
import { BrandRepository } from '../repositories/brand.repository';
import { Product } from '../entities/product.entity';
import { ProductStatus } from '../types/product-status.enum';
import {
  PRODUCT_SORT_COLUMNS,
  ProductListFilters,
  ProductSortField,
  ProductSortKey,
} from '../types/catalog.types';
import { QueryProductsDto } from '../dto/query-products.dto';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductSummaryDto } from '../dto/product-summary.dto';
import { ProductDetailDto } from '../dto/product-detail.dto';
import { VariantResponseDto } from '../dto/variant-response.dto';
import { ImageResponseDto } from '../dto/image-response.dto';
import { slugify } from '../utils/slug.util';
import {
  toImageResponse,
  toProductDetail,
  toProductSummary,
  toVariantResponse,
} from '../utils/catalog.mapper';

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly productRepository: ProductRepository,
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly productImageRepository: ProductImageRepository,
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly brandRepository: BrandRepository,
  ) {}

  async listProducts(
    query: QueryProductsDto,
  ): Promise<PaginatedResult<ProductSummaryDto>> {
    const sort = this.parseSort(query.sort);
    const limit = query.limit ?? 24;
    const filters: ProductListFilters = {
      category: query.category,
      brand: query.brand,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      tags: query.tags
        ?.split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      q: query.q,
    };

    const { items, hasMore } = await this.productRepository.findList({
      limit,
      cursor: query.cursor,
      sort,
      filters,
    });

    const brandIds = [
      ...new Set(
        items
          .map((product) => product.brandId)
          .filter((id): id is string => !!id),
      ),
    ];
    const brands = await this.brandRepository.findByIds(brandIds);
    const brandNameById = new Map(
      brands.map((brand) => [brand.id, brand.name]),
    );

    const primaryImages =
      await this.productImageRepository.findPrimaryByProductIds(
        items.map((product) => product.id),
      );
    const primaryImageByProduct = new Map(
      primaryImages.map((image) => [image.productId, image.url]),
    );

    const summaries = items.map((product) =>
      toProductSummary(
        product,
        product.brandId ? (brandNameById.get(product.brandId) ?? null) : null,
        primaryImageByProduct.get(product.id) ?? null,
      ),
    );

    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeCursor({
            sortValue: this.sortValueOf(last, sort.field),
            id: last.id,
          })
        : null;

    return {
      items: summaries,
      pagination: { limit, nextCursor, hasMore },
    };
  }

  async getProductBySlug(slug: string): Promise<ProductDetailDto> {
    const product = await this.productRepository.findBySlug(slug);
    if (!product) {
      throw new AppException(
        'CATALOG_PRODUCT_NOT_FOUND',
        `Product ${slug} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toDetail(product);
  }

  async getVariants(productId: string): Promise<VariantResponseDto[]> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new AppException(
        'CATALOG_PRODUCT_NOT_FOUND',
        `Product ${productId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    const variants =
      await this.productVariantRepository.findActiveByProductId(productId);
    return variants.map(toVariantResponse);
  }

  async createProduct(dto: CreateProductDto): Promise<ProductDetailDto> {
    const slug = slugify(dto.slug ?? dto.name);
    const existing = await this.productRepository.findBySlug(slug);
    if (existing) {
      throw new AppException(
        'CATALOG_SLUG_CONFLICT',
        `Slug "${slug}" is already in use`,
        HttpStatus.CONFLICT,
      );
    }

    const status = dto.status ?? ProductStatus.Draft;
    const product = this.productRepository.create({
      name: dto.name,
      slug,
      brandId: dto.brandId ?? null,
      description: dto.description ?? null,
      basePrice: dto.basePrice,
      currencyCode: dto.currencyCode ?? 'USD',
      attributes: dto.attributes ?? {},
      tags: dto.tags ?? [],
      status,
      publishedAt: status === ProductStatus.Published ? new Date() : null,
    });
    const saved = await this.productRepository.save(product);

    if (dto.categoryId) {
      const link = this.productCategoryRepository.create({
        productId: saved.id,
        categoryId: dto.categoryId,
        isPrimary: true,
      });
      await this.productCategoryRepository.save(link);
    }

    return this.toDetail(saved);
  }

  async updateProduct(
    id: string,
    dto: UpdateProductDto,
  ): Promise<ProductDetailDto> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppException(
        'CATALOG_PRODUCT_NOT_FOUND',
        `Product ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.slug !== undefined || dto.name !== undefined) {
      const nextSlug = slugify(dto.slug ?? dto.name ?? product.name);
      if (nextSlug !== product.slug) {
        const existing = await this.productRepository.findBySlug(nextSlug);
        if (existing && existing.id !== id) {
          throw new AppException(
            'CATALOG_SLUG_CONFLICT',
            `Slug "${nextSlug}" is already in use`,
            HttpStatus.CONFLICT,
          );
        }
        product.slug = nextSlug;
      }
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.brandId !== undefined) product.brandId = dto.brandId;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.basePrice !== undefined) product.basePrice = dto.basePrice;
    if (dto.currencyCode !== undefined) product.currencyCode = dto.currencyCode;
    if (dto.attributes !== undefined) product.attributes = dto.attributes;
    if (dto.tags !== undefined) product.tags = dto.tags;
    if (dto.status !== undefined) {
      if (
        dto.status === ProductStatus.Published &&
        product.status !== ProductStatus.Published
      ) {
        product.publishedAt = new Date();
      }
      product.status = dto.status;
    }

    const saved = await this.productRepository.save(product);
    return this.toDetail(saved);
  }

  async uploadImage(
    productId: string,
    file: Express.Multer.File,
  ): Promise<ImageResponseDto> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new AppException(
        'CATALOG_PRODUCT_NOT_FOUND',
        `Product ${productId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const extension = ALLOWED_IMAGE_TYPES[file.mimetype];
    if (!extension) {
      throw new AppException(
        'CATALOG_UNSUPPORTED_IMAGE',
        `Unsupported image type "${file.mimetype}"`,
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }

    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const relativeDir = `${productId}`;
    const filename = `${randomUUID()}.${extension}`;
    const storageDir = this.configService.get<string>(
      'catalog.imageStorageDir',
    ) as string;
    const baseUrl = this.configService.get<string>(
      'catalog.imageBaseUrl',
    ) as string;

    await fs.mkdir(join(storageDir, relativeDir), { recursive: true });
    await fs.writeFile(join(storageDir, relativeDir, filename), file.buffer);

    const existingImages =
      await this.productImageRepository.findByProductId(productId);
    const image = this.productImageRepository.create({
      productId,
      url: `${baseUrl}/${relativeDir}/${filename}`,
      position: existingImages.length,
      isPrimary: existingImages.length === 0,
      checksum,
    });
    const saved = await this.productImageRepository.save(image);
    return toImageResponse(saved);
  }

  private async toDetail(product: Product): Promise<ProductDetailDto> {
    const brand = product.brandId
      ? await this.brandRepository.findById(product.brandId)
      : null;
    const images = await this.productImageRepository.findByProductId(
      product.id,
    );
    return toProductDetail(product, brand?.name ?? null, images);
  }

  private sortValueOf(
    product: Product,
    field: ProductSortField,
  ): string | number {
    switch (field) {
      case 'price':
        return product.basePrice;
      case 'ratingAvg':
        return product.ratingAvg;
      case 'createdAt':
        return product.createdAt.toISOString();
    }
  }

  private parseSort(sort?: string): ProductSortKey {
    if (!sort) return { field: 'createdAt', direction: 'desc' };

    const [first] = sort.split(',');
    const [field, direction] = first.split(':');
    if (!Object.prototype.hasOwnProperty.call(PRODUCT_SORT_COLUMNS, field)) {
      throw new AppException(
        'VALIDATION_INVALID_SORT',
        `Unsupported sort field "${field}"`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return {
      field: field as ProductSortField,
      direction: direction === 'asc' ? 'asc' : 'desc',
    };
  }
}

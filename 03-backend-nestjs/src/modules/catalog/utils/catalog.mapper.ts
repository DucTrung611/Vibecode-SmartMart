import { Brand } from '../entities/brand.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { BrandResponseDto } from '../dto/brand-response.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { ProductSummaryDto } from '../dto/product-summary.dto';
import { ProductDetailDto } from '../dto/product-detail.dto';
import { ImageResponseDto } from '../dto/image-response.dto';
import { VariantResponseDto } from '../dto/variant-response.dto';

export function toBrandResponse(brand: Brand): BrandResponseDto {
  return { id: brand.id, name: brand.name, slug: brand.slug };
}

export function toCategoryResponse(
  category: Category,
  children: CategoryResponseDto[] = [],
): CategoryResponseDto {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parentId,
    isActive: category.isActive,
    children,
  };
}

export function toImageResponse(image: ProductImage): ImageResponseDto {
  return {
    id: image.id,
    url: image.url,
    position: image.position,
    isPrimary: image.isPrimary,
  };
}

export function toVariantResponse(variant: ProductVariant): VariantResponseDto {
  return {
    id: variant.id,
    sku: variant.sku,
    price: variant.price,
    currencyCode: variant.currencyCode,
    optionSummary: variant.optionSummary,
    isActive: variant.isActive,
  };
}

export function toProductSummary(
  product: Product,
  brandName: string | null,
  primaryImageUrl: string | null,
): ProductSummaryDto {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status,
    basePrice: product.basePrice,
    currencyCode: product.currencyCode,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    brandName,
    primaryImageUrl,
  };
}

export function toProductDetail(
  product: Product,
  brandName: string | null,
  images: ProductImage[],
): ProductDetailDto {
  const primary = images.find((image) => image.isPrimary) ?? images[0];
  return {
    ...toProductSummary(product, brandName, primary?.url ?? null),
    description: product.description,
    attributes: product.attributes,
    tags: product.tags,
    images: images.map(toImageResponse),
  };
}

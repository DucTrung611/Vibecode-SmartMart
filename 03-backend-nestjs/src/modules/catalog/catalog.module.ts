import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductOption } from './entities/product-option.entity';
import { ProductOptionValue } from './entities/product-option-value.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductVariantOptionValue } from './entities/product-variant-option-value.entity';
import { ProductImage } from './entities/product-image.entity';
import catalogConfig from './catalog.config';
import { BrandRepository } from './repositories/brand.repository';
import { CategoryRepository } from './repositories/category.repository';
import { ProductRepository } from './repositories/product.repository';
import { ProductCategoryRepository } from './repositories/product-category.repository';
import { ProductVariantRepository } from './repositories/product-variant.repository';
import { ProductImageRepository } from './repositories/product-image.repository';
import { ProductsService } from './services/products.service';
import { CategoriesService } from './services/categories.service';
import { BrandsService } from './services/brands.service';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [
    ConfigModule.forFeature(catalogConfig),
    TypeOrmModule.forFeature([
      Brand,
      Category,
      Product,
      ProductCategory,
      ProductOption,
      ProductOptionValue,
      ProductVariant,
      ProductVariantOptionValue,
      ProductImage,
    ]),
  ],
  controllers: [CatalogController],
  providers: [
    ProductsService,
    CategoriesService,
    BrandsService,
    BrandRepository,
    CategoryRepository,
    ProductRepository,
    ProductCategoryRepository,
    ProductVariantRepository,
    ProductImageRepository,
  ],
  exports: [ProductsService, CategoriesService, BrandsService],
})
export class CatalogModule {}

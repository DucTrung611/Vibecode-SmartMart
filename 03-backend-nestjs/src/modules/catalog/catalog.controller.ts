import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { PaginatedResult } from '../../shared/types/paginated-result.type';
import { ProductsService } from './services/products.service';
import { CategoriesService } from './services/categories.service';
import { BrandsService } from './services/brands.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSummaryDto } from './dto/product-summary.dto';
import { ProductDetailDto } from './dto/product-detail.dto';
import { VariantResponseDto } from './dto/variant-response.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { BrandResponseDto } from './dto/brand-response.dto';
import { ImageResponseDto } from './dto/image-response.dto';

@Controller({ path: 'catalog', version: '1' })
export class CatalogController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly brandsService: BrandsService,
  ) {}

  @Public()
  @Get('products')
  listProducts(
    @Query() query: QueryProductsDto,
  ): Promise<PaginatedResult<ProductSummaryDto>> {
    return this.productsService.listProducts(query);
  }

  @Public()
  @Get('products/:slug')
  getProductBySlug(@Param('slug') slug: string): Promise<ProductDetailDto> {
    return this.productsService.getProductBySlug(slug);
  }

  @Public()
  @Get('products/:id/variants')
  getVariants(@Param('id') id: string): Promise<VariantResponseDto[]> {
    return this.productsService.getVariants(id);
  }

  @Public()
  @Get('categories')
  getCategoryTree(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.getCategoryTree();
  }

  @Public()
  @Get('brands')
  listBrands(): Promise<BrandResponseDto[]> {
    return this.brandsService.listBrands();
  }

  @Roles('admin')
  @Post('products')
  createProduct(@Body() dto: CreateProductDto): Promise<ProductDetailDto> {
    return this.productsService.createProduct(dto);
  }

  @Roles('admin')
  @Patch('products/:id')
  updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductDetailDto> {
    return this.productsService.updateProduct(id, dto);
  }

  @Roles('admin')
  @Post('products/:id/images')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }),
  )
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImageResponseDto> {
    return this.productsService.uploadImage(id, file);
  }
}

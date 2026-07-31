import { ProductsService } from '../services/products.service';
import { ProductRepository } from '../repositories/product.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { ProductImageRepository } from '../repositories/product-image.repository';
import { ProductCategoryRepository } from '../repositories/product-category.repository';
import { BrandRepository } from '../repositories/brand.repository';
import { ProductStatus } from '../types/product-status.enum';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    ...jest.requireActual('fs').promises,
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

function makeProduct(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'p1',
    brandId: 'b1',
    name: 'Trail Runner Pro',
    slug: 'trail-runner-pro',
    description: 'A shoe',
    status: ProductStatus.Published,
    basePrice: 129.98,
    currencyCode: 'USD',
    attributes: {},
    tags: [],
    ratingAvg: 4.5,
    ratingCount: 10,
    totalSold: 5,
    publishedAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as any;
}

describe('ProductsService', () => {
  let service: ProductsService;
  let configService: { get: jest.Mock };
  let productRepository: jest.Mocked<
    Pick<
      ProductRepository,
      'findList' | 'findBySlug' | 'findById' | 'create' | 'save'
    >
  >;
  let productVariantRepository: jest.Mocked<
    Pick<ProductVariantRepository, 'findActiveByProductId'>
  >;
  let productImageRepository: jest.Mocked<
    Pick<
      ProductImageRepository,
      | 'findByProductId'
      | 'findPrimaryByProductIds'
      | 'create'
      | 'save'
      | 'unsetPrimaryForProduct'
    >
  >;
  let productCategoryRepository: jest.Mocked<
    Pick<ProductCategoryRepository, 'create' | 'save' | 'findByProductId'>
  >;
  let brandRepository: jest.Mocked<
    Pick<BrandRepository, 'findAll' | 'findBySlug' | 'findById' | 'findByIds'>
  >;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) =>
        key === 'catalog.imageStorageDir'
          ? 'uploads/products'
          : '/static/products',
      ),
    };
    productRepository = {
      findList: jest.fn(),
      findBySlug: jest.fn(),
      findById: jest.fn(),
      create: jest.fn((data: any) => data),
      save: jest.fn((p: any) => Promise.resolve({ ...p, id: p.id ?? 'p1' })),
    };
    productVariantRepository = { findActiveByProductId: jest.fn() };
    productImageRepository = {
      findByProductId: jest.fn().mockResolvedValue([]),
      findPrimaryByProductIds: jest.fn().mockResolvedValue([]),
      create: jest.fn((data: any) => data),
      save: jest.fn((img: any) => Promise.resolve({ ...img, id: 'img1' })),
      unsetPrimaryForProduct: jest.fn(),
    };
    productCategoryRepository = {
      create: jest.fn((data: any) => data),
      save: jest.fn((link: any) => Promise.resolve(link)),
      findByProductId: jest.fn(),
    };
    brandRepository = {
      findAll: jest.fn(),
      findBySlug: jest.fn(),
      findById: jest
        .fn()
        .mockResolvedValue({ id: 'b1', name: 'Nike', slug: 'nike' }),
      findByIds: jest
        .fn()
        .mockResolvedValue([{ id: 'b1', name: 'Nike', slug: 'nike' }]),
    };

    service = new ProductsService(
      configService as any,
      productRepository as unknown as ProductRepository,
      productVariantRepository as unknown as ProductVariantRepository,
      productImageRepository as unknown as ProductImageRepository,
      productCategoryRepository as unknown as ProductCategoryRepository,
      brandRepository as unknown as BrandRepository,
    );
  });

  describe('listProducts', () => {
    it('rejects an unsupported sort field', async () => {
      await expect(
        service.listProducts({ sort: 'popularity:desc' } as any),
      ).rejects.toMatchObject({ code: 'VALIDATION_INVALID_SORT' });
    });

    it('returns summaries with brand name, primary image, and a next cursor', async () => {
      const product = makeProduct();
      productRepository.findList.mockResolvedValue({
        items: [product],
        hasMore: true,
      });
      productImageRepository.findPrimaryByProductIds.mockResolvedValue([
        { productId: 'p1', url: 'https://img/1.jpg' } as any,
      ]);

      const result = await service.listProducts({ limit: 1 });

      expect(result.items).toEqual([
        expect.objectContaining({
          id: 'p1',
          brandName: 'Nike',
          primaryImageUrl: 'https://img/1.jpg',
        }),
      ]);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).not.toBeNull();
    });

    it('returns a null cursor when there are no more results', async () => {
      productRepository.findList.mockResolvedValue({
        items: [makeProduct()],
        hasMore: false,
      });

      const result = await service.listProducts({});

      expect(result.pagination.nextCursor).toBeNull();
    });
  });

  describe('getProductBySlug', () => {
    it('throws CATALOG_PRODUCT_NOT_FOUND when missing', async () => {
      productRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getProductBySlug('missing')).rejects.toMatchObject({
        code: 'CATALOG_PRODUCT_NOT_FOUND',
      });
    });

    it('returns product detail on the happy path', async () => {
      productRepository.findBySlug.mockResolvedValue(makeProduct());

      const result = await service.getProductBySlug('trail-runner-pro');

      expect(result.slug).toBe('trail-runner-pro');
      expect(result.brandName).toBe('Nike');
    });
  });

  describe('getVariants', () => {
    it('throws CATALOG_PRODUCT_NOT_FOUND when the product does not exist', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.getVariants('missing')).rejects.toMatchObject({
        code: 'CATALOG_PRODUCT_NOT_FOUND',
      });
    });

    it('maps active variants to response DTOs', async () => {
      productRepository.findById.mockResolvedValue(makeProduct());
      productVariantRepository.findActiveByProductId.mockResolvedValue([
        {
          id: 'v1',
          sku: 'SKU-1',
          price: 129.98,
          currencyCode: 'USD',
          optionSummary: { size: '10' },
          isActive: true,
        } as any,
      ]);

      const result = await service.getVariants('p1');

      expect(result).toEqual([
        {
          id: 'v1',
          sku: 'SKU-1',
          price: 129.98,
          currencyCode: 'USD',
          optionSummary: { size: '10' },
          isActive: true,
        },
      ]);
    });
  });

  describe('createProduct', () => {
    it('throws CATALOG_SLUG_CONFLICT when the slug is already in use', async () => {
      productRepository.findBySlug.mockResolvedValue(makeProduct());

      await expect(
        service.createProduct({
          name: 'Trail Runner Pro',
          basePrice: 100,
        } as any),
      ).rejects.toMatchObject({ code: 'CATALOG_SLUG_CONFLICT' });
    });

    it('creates the product and links the primary category', async () => {
      productRepository.findBySlug.mockResolvedValue(null);

      await service.createProduct({
        name: 'New Shoe',
        basePrice: 50,
        categoryId: 'cat-1',
      });

      expect(productCategoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'cat-1', isPrimary: true }),
      );
    });
  });

  describe('updateProduct', () => {
    it('throws CATALOG_PRODUCT_NOT_FOUND when the product does not exist', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateProduct('missing', {} as any),
      ).rejects.toMatchObject({ code: 'CATALOG_PRODUCT_NOT_FOUND' });
    });

    it("throws CATALOG_SLUG_CONFLICT when renaming into another product's slug", async () => {
      productRepository.findById.mockResolvedValue(makeProduct());
      productRepository.findBySlug.mockResolvedValue(
        makeProduct({ id: 'other-product' }),
      );

      await expect(
        service.updateProduct('p1', { slug: 'taken-slug' } as any),
      ).rejects.toMatchObject({ code: 'CATALOG_SLUG_CONFLICT' });
    });

    it('updates provided fields on the happy path', async () => {
      productRepository.findById.mockResolvedValue(makeProduct());

      const result = await service.updateProduct('p1', {
        basePrice: 199.99,
      });

      expect(result.basePrice).toBe(199.99);
    });
  });

  describe('uploadImage', () => {
    it('throws CATALOG_PRODUCT_NOT_FOUND when the product does not exist', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(
        service.uploadImage('missing', {
          mimetype: 'image/png',
          buffer: Buffer.from('x'),
        } as any),
      ).rejects.toMatchObject({ code: 'CATALOG_PRODUCT_NOT_FOUND' });
    });

    it('throws CATALOG_UNSUPPORTED_IMAGE for an unsupported mimetype', async () => {
      productRepository.findById.mockResolvedValue(makeProduct());

      await expect(
        service.uploadImage('p1', {
          mimetype: 'application/pdf',
          buffer: Buffer.from('x'),
        } as any),
      ).rejects.toMatchObject({ code: 'CATALOG_UNSUPPORTED_IMAGE' });
    });

    it('marks the first image for a product as primary', async () => {
      productRepository.findById.mockResolvedValue(makeProduct());
      productImageRepository.findByProductId.mockResolvedValue([]);

      const result = await service.uploadImage('p1', {
        mimetype: 'image/png',
        buffer: Buffer.from('x'),
      } as any);

      expect(productImageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isPrimary: true, position: 0 }),
      );
      expect(result.id).toBe('img1');
    });
  });
});

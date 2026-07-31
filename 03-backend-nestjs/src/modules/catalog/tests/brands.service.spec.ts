import { BrandsService } from '../services/brands.service';
import { BrandRepository } from '../repositories/brand.repository';

describe('BrandsService', () => {
  let service: BrandsService;
  let brandRepository: jest.Mocked<Pick<BrandRepository, 'findAll'>>;

  beforeEach(() => {
    brandRepository = { findAll: jest.fn() };
    service = new BrandsService(brandRepository as unknown as BrandRepository);
  });

  describe('listBrands', () => {
    it('maps brand entities to response DTOs', async () => {
      brandRepository.findAll.mockResolvedValue([
        { id: 'b1', name: 'Nike', slug: 'nike' } as any,
      ]);

      const result = await service.listBrands();

      expect(result).toEqual([{ id: 'b1', name: 'Nike', slug: 'nike' }]);
    });
  });
});

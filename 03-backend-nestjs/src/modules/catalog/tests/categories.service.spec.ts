import { CategoriesService } from '../services/categories.service';
import { CategoryRepository } from '../repositories/category.repository';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository: jest.Mocked<
    Pick<CategoryRepository, 'findAllActive'>
  >;

  beforeEach(() => {
    categoryRepository = { findAllActive: jest.fn() };
    service = new CategoriesService(
      categoryRepository as unknown as CategoryRepository,
    );
  });

  describe('getCategoryTree', () => {
    it('nests children under their parent', async () => {
      categoryRepository.findAllActive.mockResolvedValue([
        {
          id: 'root',
          parentId: null,
          name: 'Shoes',
          slug: 'shoes',
          isActive: true,
        } as any,
        {
          id: 'child',
          parentId: 'root',
          name: 'Running',
          slug: 'running',
          isActive: true,
        } as any,
      ]);

      const result = await service.getCategoryTree();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('root');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('child');
      expect(result[0].children[0].children).toEqual([]);
    });

    it('returns an empty list when there are no categories', async () => {
      categoryRepository.findAllActive.mockResolvedValue([]);

      const result = await service.getCategoryTree();

      expect(result).toEqual([]);
    });
  });
});

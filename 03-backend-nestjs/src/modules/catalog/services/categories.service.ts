import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';
import { Category } from '../entities/category.entity';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { toCategoryResponse } from '../utils/catalog.mapper';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async getCategoryTree(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.findAllActive();
    return this.buildTree(categories, null);
  }

  private buildTree(
    categories: Category[],
    parentId: string | null,
  ): CategoryResponseDto[] {
    return categories
      .filter((category) => category.parentId === parentId)
      .map((category) =>
        toCategoryResponse(category, this.buildTree(categories, category.id)),
      );
  }
}

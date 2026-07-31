export class CategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  children: CategoryResponseDto[];
}

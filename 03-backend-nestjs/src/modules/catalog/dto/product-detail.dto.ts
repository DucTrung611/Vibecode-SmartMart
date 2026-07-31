import { ProductSummaryDto } from './product-summary.dto';
import { ImageResponseDto } from './image-response.dto';

export class ProductDetailDto extends ProductSummaryDto {
  description: string | null;
  attributes: Record<string, unknown>;
  tags: string[];
  images: ImageResponseDto[];
}

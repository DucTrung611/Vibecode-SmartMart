import { ProductStatus } from '../types/product-status.enum';

export class ProductSummaryDto {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  basePrice: number;
  currencyCode: string;
  ratingAvg: number;
  ratingCount: number;
  brandName: string | null;
  primaryImageUrl: string | null;
}

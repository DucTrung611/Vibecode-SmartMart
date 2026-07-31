import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryProductsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 24;

  @IsOptional()
  @IsString()
  cursor?: string;

  // e.g. "ratingAvg:desc,price:asc" — validated against the sortable
  // column allow-list in ProductsService (API_SPEC.md §3).
  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  // comma-separated, e.g. "summer,sale"
  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  q?: string;
}

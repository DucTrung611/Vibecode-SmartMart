export class VariantResponseDto {
  id: string;
  sku: string;
  price: number;
  currencyCode: string;
  optionSummary: Record<string, string>;
  isActive: boolean;
}

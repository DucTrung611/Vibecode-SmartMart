import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryResponseDto } from '../dto/inventory-response.dto';

export function toInventoryResponse(item: InventoryItem): InventoryResponseDto {
  return {
    variantId: item.variantId,
    quantityOnHand: item.quantityOnHand,
    quantityReserved: item.quantityReserved,
    quantityAvailable: item.quantityAvailable,
    updatedAt: item.updatedAt,
  };
}

import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppException } from '../../../shared/exceptions/app.exception';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryItemRepository } from '../repositories/inventory-item.repository';
import { InventoryMovementRepository } from '../repositories/inventory-movement.repository';
import { AdjustInventoryDto } from '../dto/adjust-inventory.dto';
import { InventoryResponseDto } from '../dto/inventory-response.dto';
import { toInventoryResponse } from '../utils/inventory.mapper';

@Injectable()
export class InventoryService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly inventoryItemRepository: InventoryItemRepository,
    private readonly inventoryMovementRepository: InventoryMovementRepository,
  ) {}

  async getStock(variantId: string): Promise<InventoryResponseDto> {
    const item = await this.inventoryItemRepository.findByVariantId(variantId);
    if (!item) {
      throw this.notFound(variantId);
    }
    return toInventoryResponse(item);
  }

  // SELECT ... FOR UPDATE -> validate -> update -> insert movement, all in
  // one QueryRunner transaction (DATABASE.md §6 checkout pattern).
  async adjustStock(
    variantId: string,
    dto: AdjustInventoryDto,
  ): Promise<InventoryResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const item = await this.inventoryItemRepository.findByVariantIdForUpdate(
        variantId,
        manager,
      );
      if (!item) {
        throw this.notFound(variantId);
      }

      const nextQuantityOnHand = item.quantityOnHand + dto.quantityDelta;
      if (nextQuantityOnHand < 0) {
        throw new AppException(
          'INVENTORY_INSUFFICIENT_STOCK',
          `Adjustment would bring quantity_on_hand below zero for variant ${variantId}`,
          HttpStatus.CONFLICT,
          { variantId },
        );
      }

      item.quantityOnHand = nextQuantityOnHand;
      await this.inventoryItemRepository.save(item, manager);

      const movement = this.inventoryMovementRepository.create({
        variantId,
        type: dto.type,
        quantityDelta: dto.quantityDelta,
        referenceType: dto.referenceType ?? null,
        referenceId: dto.referenceId ?? null,
      });
      await this.inventoryMovementRepository.save(movement, manager);

      // Re-read: quantity_available/updated_at are DB-generated/trigger
      // columns that `save()` doesn't refresh on the in-memory entity.
      const fresh = await this.inventoryItemRepository.findByVariantIdFresh(
        variantId,
        manager,
      );
      return toInventoryResponse(fresh as InventoryItem);
    });
  }

  private notFound(variantId: string): AppException {
    return new AppException(
      'INVENTORY_ITEM_NOT_FOUND',
      `No inventory record for variant ${variantId}`,
      HttpStatus.NOT_FOUND,
    );
  }
}

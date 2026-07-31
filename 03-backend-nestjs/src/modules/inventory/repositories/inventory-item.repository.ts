import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { InventoryItem } from '../entities/inventory-item.entity';

@Injectable()
export class InventoryItemRepository {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly repo: Repository<InventoryItem>,
  ) {}

  findByVariantId(variantId: string): Promise<InventoryItem | null> {
    return this.repo.findOneBy({ variantId });
  }

  // Locks the row so two concurrent adjustments can't both read the same
  // quantity_on_hand and both decide a negative delta is safe.
  findByVariantIdForUpdate(
    variantId: string,
    manager: EntityManager,
  ): Promise<InventoryItem | null> {
    return manager
      .getRepository(InventoryItem)
      .createQueryBuilder('item')
      .setLock('pessimistic_write')
      .where('item.variantId = :variantId', { variantId })
      .getOne();
  }

  save(item: InventoryItem, manager?: EntityManager): Promise<InventoryItem> {
    return this.scopedRepo(manager).save(item);
  }

  // quantity_available is DB-generated (STORED); save() doesn't return the
  // trigger/generated-column values, so callers that need a fresh
  // quantity_available after an update must re-read the row.
  findByVariantIdFresh(
    variantId: string,
    manager: EntityManager,
  ): Promise<InventoryItem | null> {
    return manager.getRepository(InventoryItem).findOneBy({ variantId });
  }

  private scopedRepo(manager?: EntityManager): Repository<InventoryItem> {
    return manager ? manager.getRepository(InventoryItem) : this.repo;
  }
}

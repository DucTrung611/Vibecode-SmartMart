import { InventoryService } from '../services/inventory.service';
import { InventoryItemRepository } from '../repositories/inventory-item.repository';
import { InventoryMovementRepository } from '../repositories/inventory-movement.repository';
import { MovementType } from '../types/movement-type.enum';

function makeItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    variantId: 'v1',
    quantityOnHand: 10,
    quantityReserved: 2,
    quantityAvailable: 8,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as any;
}

describe('InventoryService', () => {
  let service: InventoryService;
  let dataSource: { transaction: jest.Mock };
  let inventoryItemRepository: jest.Mocked<
    Pick<
      InventoryItemRepository,
      | 'findByVariantId'
      | 'findByVariantIdForUpdate'
      | 'save'
      | 'findByVariantIdFresh'
    >
  >;
  let inventoryMovementRepository: jest.Mocked<
    Pick<InventoryMovementRepository, 'create' | 'save'>
  >;

  beforeEach(() => {
    dataSource = { transaction: jest.fn((cb: any) => cb({})) };
    inventoryItemRepository = {
      findByVariantId: jest.fn(),
      findByVariantIdForUpdate: jest.fn(),
      save: jest.fn((item: any) => Promise.resolve(item)),
      findByVariantIdFresh: jest.fn(),
    };
    inventoryMovementRepository = {
      create: jest.fn((data) => data as any),
      save: jest.fn((movement: any) => Promise.resolve(movement)),
    };

    service = new InventoryService(
      dataSource as any,
      inventoryItemRepository as unknown as InventoryItemRepository,
      inventoryMovementRepository as unknown as InventoryMovementRepository,
    );
  });

  describe('getStock', () => {
    it('throws INVENTORY_ITEM_NOT_FOUND when no row exists for the variant', async () => {
      inventoryItemRepository.findByVariantId.mockResolvedValue(null);

      await expect(service.getStock('missing')).rejects.toMatchObject({
        code: 'INVENTORY_ITEM_NOT_FOUND',
      });
    });

    it('returns mapped stock levels when found', async () => {
      inventoryItemRepository.findByVariantId.mockResolvedValue(makeItem());

      await expect(service.getStock('v1')).resolves.toEqual({
        variantId: 'v1',
        quantityOnHand: 10,
        quantityReserved: 2,
        quantityAvailable: 8,
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });
    });
  });

  describe('adjustStock', () => {
    it('throws INVENTORY_ITEM_NOT_FOUND when no row exists for the variant', async () => {
      inventoryItemRepository.findByVariantIdForUpdate.mockResolvedValue(null);

      await expect(
        service.adjustStock('missing', {
          quantityDelta: 5,
          type: MovementType.Restock,
        }),
      ).rejects.toMatchObject({ code: 'INVENTORY_ITEM_NOT_FOUND' });
    });

    it('throws INVENTORY_INSUFFICIENT_STOCK when the delta would go negative', async () => {
      inventoryItemRepository.findByVariantIdForUpdate.mockResolvedValue(
        makeItem({ quantityOnHand: 3 }),
      );

      await expect(
        service.adjustStock('v1', {
          quantityDelta: -5,
          type: MovementType.Damage,
        }),
      ).rejects.toMatchObject({
        code: 'INVENTORY_INSUFFICIENT_STOCK',
        details: { variantId: 'v1' },
      });
      expect(inventoryItemRepository.save).not.toHaveBeenCalled();
    });

    it('applies the delta, logs a movement, and returns the fresh row', async () => {
      inventoryItemRepository.findByVariantIdForUpdate.mockResolvedValue(
        makeItem({ quantityOnHand: 10 }),
      );
      inventoryItemRepository.findByVariantIdFresh.mockResolvedValue(
        makeItem({
          quantityOnHand: 15,
          quantityAvailable: 13,
          updatedAt: new Date('2026-02-01T00:00:00Z'),
        }),
      );

      const result = await service.adjustStock('v1', {
        quantityDelta: 5,
        type: MovementType.Restock,
      });

      expect(inventoryItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantityOnHand: 15 }),
        {},
      );
      expect(inventoryMovementRepository.create).toHaveBeenCalledWith({
        variantId: 'v1',
        type: MovementType.Restock,
        quantityDelta: 5,
        referenceType: null,
        referenceId: null,
      });
      expect(result).toEqual({
        variantId: 'v1',
        quantityOnHand: 15,
        quantityReserved: 2,
        quantityAvailable: 13,
        updatedAt: new Date('2026-02-01T00:00:00Z'),
      });
    });
  });
});

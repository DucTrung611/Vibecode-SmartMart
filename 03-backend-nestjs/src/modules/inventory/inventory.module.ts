import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { InventoryItemRepository } from './repositories/inventory-item.repository';
import { InventoryMovementRepository } from './repositories/inventory-movement.repository';
import { InventoryService } from './services/inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, InventoryMovement])],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    InventoryItemRepository,
    InventoryMovementRepository,
  ],
  exports: [InventoryService],
})
export class InventoryModule {}

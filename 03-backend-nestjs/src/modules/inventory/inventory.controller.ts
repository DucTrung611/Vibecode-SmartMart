import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { InventoryService } from './services/inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { InventoryResponseDto } from './dto/inventory-response.dto';

@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Public()
  @Get('variants/:variantId')
  getStock(
    @Param('variantId') variantId: string,
  ): Promise<InventoryResponseDto> {
    return this.inventoryService.getStock(variantId);
  }

  @Roles('admin')
  @Patch('variants/:variantId/adjust')
  adjustStock(
    @Param('variantId') variantId: string,
    @Body() dto: AdjustInventoryDto,
  ): Promise<InventoryResponseDto> {
    return this.inventoryService.adjustStock(variantId, dto);
  }
}

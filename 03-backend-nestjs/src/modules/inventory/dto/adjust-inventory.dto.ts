import { IsIn, IsInt, IsOptional, IsUUID, NotEquals } from 'class-validator';
import { MovementType } from '../types/movement-type.enum';

export class AdjustInventoryDto {
  @IsInt()
  @NotEquals(0)
  quantityDelta: number;

  @IsIn(Object.values(MovementType))
  type: MovementType;

  @IsOptional()
  referenceType?: string;

  @IsOptional()
  @IsUUID()
  referenceId?: string;
}

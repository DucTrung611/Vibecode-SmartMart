import { IsObject, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}

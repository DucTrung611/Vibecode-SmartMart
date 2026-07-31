import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  recipientName: string;

  @IsString()
  line1: string;

  @IsString()
  city: string;

  @IsString()
  @Length(2, 2)
  countryCode: string;

  @IsOptional()
  @IsBoolean()
  isDefaultShipping?: boolean;
}

import { User } from '../entities/user.entity';
import { UserAddress } from '../entities/user-address.entity';
import { UserResponseDto } from '../dto/user-response.dto';
import { AddressResponseDto } from '../dto/address-response.dto';

export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    preferences: user.preferences,
    createdAt: user.createdAt,
  };
}

export function toAddressResponse(address: UserAddress): AddressResponseDto {
  return {
    id: address.id,
    recipientName: address.recipientName,
    line1: address.line1,
    city: address.city,
    countryCode: address.countryCode,
    isDefaultShipping: address.isDefaultShipping,
  };
}

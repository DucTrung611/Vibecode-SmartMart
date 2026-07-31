import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppException } from '../../../shared/exceptions/app.exception';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { AddressResponseDto } from '../dto/address-response.dto';
import { UserRepository } from '../repositories/user.repository';
import { UserAddressRepository } from '../repositories/user-address.repository';
import { toAddressResponse, toUserResponse } from '../utils/identity.mapper';

@Injectable()
export class UsersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly userAddressRepository: UserAddressRepository,
  ) {}

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppException(
        'IDENTITY_USER_NOT_FOUND',
        `User ${userId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return toUserResponse(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppException(
        'IDENTITY_USER_NOT_FOUND',
        `User ${userId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (dto.preferences !== undefined) {
      user.preferences = dto.preferences;
    }
    const saved = await this.userRepository.save(user);
    return toUserResponse(saved);
  }

  async listAddresses(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.userAddressRepository.findAllByUser(userId);
    return addresses.map(toAddressResponse);
  }

  async createAddress(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      if (dto.isDefaultShipping) {
        await this.userAddressRepository.unsetDefaultForUser(userId, manager);
      }
      const address = this.userAddressRepository.create({
        userId,
        recipientName: dto.recipientName,
        line1: dto.line1,
        city: dto.city,
        countryCode: dto.countryCode,
        isDefaultShipping: dto.isDefaultShipping ?? false,
      });
      const saved = await this.userAddressRepository.save(address, manager);
      return toAddressResponse(saved);
    });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const address = await this.userAddressRepository.findOne(
        userId,
        addressId,
      );
      if (!address) {
        throw new AppException(
          'IDENTITY_ADDRESS_NOT_FOUND',
          `Address ${addressId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      if (dto.isDefaultShipping) {
        await this.userAddressRepository.unsetDefaultForUser(userId, manager);
      }

      Object.assign(address, dto);
      const saved = await this.userAddressRepository.save(address, manager);
      return toAddressResponse(saved);
    });
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.userAddressRepository.findOne(userId, addressId);
    if (!address) {
      throw new AppException(
        'IDENTITY_ADDRESS_NOT_FOUND',
        `Address ${addressId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    // No auto-promotion of another address to default — out of scope.
    await this.userAddressRepository.delete(userId, addressId);
  }
}

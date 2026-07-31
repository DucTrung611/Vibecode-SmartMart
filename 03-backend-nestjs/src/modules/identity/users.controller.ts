import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../shared/types/current-user.type';
import { UsersService } from './services/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AddressResponseDto } from './dto/address-response.dto';

@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserResponseDto> {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('me/addresses')
  listAddresses(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AddressResponseDto[]> {
    return this.usersService.listAddresses(user.id);
  }

  @Post('me/addresses')
  createAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.usersService.createAddress(user.id, dto);
  }

  @Patch('me/addresses/:id')
  updateAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.usersService.updateAddress(user.id, id, dto);
  }

  @Delete('me/addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.usersService.deleteAddress(user.id, id);
  }
}

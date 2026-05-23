import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  CreateAddressDto,
  UpdateAddressDto,
  UpdateNotificationPrefsDto,
  UpdateProfileDto,
} from './dto/user.dto';

@ApiTags('users')
@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.users.getProfile(user.sub);
  }

  @Patch()
  updateProfile(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.sub, dto);
  }

  // Addresses
  @Get('addresses')
  listAddresses(@CurrentUser() user: CurrentUserPayload) {
    return this.users.listAddresses(user.sub);
  }

  @Post('addresses')
  createAddress(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateAddressDto) {
    return this.users.createAddress(user.sub, dto);
  }

  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.users.updateAddress(user.sub, id, dto);
  }

  @Delete('addresses/:id')
  deleteAddress(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.users.deleteAddress(user.sub, id);
  }

  // Notification prefs
  @Patch('notification-preferences')
  updateNotificationPrefs(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateNotificationPrefsDto,
  ) {
    return this.users.updateNotificationPrefs(user.sub, dto);
  }
}

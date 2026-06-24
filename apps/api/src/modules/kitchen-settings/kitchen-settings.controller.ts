import { Body, Controller, Get, Header, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsNumber, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { KitchenSettingsService } from './kitchen-settings.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

class UpdateKitchenSettingsDto {
  @IsOptional() @IsBoolean() isOpen?: boolean;
  @IsOptional() @IsString() openingHours?: string;
  @IsOptional() @IsString() openingHoursTe?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() supportWhatsapp?: string;
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsString() instagramUrl?: string;
  @IsOptional() @IsNumber() minOrderValue?: number;
  @IsOptional() @IsNumber() deliveryFee?: number;
  @IsOptional() @IsInt() estimatedPrepMinutes?: number;
  @IsOptional() @IsString() closedMessage?: string;
}

@ApiTags('kitchen-settings')
@Controller('kitchen-settings')
export class KitchenSettingsController {
  constructor(private readonly settings: KitchenSettingsService) {}

  // Short cache only — this carries the live open/closed status, so it must
  // stay fresh while still sparing the API a hit on every page load.
  @Public()
  @Header('Cache-Control', 'public, max-age=15, s-maxage=20, stale-while-revalidate=60')
  @Get('public')
  getPublic() {
    return this.settings.getPublic();
  }
}

@ApiTags('admin/kitchen-settings')
@Controller('admin/kitchen-settings')
@Roles(Role.OWNER, Role.MANAGER)
export class AdminKitchenSettingsController {
  constructor(private readonly settings: KitchenSettingsService) {}

  @Get()
  get() {
    return this.settings.getFull();
  }

  @Patch()
  @Audit({ action: 'UPDATE', entityType: 'KitchenSettings' })
  update(@Body() dto: UpdateKitchenSettingsDto) {
    return this.settings.update(dto);
  }
}

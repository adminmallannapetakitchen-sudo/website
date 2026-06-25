import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/permissions';
import { Audit } from '../../common/decorators/audit.decorator';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupons.dto';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  // Advertised offers the customer can browse + tap to apply.
  @Public()
  @Header('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=300')
  @Get('public')
  listPublic() {
    return this.coupons.listPublic();
  }

  @Post('validate')
  validate(@CurrentUser() user: CurrentUserPayload, @Body() dto: ValidateCouponDto) {
    return this.coupons.validate(user.sub, dto.code, dto.subtotal);
  }
}

@ApiTags('admin/coupons')
@Controller('admin/coupons')
@RequirePermissions(PERMISSIONS.COUPONS_MANAGE)
export class AdminCouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get()
  list(@Query('active') active?: string) {
    return this.coupons.list({
      active: active === 'true' ? true : active === 'false' ? false : undefined,
    });
  }

  @Post()
  @Audit({ action: 'CREATE', entityType: 'Coupon' })
  create(@Body() dto: CreateCouponDto) {
    return this.coupons.create(dto);
  }

  @Patch(':id')
  @Audit({ action: 'UPDATE', entityType: 'Coupon', entityIdParam: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.coupons.update(id, dto);
  }

  @Delete(':id')
  @Audit({ action: 'DELETE', entityType: 'Coupon', entityIdParam: 'id' })
  delete(@Param('id') id: string) {
    return this.coupons.softDelete(id);
  }
}

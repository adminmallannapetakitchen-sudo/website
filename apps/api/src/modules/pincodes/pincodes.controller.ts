import { Body, Controller, Delete, Get, Header, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { PincodesService } from './pincodes.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/permissions';
import { Audit } from '../../common/decorators/audit.decorator';

class CreatePincodeDto {
  @IsString() @Matches(/^\d{6}$/, { message: 'Invalid pincode' }) pincode!: string;
  @IsOptional() @IsString() areaName?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdatePincodeDto {
  @IsOptional() @IsString() areaName?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiTags('pincodes')
@Controller('pincodes')
export class PincodesController {
  constructor(private readonly pincodes: PincodesService) {}

  @Public()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  @Get(':pincode/check')
  check(@Param('pincode') pincode: string) {
    return this.pincodes.check(pincode);
  }
}

@ApiTags('admin/pincodes')
@Controller('admin/pincodes')
@RequirePermissions(PERMISSIONS.PINCODES_MANAGE)
export class AdminPincodesController {
  constructor(private readonly pincodes: PincodesService) {}

  @Get()
  list() {
    return this.pincodes.list();
  }

  @Post()
  @Audit({ action: 'CREATE', entityType: 'ServiceablePincode' })
  create(@Body() dto: CreatePincodeDto) {
    return this.pincodes.create(dto);
  }

  @Patch(':id')
  @Audit({ action: 'UPDATE', entityType: 'ServiceablePincode', entityIdParam: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdatePincodeDto) {
    return this.pincodes.update(id, dto);
  }

  @Delete(':id')
  @Audit({ action: 'DELETE', entityType: 'ServiceablePincode', entityIdParam: 'id' })
  delete(@Param('id') id: string) {
    return this.pincodes.softDelete(id);
  }
}

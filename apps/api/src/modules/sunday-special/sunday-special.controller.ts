import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Role } from '@prisma/client';
import { SundaySpecialService } from './sunday-special.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

class CreateSundaySpecialDto {
  @IsString() menuItemId!: string;
  @Type(() => Date) @IsDate() weekStarting!: Date;
  @IsNumber() @Min(0) specialPrice!: number;
  @IsOptional() @IsString() bannerPhotoUrl?: string;
  @IsOptional() @IsString() bannerHeadline?: string;
  @IsOptional() @IsString() bannerHeadlineTe?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() descriptionTe?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdateSundaySpecialDto extends CreateSundaySpecialDto {}

@ApiTags('sunday-special')
@Controller('sunday-special')
export class SundaySpecialController {
  constructor(private readonly service: SundaySpecialService) {}

  @Public()
  @Get('current')
  getCurrent() {
    return this.service.getCurrent();
  }
}

@ApiTags('admin/sunday-specials')
@Controller('admin/sunday-specials')
@Roles(Role.OWNER, Role.MANAGER)
export class AdminSundaySpecialController {
  constructor(private readonly service: SundaySpecialService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  @Audit({ action: 'CREATE', entityType: 'SundaySpecial' })
  create(@Body() dto: CreateSundaySpecialDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Audit({ action: 'UPDATE', entityType: 'SundaySpecial', entityIdParam: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateSundaySpecialDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Audit({ action: 'DELETE', entityType: 'SundaySpecial', entityIdParam: 'id' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}

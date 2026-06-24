import { Body, Controller, Delete, Get, Header, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Role } from '@prisma/client';
import { SundaySpecialService } from './sunday-special.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

class SundaySpecialVariantDto {
  @IsOptional() @IsString() id?: string;
  @IsString() @MinLength(1) label!: string;
  @IsOptional() @IsString() labelTe?: string;
  @IsNumber() @Min(0) price!: number;
}

class CreateSundaySpecialDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() nameTe?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() descriptionTe?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @Type(() => Date) @IsDate() weekStarting!: Date;
  @IsOptional() @IsString() bannerHeadline?: string;
  @IsOptional() @IsString() bannerHeadlineTe?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() availableAnyDay?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SundaySpecialVariantDto)
  variants!: SundaySpecialVariantDto[];
}

class UpdateSundaySpecialDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() nameTe?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() descriptionTe?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @Type(() => Date) @IsDate() weekStarting?: Date;
  @IsOptional() @IsString() bannerHeadline?: string;
  @IsOptional() @IsString() bannerHeadlineTe?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() availableAnyDay?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SundaySpecialVariantDto)
  variants?: SundaySpecialVariantDto[];
}

@ApiTags('sunday-special')
@Controller('sunday-special')
export class SundaySpecialController {
  constructor(private readonly service: SundaySpecialService) {}

  @Public()
  @Header('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=300')
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

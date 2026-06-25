import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { StaffRolesService } from './staff-roles.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/permissions';
import { Audit } from '../../common/decorators/audit.decorator';

class CreateRoleDto {
  @IsString() @MinLength(1) @MaxLength(40) name!: string;
  @IsArray() @ArrayUnique() @IsString({ each: true }) permissions!: string[];
}

class UpdateRoleDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(40) name?: string;
  @IsOptional() @IsArray() @ArrayUnique() @IsString({ each: true }) permissions?: string[];
}

@ApiTags('admin/roles')
@Controller('admin/roles')
@RequirePermissions(PERMISSIONS.STAFF_MANAGE)
export class StaffRolesController {
  constructor(private readonly roles: StaffRolesService) {}

  @Get('catalog')
  catalog() {
    return this.roles.catalog();
  }

  @Get()
  list() {
    return this.roles.list();
  }

  @Post()
  @Audit({ action: 'CREATE', entityType: 'StaffRole' })
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto.name, dto.permissions);
  }

  @Patch(':id')
  @Audit({ action: 'UPDATE', entityType: 'StaffRole', entityIdParam: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(id, dto);
  }

  @Delete(':id')
  @Audit({ action: 'DELETE', entityType: 'StaffRole', entityIdParam: 'id' })
  remove(@Param('id') id: string) {
    return this.roles.remove(id);
  }
}

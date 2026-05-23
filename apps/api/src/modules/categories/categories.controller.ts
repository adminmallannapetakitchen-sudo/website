import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get()
  listPublic() {
    return this.categories.listPublic();
  }
}

@ApiTags('admin/categories')
@Controller('admin/categories')
@Roles(Role.OWNER, Role.MANAGER)
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.listAdmin();
  }

  @Post()
  @Audit({ action: 'CREATE', entityType: 'Category' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(':id')
  @Audit({ action: 'UPDATE', entityType: 'Category', entityIdParam: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete(':id')
  @Audit({ action: 'DELETE', entityType: 'Category', entityIdParam: 'id' })
  delete(@Param('id') id: string) {
    return this.categories.softDelete(id);
  }
}

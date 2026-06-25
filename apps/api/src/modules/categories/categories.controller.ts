import { Body, Controller, Delete, Get, Header, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/permissions';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  @Get()
  listPublic() {
    return this.categories.listPublic();
  }
}

@ApiTags('admin/categories')
@Controller('admin/categories')
@RequirePermissions(PERMISSIONS.MENU_MANAGE)
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

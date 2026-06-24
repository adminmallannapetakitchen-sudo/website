import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MenuService } from './menu.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { CreateMenuItemDto, ToggleAvailabilityDto, UpdateMenuItemDto } from './dto/menu.dto';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  // Public menu is fine to be a minute or two stale; cache it so repeat loads
  // and CDNs don't keep hammering the API (the biggest perceived-speed win).
  @Public()
  @Header('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=300')
  @Get('items')
  listPublic(@Query('search') search?: string, @Query('categoryId') categoryId?: string) {
    return this.menu.listPublic({ search, categoryId });
  }

  @Public()
  @Header('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=300')
  @Get('items/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.menu.getBySlug(slug);
  }
}

@ApiTags('admin/menu')
@Controller('admin/menu')
@Roles(Role.OWNER, Role.MANAGER)
export class AdminMenuController {
  constructor(private readonly menu: MenuService) {}

  @Get('items')
  list(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.menu.listAdmin({
      search,
      categoryId,
      includeDeleted: includeDeleted === 'true',
    });
  }

  @Post('items')
  @Audit({ action: 'CREATE', entityType: 'MenuItem' })
  create(@Body() dto: CreateMenuItemDto) {
    return this.menu.create(dto);
  }

  @Patch('items/:id')
  @Audit({ action: 'UPDATE', entityType: 'MenuItem', entityIdParam: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menu.update(id, dto);
  }

  @Patch('items/:id/availability')
  @Audit({ action: 'TOGGLE_AVAILABILITY', entityType: 'MenuItem', entityIdParam: 'id' })
  toggle(@Param('id') id: string, @Body() dto: ToggleAvailabilityDto) {
    return this.menu.toggleAvailability(id, dto.isAvailable);
  }

  @Delete('items/:id')
  @Audit({ action: 'DELETE', entityType: 'MenuItem', entityIdParam: 'id' })
  delete(@Param('id') id: string) {
    return this.menu.softDelete(id);
  }
}

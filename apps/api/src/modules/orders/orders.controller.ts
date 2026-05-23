import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderStatus, Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { ListOrdersQueryDto, UpdateOrderStatusDto } from './dto/orders.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload, @Query() q: ListOrdersQueryDto) {
    return this.orders.listForCustomer(user.sub, { page: q.page, pageSize: q.pageSize });
  }

  @Get(':id')
  getOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.orders.getOneForCustomer(user.sub, id);
  }
}

@ApiTags('admin/orders')
@Controller('admin/orders')
@Roles(Role.OWNER, Role.MANAGER, Role.KITCHEN_STAFF)
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query() q: ListOrdersQueryDto) {
    return this.orders.listForAdmin(q);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.orders.getOneForAdmin(id);
  }

  @Patch(':id/status')
  @Audit({ action: 'STATUS_CHANGE', entityType: 'Order', entityIdParam: 'id' })
  updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(id, dto.status, user.sub, dto.notes);
  }
}

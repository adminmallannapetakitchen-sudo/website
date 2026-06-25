import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/permissions';
import { Audit } from '../../common/decorators/audit.decorator';
import { AssignDeliveryDto, ListOrdersQueryDto, RateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';

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

  @Post(':id/rating')
  rate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: RateOrderDto,
  ) {
    return this.orders.rateOrder(user.sub, id, dto.rating, dto.comment);
  }
}

@ApiTags('admin/orders')
@Controller('admin/orders')
@RequirePermissions(PERMISSIONS.ORDERS_VIEW)
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query() q: ListOrdersQueryDto) {
    return this.orders.listForAdmin(q);
  }

  // Staff who can be assigned deliveries (their role grants delivery.own).
  @Get('delivery-people')
  @RequirePermissions(PERMISSIONS.ORDERS_MANAGE)
  deliveryPeople() {
    return this.orders.listDeliveryPeople();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.orders.getOneForAdmin(id);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.ORDERS_MANAGE)
  @Audit({ action: 'STATUS_CHANGE', entityType: 'Order', entityIdParam: 'id' })
  updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(id, dto.status, user.sub, dto.notes);
  }

  @Patch(':id/delivery')
  @RequirePermissions(PERMISSIONS.ORDERS_MANAGE)
  @Audit({ action: 'UPDATE', entityType: 'Order', entityIdParam: 'id' })
  assignDelivery(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: AssignDeliveryDto,
  ) {
    return this.orders.assignDelivery(id, dto.deliveryUserId ?? null, user.sub);
  }
}

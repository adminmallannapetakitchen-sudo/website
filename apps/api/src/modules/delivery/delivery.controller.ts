import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrdersService } from '../orders/orders.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/permissions';
import { Audit } from '../../common/decorators/audit.decorator';

/**
 * Delivery-staff endpoints. Gated by the delivery.own permission and always
 * scoped to the caller's own assigned orders — a delivery person can never see
 * or touch another person's orders.
 */
@ApiTags('delivery')
@Controller('delivery')
@RequirePermissions(PERMISSIONS.DELIVERY_OWN)
export class DeliveryController {
  constructor(private readonly orders: OrdersService) {}

  @Get('orders')
  myOrders(@CurrentUser() user: CurrentUserPayload) {
    return this.orders.listForDelivery(user.sub);
  }

  @Patch('orders/:id/delivered')
  @Audit({ action: 'STATUS_CHANGE', entityType: 'Order', entityIdParam: 'id' })
  markDelivered(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.orders.markDeliveredByDeliveryUser(id, user.sub);
  }
}

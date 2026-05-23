import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RefundDto, VerifyPaymentDto } from './dto/payments.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('verify')
  verify(@CurrentUser() user: CurrentUserPayload, @Body() dto: VerifyPaymentDto) {
    return this.payments.verifyAndCapture(user.sub, dto);
  }
}

@ApiTags('admin/payments')
@Controller('admin/payments')
@Roles(Role.OWNER, Role.MANAGER)
export class AdminPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('orders/:orderId/refund')
  @Audit({ action: 'REFUND', entityType: 'Order', entityIdParam: 'orderId' })
  refund(@Param('orderId') orderId: string, @Body() dto: RefundDto) {
    return this.payments.refund(orderId, dto.amount);
  }
}

import { BadRequestException, Controller, Headers, HttpCode, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentsService } from '../payments/payments.service';

@ApiTags('webhooks')
@Controller('webhooks')
// L1: Razorpay retries webhooks aggressively; never rate-limit them away.
@SkipThrottle()
export class WebhooksController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Post('razorpay')
  @HttpCode(200)
  async razorpay(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    if (!req.rawBody) throw new BadRequestException('Missing raw body');
    const rawBody = req.rawBody.toString('utf8');
    return this.payments.handleWebhook(rawBody, signature);
  }
}

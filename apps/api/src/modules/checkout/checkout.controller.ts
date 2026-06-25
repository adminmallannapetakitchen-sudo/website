import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { PlaceOrderDto, QuoteDto } from './dto/checkout.dto';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post('quote')
  quote(@CurrentUser() user: CurrentUserPayload, @Body() dto: QuoteDto) {
    return this.checkout.quote(user.sub, dto.couponCode, dto.tip);
  }

  @Post('place-order')
  placeOrder(@CurrentUser() user: CurrentUserPayload, @Body() dto: PlaceOrderDto) {
    return this.checkout.placeOrder(user.sub, dto);
  }
}

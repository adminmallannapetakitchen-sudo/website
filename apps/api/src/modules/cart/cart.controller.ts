import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { AddToCartDto, MergeCartDto, UpdateCartItemDto } from './dto/cart.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentUser() user: CurrentUserPayload) {
    return this.cart.get(user.sub);
  }

  @Post('items')
  add(@CurrentUser() user: CurrentUserPayload, @Body() dto: AddToCartDto) {
    return this.cart.addItem(user.sub, dto);
  }

  @Patch('items/:itemId')
  update(@CurrentUser() user: CurrentUserPayload, @Param('itemId') itemId: string, @Body() dto: UpdateCartItemDto) {
    return this.cart.updateItem(user.sub, itemId, dto);
  }

  @Delete('items/:itemId')
  remove(@CurrentUser() user: CurrentUserPayload, @Param('itemId') itemId: string) {
    return this.cart.removeItem(user.sub, itemId);
  }

  @Delete()
  clear(@CurrentUser() user: CurrentUserPayload) {
    return this.cart.clear(user.sub);
  }

  @Post('merge')
  merge(@CurrentUser() user: CurrentUserPayload, @Body() dto: MergeCartDto) {
    return this.cart.merge(user.sub, dto);
  }
}

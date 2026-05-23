import { Body, Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';
import { PushService } from './push.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

class SubscribeDto {
  @IsString() endpoint!: string;
  @IsObject() keys!: { p256dh: string; auth: string };
}

class UnsubscribeDto {
  @IsString() endpoint!: string;
}

@ApiTags('push')
@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Public()
  @Get('vapid-public-key')
  publicKey() {
    return { publicKey: this.push.getPublicKey() };
  }

  @Post('subscribe')
  subscribe(@CurrentUser() user: CurrentUserPayload, @Body() dto: SubscribeDto, @Req() req: any) {
    return this.push.subscribe(user.sub, dto, req.headers['user-agent']);
  }

  @Delete('subscribe')
  unsubscribe(@CurrentUser() user: CurrentUserPayload, @Body() dto: UnsubscribeDto) {
    return this.push.unsubscribe(user.sub, dto.endpoint);
  }
}

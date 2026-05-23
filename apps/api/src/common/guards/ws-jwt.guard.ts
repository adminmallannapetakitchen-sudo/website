import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const client = ctx.switchToWs().getClient();
    const token =
      (client.handshake?.auth?.token as string | undefined) ??
      (client.handshake?.headers?.authorization as string | undefined)?.replace(/^Bearer\s/i, '');

    if (!token) return false;
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      client.data.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const ADMIN_ROLES: Role[] = [Role.OWNER, Role.MANAGER, Role.KITCHEN_STAFF];

@Injectable()
@WebSocketGateway({ namespace: '/realtime', cors: { origin: true, credentials: true } })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger('RealtimeGateway');

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit() {
    this.logger.log('Realtime gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.headers.authorization as string | undefined)?.replace(/^Bearer\s/i, '');

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });

      client.data.user = payload;

      // Auto join rooms
      client.join(`customer:${payload.sub}`);
      if (ADMIN_ROLES.includes(payload.role)) {
        client.join('admin:orders');
        client.join('admin:kitchen');
      }
    } catch (err) {
      this.logger.warn(`Auth failed: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect() {}

  @SubscribeMessage('order:subscribe')
  async subscribeToOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId?: string },
  ) {
    // H3: previously the payload arrived undefined (missing @MessageBody) so
    // this silently joined `order:undefined`, AND there was no ownership
    // check. Both are fixed: validate the payload and only let the caller
    // join their own order's room (admins may join any).
    const user = client.data.user as { sub: string; role: Role } | undefined;
    if (!user) return { ok: false, error: 'Unauthorized' };

    const orderId = payload?.orderId;
    if (!orderId || typeof orderId !== 'string') {
      return { ok: false, error: 'orderId required' };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });
    if (!order) return { ok: false, error: 'Order not found' };

    const isOwner = order.userId === user.sub;
    const isAdmin = ADMIN_ROLES.includes(user.role);
    if (!isOwner && !isAdmin) {
      return { ok: false, error: 'Forbidden' };
    }

    client.join(`order:${orderId}`);
    return { ok: true };
  }

  @SubscribeMessage('order:unsubscribe')
  unsubscribeFromOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId?: string },
  ) {
    if (payload?.orderId) client.leave(`order:${payload.orderId}`);
    return { ok: true };
  }

  // ─── Emitters ───────────────────────────────────────────────────

  notifyOrderStatusChange(orderId: string, status: OrderStatus, userId: string) {
    if (!this.server) return;
    const payload = { orderId, status, timestamp: new Date().toISOString() };
    this.server.to(`order:${orderId}`).emit('order:status_changed', payload);
    this.server.to(`customer:${userId}`).emit('order:status_changed', payload);
    this.server.to('admin:orders').emit('order:status_changed', payload);
  }

  notifyAdminNewOrder(orderId: string) {
    if (!this.server) return;
    this.server.to('admin:orders').emit('order:new', { orderId, timestamp: new Date().toISOString() });
  }

  notifyKitchenSettingsUpdated() {
    if (!this.server) return;
    this.server.emit('kitchen:settings_updated', { timestamp: new Date().toISOString() });
  }

  notifyMenuItemAvailabilityChanged(menuItemId: string, isAvailable: boolean) {
    if (!this.server) return;
    this.server.emit('menu:item_availability_changed', { menuItemId, isAvailable });
  }
}

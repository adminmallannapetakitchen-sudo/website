import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDIT_KEY, AuditMetadata } from '../decorators/audit.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const meta = this.reflector.get<AuditMetadata | undefined>(AUDIT_KEY, ctx.getHandler());
    if (!meta) return next.handle();

    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    const entityId = meta.entityIdParam ? req.params[meta.entityIdParam] : '*';
    const before = req.body ?? null;

    return next.handle().pipe(
      tap(async (after) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              actorUserId: user?.sub ?? null,
              action: meta.action,
              entityType: meta.entityType,
              entityId,
              before,
              after: typeof after === 'object' ? after : { result: after },
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'] ?? null,
            },
          });
        } catch {
          // never fail the request because audit failed
        }
      }),
    );
  }
}

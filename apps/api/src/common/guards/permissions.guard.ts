import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { effectivePermissions, type Permission } from '../permissions';

/**
 * Enforces fine-grained permissions declared via @RequirePermissions(...).
 * Routes without that metadata are untouched (returns true immediately, no DB
 * hit), so only admin endpoints pay for the lookup. Owner always passes.
 *
 * The user's effective permissions are resolved from the DB on each protected
 * request rather than baked into the JWT, so editing a role takes effect on the
 * next request (access tokens are short-lived anyway).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const jwtUser = req.user;
    if (!jwtUser?.sub) throw new ForbiddenException('Not authenticated');

    // Owner short-circuit — avoid a DB hit for the super-admin.
    if (jwtUser.role === Role.OWNER) {
      req.permissions = effectivePermissions(Role.OWNER);
      return true;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: jwtUser.sub },
      select: { role: true, deletedAt: true, staffRole: { select: { permissions: true } } },
    });
    if (!user || user.deletedAt) throw new ForbiddenException('Not authenticated');

    const perms = effectivePermissions(user.role, user.staffRole?.permissions ?? null);
    const missing = required.filter((p) => !perms.includes(p));
    if (missing.length > 0) {
      throw new ForbiddenException(`Missing permission: ${missing.join(', ')}`);
    }

    req.permissions = perms;
    return true;
  }
}

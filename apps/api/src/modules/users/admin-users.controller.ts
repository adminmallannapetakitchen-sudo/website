import { BadRequestException, Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/permissions';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

class UpdateRoleDto {
  @IsEnum(Role) role!: Role;
}

class AssignStaffRoleDto {
  // null / omitted clears the custom role (falls back to the enum role's access)
  @IsOptional() @IsString() staffRoleId?: string | null;
}

@ApiTags('admin/users')
@Controller('admin/users')
@RequirePermissions(PERMISSIONS.STAFF_MANAGE)
export class AdminUsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('search') search?: string, @Query('role') role?: string) {
    const where: any = { deletedAt: null };
    if (role && role !== 'ALL') where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneE164: { contains: search } },
      ];
    }
    const users = await this.prisma.user.findMany({
      where,
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        email: true,
        phoneE164: true,
        role: true,
        staffRoleId: true,
        staffRole: { select: { id: true, name: true, permissions: true } },
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { orders: true } },
      },
      take: 200,
    });
    return { users };
  }

  @Patch(':id/role')
  @Audit({ action: 'ROLE_CHANGE', entityType: 'User', entityIdParam: 'id' })
  async updateRole(
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.deletedAt) throw new BadRequestException('User not found');

    if (target.id === actor.sub && dto.role !== Role.OWNER) {
      throw new BadRequestException('You cannot demote your own OWNER account');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // L6: never let the last OWNER be demoted (by self OR by another OWNER).
      // Without this the kitchen could be locked out of all owner-only admin.
      if (target.role === Role.OWNER && dto.role !== Role.OWNER) {
        const ownerCount = await tx.user.count({
          where: { role: Role.OWNER, deletedAt: null },
        });
        if (ownerCount <= 1) {
          throw new BadRequestException('Cannot demote the last remaining OWNER');
        }
      }

      const u = await tx.user.update({
        where: { id },
        data: { role: dto.role },
        select: { id: true, name: true, email: true, phoneE164: true, role: true },
      });

      // Revoke their refresh tokens so the new role takes effect on next login
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return u;
    });

    return updated;
  }

  @Patch(':id/staff-role')
  @Audit({ action: 'ROLE_CHANGE', entityType: 'User', entityIdParam: 'id' })
  async assignStaffRole(
    @Param('id') id: string,
    @Body() dto: AssignStaffRoleDto,
  ) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.deletedAt) throw new BadRequestException('User not found');

    const staffRoleId = dto.staffRoleId ?? null;
    if (staffRoleId) {
      const role = await this.prisma.staffRole.findUnique({ where: { id: staffRoleId } });
      if (!role) throw new BadRequestException('Role not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: { staffRoleId },
        select: {
          id: true,
          name: true,
          email: true,
          phoneE164: true,
          role: true,
          staffRole: { select: { id: true, name: true, permissions: true } },
        },
      });
      // Force a fresh login so the new permissions take effect everywhere.
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return u;
    });

    return updated;
  }
}

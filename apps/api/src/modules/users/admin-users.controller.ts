import { BadRequestException, Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

class UpdateRoleDto {
  @IsEnum(Role) role!: Role;
}

@ApiTags('admin/users')
@Controller('admin/users')
@Roles(Role.OWNER)
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
}

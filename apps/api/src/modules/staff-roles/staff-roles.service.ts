import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ALL_PERMISSIONS, PERMISSION_META, PERMISSIONS, type Permission } from '../../common/permissions';

@Injectable()
export class StaffRolesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  // Make sure a ready-to-use "Delivery" role always exists so the owner can
  // assign delivery staff without first building a role from scratch.
  async onModuleInit() {
    const existing = await this.prisma.staffRole.findUnique({ where: { name: 'Delivery' } });
    if (!existing) {
      await this.prisma.staffRole
        .create({ data: { name: 'Delivery', permissions: [PERMISSIONS.DELIVERY_OWN], isSystem: true } })
        .catch(() => undefined); // race-safe on multi-instance boot
    }
  }

  /** The permission catalog the admin UI renders as checkboxes. */
  catalog() {
    return PERMISSION_META;
  }

  list() {
    return this.prisma.staffRole.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { users: true } } },
    });
  }

  private clean(permissions: string[] | undefined): Permission[] {
    const set = new Set((permissions ?? []).filter((p): p is Permission =>
      (ALL_PERMISSIONS as string[]).includes(p),
    ));
    return [...set];
  }

  async create(name: string, permissions: string[]) {
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('Role name is required');
    const dupe = await this.prisma.staffRole.findUnique({ where: { name: trimmed } });
    if (dupe) throw new BadRequestException('A role with this name already exists');
    return this.prisma.staffRole.create({
      data: { name: trimmed, permissions: this.clean(permissions) },
    });
  }

  async update(id: string, data: { name?: string; permissions?: string[] }) {
    const role = await this.prisma.staffRole.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    const patch: { name?: string; permissions?: Permission[] } = {};
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) throw new BadRequestException('Role name is required');
      if (trimmed !== role.name) {
        const dupe = await this.prisma.staffRole.findUnique({ where: { name: trimmed } });
        if (dupe) throw new BadRequestException('A role with this name already exists');
        patch.name = trimmed;
      }
    }
    if (data.permissions !== undefined) patch.permissions = this.clean(data.permissions);

    return this.prisma.staffRole.update({ where: { id }, data: patch });
  }

  async remove(id: string) {
    const role = await this.prisma.staffRole.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('Built-in roles cannot be deleted');
    if (role._count.users > 0) {
      throw new BadRequestException(
        `This role is assigned to ${role._count.users} ${role._count.users === 1 ? 'person' : 'people'}. Reassign them first.`,
      );
    }
    await this.prisma.staffRole.delete({ where: { id } });
    return { ok: true };
  }
}

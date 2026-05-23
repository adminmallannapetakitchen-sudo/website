import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SundaySpecialService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent() {
    const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const todayUtcDate = new Date(
      Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()),
    );
    const isSundayToday = ist.getUTCDay() === 0;

    // Find the nearest active special for today or an upcoming Sunday, then
    // return ALL active specials for that same Sunday (more than one dish per
    // week is now allowed).
    const nearest = await this.prisma.sundaySpecial.findFirst({
      where: { isActive: true, weekStarting: { gte: todayUtcDate } },
      orderBy: { weekStarting: 'asc' },
      select: { weekStarting: true },
    });

    if (!nearest) {
      return { isActive: false, isOrderable: false, special: null, specials: [], orderOpensAt: null };
    }

    const specials = await this.prisma.sundaySpecial.findMany({
      where: { isActive: true, weekStarting: nearest.weekStarting },
      orderBy: { createdAt: 'asc' },
      include: {
        menuItem: { include: { variants: { where: { deletedAt: null } } } },
      },
    });
    const special = specials[0];

    const ws = new Date(special.weekStarting);
    const wsDateOnly = new Date(
      Date.UTC(ws.getUTCFullYear(), ws.getUTCMonth(), ws.getUTCDate()),
    );
    const isOrderable =
      isSundayToday && wsDateOnly.getTime() === todayUtcDate.getTime();

    // Instant when ordering opens = 00:00 IST on the special's Sunday
    const orderOpensAt = new Date(
      wsDateOnly.getTime() - 5.5 * 60 * 60 * 1000,
    ).toISOString();

    return { isActive: true, isOrderable, special, specials, orderOpensAt };
  }

  list() {
    return this.prisma.sundaySpecial.findMany({
      orderBy: { weekStarting: 'desc' },
      include: { menuItem: { select: { id: true, name: true, nameTe: true, imageUrl: true } } },
    });
  }

  async create(data: {
    menuItemId: string;
    weekStarting: Date;
    specialPrice: number;
    bannerPhotoUrl?: string;
    bannerHeadline?: string;
    bannerHeadlineTe?: string;
    description?: string;
    descriptionTe?: string;
    isActive?: boolean;
  }) {
    const menuItem = await this.prisma.menuItem.findUnique({ where: { id: data.menuItemId } });
    if (!menuItem || menuItem.deletedAt) throw new NotFoundException('Menu item not found');
    return this.prisma.sundaySpecial.create({ data });
  }

  async update(id: string, data: Partial<Parameters<this['create']>[0]>) {
    const existing = await this.prisma.sundaySpecial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sunday special not found');
    return this.prisma.sundaySpecial.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.prisma.sundaySpecial.delete({ where: { id } });
    return { ok: true };
  }
}

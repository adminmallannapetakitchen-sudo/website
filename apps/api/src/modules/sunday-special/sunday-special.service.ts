import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SUNDAY_SPECIAL_CATEGORY_SLUG } from '../../common/constants';

export interface SundaySpecialVariantInput {
  id?: string;
  label: string;
  labelTe?: string;
  price: number;
}

export interface SundaySpecialInput {
  name: string;
  nameTe?: string;
  description?: string;
  descriptionTe?: string;
  imageUrl?: string;
  weekStarting: Date;
  bannerHeadline?: string;
  bannerHeadlineTe?: string;
  isActive?: boolean;
  availableAnyDay?: boolean;
  variants: SundaySpecialVariantInput[];
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

@Injectable()
export class SundaySpecialService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Public ──────────────────────────────────────────────

  async getCurrent() {
    // Override specials (force-enabled on any day) take priority and are
    // orderable immediately, regardless of what day it is.
    const anyDay = await this.prisma.sundaySpecial.findMany({
      where: { isActive: true, availableAnyDay: true },
      orderBy: { createdAt: 'asc' },
      include: {
        menuItem: { include: { variants: { where: { deletedAt: null }, orderBy: { displayOrder: 'asc' } } } },
      },
    });
    if (anyDay.length > 0) {
      return {
        isActive: true,
        isOrderable: true,
        special: anyDay[0],
        specials: anyDay,
        orderOpensAt: null,
      };
    }

    const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const todayUtcDate = new Date(
      Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()),
    );
    const isSundayToday = ist.getUTCDay() === 0;

    // Find the nearest active special for today or an upcoming Sunday, then
    // return ALL active specials for that same Sunday (more than one dish per
    // week is allowed).
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
        menuItem: { include: { variants: { where: { deletedAt: null }, orderBy: { displayOrder: 'asc' } } } },
      },
    });
    const special = specials[0];

    const ws = new Date(special.weekStarting);
    const wsDateOnly = new Date(
      Date.UTC(ws.getUTCFullYear(), ws.getUTCMonth(), ws.getUTCDate()),
    );
    const isOrderable = isSundayToday && wsDateOnly.getTime() === todayUtcDate.getTime();

    // Instant when ordering opens = 00:00 IST on the special's Sunday
    const orderOpensAt = new Date(wsDateOnly.getTime() - 5.5 * 60 * 60 * 1000).toISOString();

    return { isActive: true, isOrderable, special, specials, orderOpensAt };
  }

  // ─── Admin ───────────────────────────────────────────────

  list() {
    return this.prisma.sundaySpecial.findMany({
      orderBy: { weekStarting: 'desc' },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            nameTe: true,
            description: true,
            descriptionTe: true,
            imageUrl: true,
            variants: { where: { deletedAt: null }, orderBy: { displayOrder: 'asc' } },
          },
        },
      },
    });
  }

  async create(dto: SundaySpecialInput) {
    const variants = this.cleanVariants(dto.variants);
    const categoryId = await this.ensureHiddenCategory();
    const specialPrice = Math.min(...variants.map((v) => v.price));

    return this.prisma.$transaction(async (tx) => {
      const menuItem = await tx.menuItem.create({
        data: {
          categoryId,
          name: dto.name,
          nameTe: dto.nameTe,
          slug: `ss-${slugify(dto.name) || 'special'}-${Date.now().toString(36)}`,
          description: dto.description,
          descriptionTe: dto.descriptionTe,
          imageUrl: dto.imageUrl,
          isSundaySpecialOnly: true,
          isAvailable: dto.isActive ?? true,
          variants: {
            create: variants.map((v, i) => ({
              label: v.label,
              labelTe: v.labelTe,
              price: v.price,
              displayOrder: i,
            })),
          },
        },
      });

      return tx.sundaySpecial.create({
        data: {
          menuItemId: menuItem.id,
          weekStarting: dto.weekStarting,
          specialPrice,
          bannerPhotoUrl: dto.imageUrl,
          bannerHeadline: dto.bannerHeadline,
          bannerHeadlineTe: dto.bannerHeadlineTe,
          description: dto.description,
          descriptionTe: dto.descriptionTe,
          isActive: dto.isActive ?? true,
          availableAnyDay: dto.availableAnyDay ?? false,
        },
        include: { menuItem: { include: { variants: true } } },
      });
    });
  }

  async update(id: string, dto: Partial<SundaySpecialInput>) {
    const existing = await this.prisma.sundaySpecial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sunday special not found');

    const variants = dto.variants ? this.cleanVariants(dto.variants) : undefined;
    const specialPrice = variants ? Math.min(...variants.map((v) => v.price)) : undefined;

    return this.prisma.$transaction(async (tx) => {
      // Keep the hidden backing menu item in sync with the special.
      await tx.menuItem.update({
        where: { id: existing.menuItemId },
        data: {
          name: dto.name,
          nameTe: dto.nameTe,
          description: dto.description,
          descriptionTe: dto.descriptionTe,
          imageUrl: dto.imageUrl,
          // Toggling the special on/off also gates its orderability.
          isAvailable: dto.isActive,
        },
      });

      if (variants) await this.syncVariants(tx, existing.menuItemId, variants);

      return tx.sundaySpecial.update({
        where: { id },
        data: {
          weekStarting: dto.weekStarting,
          specialPrice,
          bannerPhotoUrl: dto.imageUrl,
          bannerHeadline: dto.bannerHeadline,
          bannerHeadlineTe: dto.bannerHeadlineTe,
          description: dto.description,
          descriptionTe: dto.descriptionTe,
          isActive: dto.isActive,
          availableAnyDay: dto.availableAnyDay,
        },
        include: { menuItem: { include: { variants: { where: { deletedAt: null } } } } },
      });
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.sundaySpecial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sunday special not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.sundaySpecial.delete({ where: { id } });
      // Soft-delete the hidden backing item so historical orders keep their FK.
      await tx.menuItem.update({
        where: { id: existing.menuItemId },
        data: { deletedAt: new Date(), isAvailable: false },
      });
    });
    return { ok: true };
  }

  // ─── Helpers ─────────────────────────────────────────────

  private cleanVariants(variants: SundaySpecialVariantInput[]) {
    const cleaned = (variants ?? []).filter((v) => v.label?.trim() && v.price >= 0);
    if (cleaned.length === 0) {
      throw new BadRequestException('At least one variant with a label and price is required');
    }
    return cleaned;
  }

  private async ensureHiddenCategory(): Promise<string> {
    const existing = await this.prisma.category.findUnique({
      where: { slug: SUNDAY_SPECIAL_CATEGORY_SLUG },
    });
    if (existing) return existing.id;
    const created = await this.prisma.category.create({
      data: {
        name: 'Sunday Specials (system)',
        slug: SUNDAY_SPECIAL_CATEGORY_SLUG,
        isActive: false,
        displayOrder: 9999,
      },
    });
    return created.id;
  }

  private async syncVariants(
    tx: Prisma.TransactionClient,
    menuItemId: string,
    variants: SundaySpecialVariantInput[],
  ) {
    const existing = await tx.menuItemVariant.findMany({
      where: { menuItemId, deletedAt: null },
    });
    const incomingIds = new Set(variants.filter((v) => v.id).map((v) => v.id!));

    const toRemove = existing.filter((e) => !incomingIds.has(e.id));
    if (toRemove.length) {
      await tx.menuItemVariant.updateMany({
        where: { id: { in: toRemove.map((v) => v.id) } },
        data: { deletedAt: new Date(), isAvailable: false },
      });
    }

    for (const [i, v] of variants.entries()) {
      if (v.id) {
        await tx.menuItemVariant.update({
          where: { id: v.id },
          data: { label: v.label, labelTe: v.labelTe, price: v.price, displayOrder: i, isAvailable: true },
        });
      } else {
        await tx.menuItemVariant.create({
          data: { menuItemId, label: v.label, labelTe: v.labelTe, price: v.price, displayOrder: i },
        });
      }
    }
  }
}

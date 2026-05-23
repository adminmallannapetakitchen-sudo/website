import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemDto, UpdateMenuItemDto, VariantInput, AddonInput } from './dto/menu.dto';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── PUBLIC ──────────────────────────────────────────────

  listPublic(opts: { search?: string; categoryId?: string } = {}) {
    const where: Prisma.MenuItemWhereInput = {
      deletedAt: null,
      isAvailable: true,
      category: { deletedAt: null, isActive: true },
    };
    if (opts.categoryId) where.categoryId = opts.categoryId;
    if (opts.search) {
      where.OR = [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { nameTe: { contains: opts.search } },
        { description: { contains: opts.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.menuItem.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        variants: { where: { deletedAt: null }, orderBy: { displayOrder: 'asc' } },
        addons: { where: { isAvailable: true } },
        category: { select: { id: true, name: true, nameTe: true, slug: true } },
      },
    });
  }

  async getBySlug(slug: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { slug, deletedAt: null },
      include: {
        variants: { where: { deletedAt: null }, orderBy: { displayOrder: 'asc' } },
        addons: true,
        category: true,
      },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  // ─── ADMIN ──────────────────────────────────────────────

  listAdmin(opts: { search?: string; categoryId?: string; includeDeleted?: boolean } = {}) {
    const where: Prisma.MenuItemWhereInput = {};
    if (!opts.includeDeleted) where.deletedAt = null;
    if (opts.categoryId) where.categoryId = opts.categoryId;
    if (opts.search) {
      where.OR = [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { slug: { contains: opts.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.menuItem.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        variants: { where: { deletedAt: null }, orderBy: { displayOrder: 'asc' } },
        addons: true,
        category: { select: { id: true, name: true } },
      },
    });
  }

  async create(dto: CreateMenuItemDto) {
    const clash = await this.prisma.menuItem.findUnique({ where: { slug: dto.slug } });
    if (clash) {
      throw new BadRequestException(
        'An item with a similar name already exists — please use a different name.',
      );
    }
    return this.prisma.menuItem.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        nameTe: dto.nameTe,
        slug: dto.slug,
        description: dto.description,
        descriptionTe: dto.descriptionTe,
        imageUrl: dto.imageUrl,
        isVeg: dto.isVeg ?? false,
        isAvailable: dto.isAvailable ?? true,
        isBestseller: dto.isBestseller ?? false,
        isSundaySpecialCandidate: dto.isSundaySpecialCandidate ?? false,
        displayOrder: dto.displayOrder ?? 0,
        variants: {
          create: dto.variants.map((v, i) => ({
            label: v.label,
            labelTe: v.labelTe,
            price: v.price,
            displayOrder: v.displayOrder ?? i,
            isAvailable: v.isAvailable ?? true,
          })),
        },
        addons: dto.addons
          ? { create: dto.addons.map((a) => ({ label: a.label, labelTe: a.labelTe, price: a.price })) }
          : undefined,
      },
      include: { variants: true, addons: true },
    });
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    const existing = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException('Menu item not found');

    if (dto.slug && dto.slug !== existing.slug) {
      const clash = await this.prisma.menuItem.findUnique({ where: { slug: dto.slug } });
      if (clash && clash.id !== id) {
        throw new BadRequestException(
          'Another item with a similar name already exists — please use a different name.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.menuItem.update({
        where: { id },
        data: {
          categoryId: dto.categoryId,
          name: dto.name,
          nameTe: dto.nameTe,
          slug: dto.slug,
          description: dto.description,
          descriptionTe: dto.descriptionTe,
          imageUrl: dto.imageUrl,
          isVeg: dto.isVeg,
          isAvailable: dto.isAvailable,
          isBestseller: dto.isBestseller,
          isSundaySpecialCandidate: dto.isSundaySpecialCandidate,
          displayOrder: dto.displayOrder,
        },
      });

      if (dto.variants) await this.syncVariants(tx, id, dto.variants);
      if (dto.addons) await this.syncAddons(tx, id, dto.addons);

      return tx.menuItem.findUnique({
        where: { id },
        include: { variants: { where: { deletedAt: null } }, addons: true },
      });
    });
  }

  private async syncVariants(tx: Prisma.TransactionClient, menuItemId: string, variants: VariantInput[]) {
    const existing = await tx.menuItemVariant.findMany({
      where: { menuItemId, deletedAt: null },
    });
    const incomingIds = new Set(variants.filter((v) => v.id).map((v) => v.id!));

    // Soft-delete removed variants
    const toRemove = existing.filter((e) => !incomingIds.has(e.id));
    if (toRemove.length) {
      await tx.menuItemVariant.updateMany({
        where: { id: { in: toRemove.map((v) => v.id) } },
        data: { deletedAt: new Date(), isAvailable: false },
      });
    }

    // Upsert
    for (const [i, v] of variants.entries()) {
      if (v.id) {
        await tx.menuItemVariant.update({
          where: { id: v.id },
          data: {
            label: v.label,
            labelTe: v.labelTe,
            price: v.price,
            displayOrder: v.displayOrder ?? i,
            isAvailable: v.isAvailable ?? true,
          },
        });
      } else {
        await tx.menuItemVariant.create({
          data: {
            menuItemId,
            label: v.label,
            labelTe: v.labelTe,
            price: v.price,
            displayOrder: v.displayOrder ?? i,
            isAvailable: v.isAvailable ?? true,
          },
        });
      }
    }
  }

  private async syncAddons(tx: Prisma.TransactionClient, menuItemId: string, addons: AddonInput[]) {
    await tx.menuItemAddon.deleteMany({ where: { menuItemId } });
    if (addons.length) {
      await tx.menuItemAddon.createMany({
        data: addons.map((a) => ({ menuItemId, label: a.label, labelTe: a.labelTe, price: a.price })),
      });
    }
  }

  async toggleAvailability(id: string, isAvailable: boolean) {
    await this.prisma.menuItem.update({ where: { id }, data: { isAvailable } });
    return { id, isAvailable };
  }

  async softDelete(id: string) {
    await this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date(), isAvailable: false },
    });
    return { ok: true };
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto, MergeCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCart(userId: string) {
    // Atomic get-or-create. `userId` is a single non-null unique column, so
    // Prisma compiles this to a real INSERT … ON CONFLICT DO UPDATE — the
    // previous findUnique→create raced on first use (N concurrent adds all
    // saw "no cart" and tried to create → Unique constraint failed on
    // user_id, surfacing as a 500 before the item was ever added).
    return this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async get(userId: string) {
    const cart = await this.ensureCart(userId);
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        menuItem: {
          include: { category: { select: { id: true, name: true } } },
        },
        variant: true,
      },
      orderBy: { addedAt: 'asc' },
    });

    return {
      cartId: cart.id,
      items: items.map((i) => ({
        id: i.id,
        menuItemId: i.menuItemId,
        variantId: i.variantId,
        qty: i.qty,
        notes: i.notes,
        menuItem: {
          id: i.menuItem.id,
          name: i.menuItem.name,
          nameTe: i.menuItem.nameTe,
          slug: i.menuItem.slug,
          imageUrl: i.menuItem.imageUrl,
          isAvailable: i.menuItem.isAvailable && !i.menuItem.deletedAt,
        },
        variant: i.variant
          ? {
              id: i.variant.id,
              label: i.variant.label,
              labelTe: i.variant.labelTe,
              price: Number(i.variant.price),
              isAvailable: i.variant.isAvailable && !i.variant.deletedAt,
            }
          : null,
      })),
    };
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const cart = await this.ensureCart(userId);
    await this.validateItem(dto.menuItemId, dto.variantId);

    const whereKey = {
      cartId_menuItemId_variantId: {
        cartId: cart.id,
        menuItemId: dto.menuItemId,
        variantId: dto.variantId ?? null,
      },
    } as any;

    // The previous findUnique→create was not atomic: two near-simultaneous
    // adds of the same line both saw "not existing" and both tried to create
    // → Unique constraint failed on (cart_id, menu_item_id, variant_id).
    //
    // Prisma's upsert is NOT compiled to a single atomic INSERT … ON CONFLICT
    // here because the composite unique contains a nullable column, so under
    // concurrency it can still surface P2002. We make it correct by catching
    // that exact race and falling back to an atomic increment-update (the row
    // is guaranteed to exist by then).
    let item;
    try {
      item = await this.prisma.cartItem.upsert({
        where: whereKey,
        create: {
          cartId: cart.id,
          menuItemId: dto.menuItemId,
          variantId: dto.variantId,
          qty: Math.min(99, dto.qty),
          notes: dto.notes,
        },
        update: { qty: { increment: dto.qty }, notes: dto.notes ?? undefined },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        item = await this.prisma.cartItem.update({
          where: whereKey,
          data: { qty: { increment: dto.qty }, notes: dto.notes ?? undefined },
        });
      } else {
        throw e;
      }
    }
    if (item.qty > 99) {
      return this.prisma.cartItem.update({ where: { id: item.id }, data: { qty: 99 } });
    }
    return item;
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.ensureCart(userId);
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');

    if (dto.qty === 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
      return { ok: true, removed: true };
    }
    return this.prisma.cartItem.update({ where: { id: itemId }, data: { qty: dto.qty } });
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.ensureCart(userId);
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return { ok: true };
  }

  async clear(userId: string) {
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { ok: true };
  }

  /**
   * Sync the client cart to the server. This is a **replace** (idempotent):
   * the server cart becomes exactly the supplied items. Both callers
   * (post-login guest-cart sync, checkout sync) want this, and replace
   * semantics make it safe to call concurrently / twice.
   *
   * The old additive findUnique→create-per-item loop had two bugs:
   *  - it raced (concurrent login-sync + checkout-sync) → Unique constraint
   *    failed on (cart_id, menu_item_id, variant_id);
   *  - delete-then-merge as two separate HTTP requests double-counted qty
   *    (add 1 → showed 2) when the requests interleaved.
   */
  async merge(userId: string, dto: MergeCartDto) {
    const cart = await this.ensureCart(userId);

    // Dedupe the incoming payload by (menuItemId, variantId), summing qty,
    // so a single request can never collide with itself.
    const map = new Map<string, { menuItemId: string; variantId: string | null; qty: number }>();
    for (const it of dto.items ?? []) {
      try {
        await this.validateItem(it.menuItemId, it.variantId);
      } catch {
        continue; // skip items that are no longer orderable
      }
      const variantId = it.variantId ?? null;
      const key = `${it.menuItemId}::${variantId ?? ''}`;
      const prev = map.get(key);
      if (prev) prev.qty = Math.min(99, prev.qty + it.qty);
      else map.set(key, { menuItemId: it.menuItemId, variantId, qty: Math.min(99, it.qty) });
    }
    const items = [...map.values()];

    // One atomic, cart-locked replace. FOR UPDATE serialises concurrent
    // syncs for this user (same technique as checkout) so they can't
    // interleave into duplicates or doubled quantities.
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM carts WHERE user_id = ${userId} FOR UPDATE`;
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      if (items.length) {
        await tx.cartItem.createMany({
          data: items.map((i) => ({
            cartId: cart.id,
            menuItemId: i.menuItemId,
            variantId: i.variantId,
            qty: i.qty,
          })),
        });
      }
    });

    return this.get(userId);
  }

  private async validateItem(menuItemId: string, variantId?: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { variants: { where: { deletedAt: null } } },
    });
    if (!item || item.deletedAt || !item.isAvailable) {
      throw new BadRequestException('Menu item unavailable');
    }
    // M3: pricing requires every ordered line to have a variant (that's where
    // the price lives). The cart must enforce the same rule, otherwise a
    // no-variant item could be added and then permanently block checkout.
    const availableVariants = item.variants.filter((vv) => vv.isAvailable);
    if (availableVariants.length === 0) {
      throw new BadRequestException('This item is not available for ordering');
    }
    if (!variantId) throw new BadRequestException('Variant required for this item');
    const v = availableVariants.find((vv) => vv.id === variantId);
    if (!v) throw new BadRequestException('Variant unavailable');
  }
}

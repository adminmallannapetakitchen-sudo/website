import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { SUNDAY_SPECIAL_CATEGORY_SLUG } from '../../common/constants';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic() {
    return this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null, slug: { not: SUNDAY_SPECIAL_CATEGORY_SLUG } },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  listAdmin() {
    // The hidden category that backs standalone Sunday Specials is system-managed
    // — keep it out of the categories screen.
    return this.prisma.category.findMany({
      where: { deletedAt: null, slug: { not: SUNDAY_SPECIAL_CATEGORY_SLUG } },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { menuItems: { where: { deletedAt: null } } } } },
    });
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const exists = await this.prisma.category.findUnique({ where: { id } });
    if (!exists || exists.deletedAt) throw new NotFoundException('Category not found');
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async softDelete(id: string) {
    await this.prisma.category.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { ok: true };
  }
}

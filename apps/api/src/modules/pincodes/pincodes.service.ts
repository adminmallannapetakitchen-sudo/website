import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PincodesService {
  constructor(private readonly prisma: PrismaService) {}

  async check(pincode: string) {
    const record = await this.prisma.serviceablePincode.findFirst({
      where: { pincode, deletedAt: null, isActive: true },
    });
    return {
      pincode,
      isServiceable: !!record,
      areaName: record?.areaName ?? null,
    };
  }

  list() {
    return this.prisma.serviceablePincode.findMany({
      where: { deletedAt: null },
      orderBy: [{ pincode: 'asc' }],
    });
  }

  create(data: { pincode: string; areaName?: string; isActive?: boolean }) {
    return this.prisma.serviceablePincode.create({
      data: { pincode: data.pincode, areaName: data.areaName, isActive: data.isActive ?? true },
    });
  }

  async update(id: string, data: { areaName?: string; isActive?: boolean }) {
    const existing = await this.prisma.serviceablePincode.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException('Pincode not found');
    return this.prisma.serviceablePincode.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    await this.prisma.serviceablePincode.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { ok: true };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KitchenSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublic() {
    const settings = await this.ensureExists();
    return {
      name: settings.name,
      nameTe: settings.nameTe,
      isOpen: settings.isOpen,
      openingHours: settings.openingHours,
      openingHoursTe: settings.openingHoursTe,
      contactPhone: settings.contactPhone,
      supportWhatsapp: settings.supportWhatsapp,
      contactEmail: settings.contactEmail,
      instagramUrl: settings.instagramUrl,
      minOrderValue: Number(settings.minOrderValue),
      deliveryFee: Number(settings.deliveryFee),
      estimatedPrepMinutes: settings.estimatedPrepMinutes,
      closedMessage: settings.closedMessage,
    };
  }

  async getFull() {
    return this.ensureExists();
  }

  async update(data: Partial<{
    isOpen: boolean;
    openingHours: string;
    openingHoursTe: string;
    contactPhone: string;
    supportWhatsapp: string;
    contactEmail: string;
    instagramUrl: string;
    minOrderValue: number;
    deliveryFee: number;
    estimatedPrepMinutes: number;
    closedMessage: string;
  }>) {
    await this.ensureExists();
    return this.prisma.kitchenSettings.update({
      where: { id: 'settings' },
      data,
    });
  }

  private async ensureExists() {
    let settings = await this.prisma.kitchenSettings.findUnique({ where: { id: 'settings' } });
    if (!settings) {
      settings = await this.prisma.kitchenSettings.create({
        data: {
          id: 'settings',
          contactPhone: '+91 79930 40100',
          supportWhatsapp: '+91 79930 40100',
          contactEmail: 'mallanapetkitchen@gmail.com',
          instagramUrl: 'https://instagram.com/Mallanapeta_kitchen',
        },
      });
    }
    return settings;
  }
}

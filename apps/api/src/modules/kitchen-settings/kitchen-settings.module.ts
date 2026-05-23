import { Module } from '@nestjs/common';
import { KitchenSettingsService } from './kitchen-settings.service';
import { AdminKitchenSettingsController, KitchenSettingsController } from './kitchen-settings.controller';

@Module({
  controllers: [KitchenSettingsController, AdminKitchenSettingsController],
  providers: [KitchenSettingsService],
  exports: [KitchenSettingsService],
})
export class KitchenSettingsModule {}

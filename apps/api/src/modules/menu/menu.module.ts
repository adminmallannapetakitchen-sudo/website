import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { AdminMenuController, MenuController } from './menu.controller';

@Module({
  controllers: [MenuController, AdminMenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}

import { Module } from '@nestjs/common';
import { PincodesService } from './pincodes.service';
import { AdminPincodesController, PincodesController } from './pincodes.controller';

@Module({
  controllers: [PincodesController, AdminPincodesController],
  providers: [PincodesService],
  exports: [PincodesService],
})
export class PincodesModule {}

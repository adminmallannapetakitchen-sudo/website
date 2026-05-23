import { Injectable, Logger } from '@nestjs/common';
import type { SmsService } from './sms.service';

@Injectable()
export class MockSmsService implements SmsService {
  private readonly logger = new Logger('MockSmsService');

  async sendOtp(phoneE164: string, otp: string): Promise<void> {
    this.logger.log(`[MOCK SMS] OTP for ${phoneE164}: ${otp}`);
  }

  async sendTransactional(phoneE164: string, message: string): Promise<void> {
    this.logger.log(`[MOCK SMS] To ${phoneE164}: ${message}`);
  }
}

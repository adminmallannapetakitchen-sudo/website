import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SmsService } from './sms.service';

@Injectable()
export class Msg91SmsService implements SmsService {
  private readonly logger = new Logger('Msg91SmsService');

  constructor(private readonly config: ConfigService) {}

  async sendOtp(phoneE164: string, otp: string): Promise<void> {
    const authKey = this.config.get<string>('msg91.authKey');
    const templateId = this.config.get<string>('msg91.templateId');
    if (!authKey || !templateId) {
      throw new ServiceUnavailableException('MSG91 not configured');
    }

    const mobile = phoneE164.replace(/^\+/, '');
    const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${mobile}&otp=${otp}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        authkey: authKey,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`MSG91 failed: ${res.status} ${text}`);
      throw new ServiceUnavailableException('SMS provider error');
    }
  }

  async sendTransactional(phoneE164: string, message: string): Promise<void> {
    this.logger.debug(`Transactional SMS to ${phoneE164}: ${message}`);
    // Implement MSG91 flow API if needed
  }
}

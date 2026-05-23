export interface SmsService {
  sendOtp(phoneE164: string, otp: string): Promise<void>;
  sendTransactional?(phoneE164: string, message: string): Promise<void>;
}

export const SMS_SERVICE = Symbol('SMS_SERVICE');

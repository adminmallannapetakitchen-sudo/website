import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokensService } from './tokens.service';
import { GoogleVerifierService } from './google-verifier.service';
import { MockSmsService } from './sms/mock-sms.service';
import { Msg91SmsService } from './sms/msg91-sms.service';
import { SMS_SERVICE } from './sms/sms.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        secret: cs.get<string>('jwt.accessSecret'),
        signOptions: { expiresIn: cs.get<string>('jwt.accessTtl') as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    GoogleVerifierService,
    {
      provide: SMS_SERVICE,
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => {
        const authKey = cs.get<string>('msg91.authKey');
        if (authKey) return new Msg91SmsService(cs);
        return new MockSmsService();
      },
    },
  ],
  exports: [TokensService, JwtModule],
})
export class AuthModule {}

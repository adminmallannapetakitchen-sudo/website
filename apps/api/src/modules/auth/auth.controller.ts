import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginEmailDto,
  RefreshDto,
  RegisterEmailDto,
  RequestPhoneOtpDto,
  ResetPasswordDto,
  VerifyPhoneOtpDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // ─── EMAIL ───
  // L1: brute-force/abuse-sensitive — much tighter than the global limit.
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Public()
  @Post('register')
  register(@Body() dto: RegisterEmailDto, @Req() req: any) {
    return this.auth.registerWithEmail(dto.email, dto.password, dto.name, dto.phone, {
      ip: req.ip,
      ua: req.headers['user-agent'],
    });
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Public()
  @Post('login')
  login(@Body() dto: LoginEmailDto, @Req() req: any) {
    return this.auth.loginWithEmail(dto.email, dto.password, {
      ip: req.ip,
      ua: req.headers['user-agent'],
    });
  }

  // ─── GOOGLE ───
  @Public()
  @Post('google')
  google(@Body() dto: GoogleLoginDto, @Req() req: any) {
    return this.auth.loginWithGoogle(dto.idToken, { ip: req.ip, ua: req.headers['user-agent'] });
  }

  // ─── PHONE OTP ───
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post('phone/request-otp')
  requestPhoneOtp(@Body() dto: RequestPhoneOtpDto) {
    return this.auth.requestPhoneOtp(dto.phone);
  }

  // ─── ATTACH PHONE (authenticated — H-2) ───
  @Post('phone/attach/request-otp')
  addPhoneRequestOtp(@CurrentUser() user: CurrentUserPayload, @Body() dto: RequestPhoneOtpDto) {
    return this.auth.addPhoneRequestOtp(user.sub, dto.phone);
  }

  @Post('phone/attach/verify-otp')
  addPhoneVerifyOtp(@CurrentUser() user: CurrentUserPayload, @Body() dto: VerifyPhoneOtpDto) {
    return this.auth.addPhoneVerifyOtp(user.sub, dto.phone, dto.otp);
  }

  @Public()
  @Post('phone/verify-otp')
  verifyPhoneOtp(@Body() dto: VerifyPhoneOtpDto, @Req() req: any) {
    return this.auth.verifyPhoneOtp(dto.phone, dto.otp, dto.name, {
      ip: req.ip,
      ua: req.headers['user-agent'],
    });
  }

  // ─── REFRESH / LOGOUT ───
  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Req() req: any) {
    return this.auth.refresh(dto.refreshToken, { ip: req.ip, ua: req.headers['user-agent'] });
  }

  @Public()
  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  // ─── PASSWORD ───
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @Post('change-password')
  changePassword(@CurrentUser() user: CurrentUserPayload, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.sub, dto.currentPassword, dto.newPassword);
  }

  @Get('me')
  me(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }
}

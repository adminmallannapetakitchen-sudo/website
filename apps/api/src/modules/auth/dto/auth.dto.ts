import { IsEmail, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class RegisterEmailDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() name?: string;
  // H-2: capture the phone at registration so the kitchen can call for delivery.
  @IsOptional()
  @IsString()
  @Matches(/^(\+?91)?[6-9]\d{9}$/, { message: 'Invalid Indian phone number' })
  phone?: string;
}

export class LoginEmailDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

export class GoogleLoginDto {
  @IsString() idToken!: string;
}

export class RequestPhoneOtpDto {
  @IsString()
  @Matches(/^(\+?91)?[6-9]\d{9}$/, { message: 'Invalid Indian phone number' })
  phone!: string;
}

export class VerifyPhoneOtpDto {
  @IsString()
  @Matches(/^(\+?91)?[6-9]\d{9}$/, { message: 'Invalid Indian phone number' })
  phone!: string;

  @IsString() @MinLength(4) otp!: string;

  @IsOptional() @IsString() name?: string;
}

export class RefreshDto {
  @IsString() refreshToken!: string;
}

export class ForgotPasswordDto {
  @IsEmail() email!: string;
}

export class ResetPasswordDto {
  @IsString() token!: string;
  @IsString() @MinLength(8) password!: string;
}

export class ChangePasswordDto {
  @IsString() currentPassword!: string;
  @IsString() @MinLength(8) newPassword!: string;
}

import { IsBoolean, IsOptional, IsString, MaxLength, MinLength, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) name?: string;
  @IsOptional() @IsEmail() email?: string;
}

export class CreateAddressDto {
  @IsString() @MinLength(1) @MaxLength(50) label!: string;
  @IsString() @MinLength(3) @MaxLength(200) line1!: string;
  @IsOptional() @IsString() @MaxLength(200) line2?: string;
  @IsOptional() @IsString() @MaxLength(100) landmark?: string;
  @IsString() city!: string;
  @IsString() pincode!: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateAddressDto extends CreateAddressDto {}

export class UpdateNotificationPrefsDto {
  @IsOptional() @IsBoolean() sundaySpecialAlerts?: boolean;
  @IsOptional() @IsBoolean() orderUpdates?: boolean;
  @IsOptional() @IsBoolean() marketing?: boolean;
}

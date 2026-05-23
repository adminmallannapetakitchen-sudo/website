import { IsBoolean, IsDate, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @IsString() @MinLength(3) code!: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(CouponType) type!: CouponType;
  @IsNumber() @Min(0) value!: number;
  @IsOptional() @IsNumber() @Min(0) minOrderValue?: number;
  @IsOptional() @IsNumber() @Min(0) maxDiscount?: number;
  @IsOptional() @IsInt() @Min(1) totalUsageLimit?: number;
  @IsOptional() @IsInt() @Min(1) perUserLimit?: number;
  @Type(() => Date) @IsDate() validFrom!: Date;
  @Type(() => Date) @IsDate() validTo!: Date;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCouponDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(CouponType) type?: CouponType;
  @IsOptional() @IsNumber() @Min(0) value?: number;
  @IsOptional() @IsNumber() @Min(0) minOrderValue?: number;
  @IsOptional() @IsNumber() @Min(0) maxDiscount?: number;
  @IsOptional() @IsInt() @Min(1) totalUsageLimit?: number;
  @IsOptional() @IsInt() @Min(1) perUserLimit?: number;
  @IsOptional() @Type(() => Date) @IsDate() validFrom?: Date;
  @IsOptional() @Type(() => Date) @IsDate() validTo?: Date;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ValidateCouponDto {
  @IsString() code!: string;
}

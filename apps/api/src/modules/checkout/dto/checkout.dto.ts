import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class QuoteDto {
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(10000) tip?: number;
}

export class PlaceOrderDto {
  @IsString() addressId!: string;
  @IsEnum(PaymentMethod) paymentMethod!: PaymentMethod;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(10000) tip?: number;
  @IsOptional() @IsString() @MaxLength(500) specialInstructions?: string;
  // C1: client-generated, stable for the lifetime of one checkout attempt.
  // Optional for backward compat; when present, duplicate submissions return
  // the original order instead of creating/charging again.
  @IsOptional() @IsUUID() idempotencyKey?: string;
}
